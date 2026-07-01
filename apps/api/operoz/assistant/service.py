from __future__ import annotations

import time
from typing import Any

from django.conf import settings
from django.db import transaction

from operoz.assistant.agent_orchestrator import decompose_complex_query, format_orchestration_block
from operoz.assistant.llm.client import parse_tool_arguments, stream_chat_completion
from operoz.assistant.prompts import build_system_prompt
from operoz.assistant.retrieval import build_rag_context_block, hybrid_retrieve
from operoz.assistant.security.audit import log_assistant_action
from operoz.assistant.security.confirmation import is_proposal_tool, proposal_metadata_key
from operoz.assistant.security.sanitize import sanitize_assistant_content
from operoz.assistant.thread_summarization import build_llm_history, schedule_session_summarization
from operoz.assistant.tool_router import build_tool_route_plan
from operoz.assistant.quality import record_assistant_response
from operoz.assistant.observability import record_chat_outcome
from operoz.assistant.usage import estimate_tokens, get_usage_summary, record_assistant_usage
from operoz.db.models import AssistantActionAudit
from operoz.assistant.security.access import require_workspace_member
from operoz.assistant.llm.concurrency import release_llm_slot, try_acquire_llm_slot
from operoz.assistant.security.rate_limit import (
    _assistant_limits,
    acquire_active_chat,
    check_assistant_rate_limit,
    record_assistant_message,
    release_active_chat,
)
from operoz.assistant.tools import handlers as _tool_handlers  # noqa: F401
from operoz.assistant.llm.http_client import llm_error_message, llm_user_message
from operoz.assistant.tools.registry import execute_tool, list_openai_tools
from operoz.assistant.types import AssistantActorContext
from operoz.db.models import AssistantMessage, AssistantSession, Board


def _chat_error_event(code: str, message: str, *, retry_after: int = 0) -> dict[str, Any]:
    record_chat_outcome(success=False)
    event: dict[str, Any] = {"type": "error", "error": code, "message": message}
    if retry_after:
        event["retry_after"] = retry_after
    return event


class AssistantServiceError(Exception):
    def __init__(self, code: str, message: str, *, retry_after: int = 0):
        self.code = code
        self.message = message
        self.retry_after = retry_after
        super().__init__(message)


def _actor_from_session(session: AssistantSession) -> AssistantActorContext:
    ctx_data = session.context or {}
    return AssistantActorContext(
        user=session.user,
        workspace=session.workspace,
        board_slug=ctx_data.get("board_slug"),
        project_id=ctx_data.get("project_id"),
    )


def _merge_citations(existing: list, new: list) -> list:
    seen = {f"{c.get('type')}:{c.get('id')}" for c in existing}
    out = list(existing)
    for c in new:
        key = f"{c.get('type')}:{c.get('id')}"
        if key not in seen:
            seen.add(key)
            out.append(c)
    return out


def _session_scope_required() -> bool:
    return str(getattr(settings, "ASSISTANT_REQUIRE_SESSION_SCOPE", "1")).lower() not in ("0", "false", "no")


def _validate_session_scope(ctx: AssistantActorContext) -> None:
    if not _session_scope_required():
        return
    if not ctx.project_id:
        raise AssistantServiceError(
            "context_required",
            "Selecione um projeto antes de enviar mensagens ao assistente.",
        )
    has_boards = Board.objects.filter(workspace_id=ctx.workspace.id, deleted_at__isnull=True).exists()
    if has_boards and not ctx.board_slug:
        raise AssistantServiceError(
            "context_required",
            "Selecione um board antes de enviar mensagens ao assistente.",
        )


def _validate_chat_request(
    session: AssistantSession,
    user_message: str,
    *,
    chat_holder_id: str | None = None,
) -> str:
    enabled, _, _ = _assistant_limits()
    if not enabled:
        raise AssistantServiceError("assistant_disabled", "Assistente desabilitado nesta instância")

    ctx = _actor_from_session(session)
    if not require_workspace_member(ctx):
        raise AssistantServiceError("forbidden", "Sem acesso ao workspace")

    _validate_session_scope(ctx)

    allowed, reason, retry_after = check_assistant_rate_limit(str(session.workspace_id), str(session.user_id))
    if not allowed:
        message = "Limite de mensagens atingido"
        if reason == "concurrent_rate_limit":
            message = "Já existe um chat activo. Aguarde a resposta anterior."
        raise AssistantServiceError(reason, message, retry_after=retry_after)

    user_message = (user_message or "").strip()
    if not user_message:
        raise AssistantServiceError("empty_message", "Mensagem vazia")

    if chat_holder_id and not acquire_active_chat(
        str(session.workspace_id),
        str(session.user_id),
        chat_holder_id,
    ):
        raise AssistantServiceError(
            "concurrent_rate_limit",
            "Já existe um chat activo. Aguarde a resposta anterior.",
            retry_after=30,
        )
    return user_message


def validate_chat_request(
    session: AssistantSession,
    user_message: str,
    *,
    chat_holder_id: str | None = None,
) -> str:
    """Validação pública para enqueue assíncrono de chat."""
    return _validate_chat_request(session, user_message, chat_holder_id=chat_holder_id)


def iter_chat_events(
    session: AssistantSession,
    user_message: str,
    *,
    stream: bool = False,
    chat_holder_id: str | None = None,
    skip_llm_wait: bool = False,
):
    """Yield chat lifecycle events for SSE consumers."""
    holder_id = chat_holder_id or str(session.id)
    llm_slot_held = False
    try:
        user_message = _validate_chat_request(session, user_message, chat_holder_id=holder_id)
    except AssistantServiceError as exc:
        yield _chat_error_event(exc.code, exc.message, retry_after=exc.retry_after)
        return

    if not skip_llm_wait:
        if not try_acquire_llm_slot(holder_id):
            release_active_chat(str(session.workspace_id), str(session.user_id), holder_id)
            yield _chat_error_event(
                "llm_capacity",
                "Assistente ocupado. Tente novamente em instantes.",
                retry_after=15,
            )
            return
        llm_slot_held = True

    degraded_mode_active = False
    try:
        yield from _iter_chat_events_body(
            session,
            user_message,
            stream=stream,
            degraded_mode_out=[degraded_mode_active],
        )
    finally:
        if llm_slot_held:
            release_llm_slot(holder_id)
        release_active_chat(str(session.workspace_id), str(session.user_id), holder_id)


def _iter_chat_events_body(
    session: AssistantSession,
    user_message: str,
    *,
    stream: bool,
    degraded_mode_out: list[bool],
):
    ctx = _actor_from_session(session)
    route = build_tool_route_plan(user_message)
    intent = route.intent
    rag_chunks = []
    rag_context = ""
    if route.use_rag:
        rag_chunks = hybrid_retrieve(ctx, user_message)
        if rag_chunks:
            rag_context = f"\n\n{build_rag_context_block(rag_chunks)}"

    orchestration_block = ""
    orchestration_plan = decompose_complex_query(user_message)
    if orchestration_plan:
        orchestration_block = format_orchestration_block(orchestration_plan)

    usage_summary = get_usage_summary(session.workspace)
    budget_warning = ""
    if usage_summary.get("budget_alert"):
        budget_warning = (
            f" Atenção: uso de tokens hoje em {int(usage_summary.get('today_utilization', 0) * 100)}% "
            f"do budget diário ({usage_summary.get('daily_token_budget')})."
        )

    router_hint = route.hint + budget_warning
    if route.confirmation_tools:
        names = ", ".join(sorted(route.confirmation_tools))
        router_hint = f"{router_hint} Ferramentas com confirmação humana no UI: {names}."

    AssistantMessage.objects.create(
        session=session,
        role=AssistantMessage.ROLE_USER,
        content=user_message,
    )

    if not session.title:
        session.title = user_message[:80]
        session.save(update_fields=["title", "updated_at"])

    llm_messages: list[dict[str, Any]] = [
        {
            "role": "system",
            "content": build_system_prompt(
                ctx,
                rag_context=rag_context,
                intent=intent,
                router_hint=router_hint,
                orchestration_block=orchestration_block,
            ),
        },
        *build_llm_history(session),
    ]

    tools = list_openai_tools(route.tool_names)
    max_rounds = getattr(settings, "ASSISTANT_MAX_TOOL_ROUNDS", 5)
    all_citations: list[dict[str, Any]] = [chunk.citation for chunk in rag_chunks]
    tools_used: list[str] = []
    aux_metadata: dict[str, Any] = {}
    final_content = ""
    final_model: str | None = None
    chat_started = time.perf_counter()
    first_token_ms: int | None = None

    for _ in range(max_rounds):
        tool_calls: list[dict[str, Any]] | None = None
        round_content = ""
        round_model: str | None = None

        for event in stream_chat_completion(llm_messages, tools=tools, workspace=session.workspace):
            if event["type"] == "degraded_mode":
                degraded_mode_out[0] = bool(event.get("active"))
                if stream:
                    yield event
                continue
            if event["type"] == "token":
                if first_token_ms is None:
                    first_token_ms = int((time.perf_counter() - chat_started) * 1000)
                round_content += event["content"]
                if stream:
                    yield event
            elif event["type"] == "tool_calls":
                if first_token_ms is None:
                    first_token_ms = int((time.perf_counter() - chat_started) * 1000)
                tool_calls = event["tool_calls"]
                round_content = event.get("content") or round_content
                round_model = event.get("model")
            elif event["type"] == "complete":
                if first_token_ms is None:
                    first_token_ms = int((time.perf_counter() - chat_started) * 1000)
                round_content = event["content"]
                round_model = event.get("model")
            elif event["type"] == "error":
                code = event.get("code", "llm_request_failed")
                detail = event.get("detail")
                yield _chat_error_event(
                    str(code),
                    llm_user_message(str(code), detail=str(detail) if detail else None),
                )
                return

        if tool_calls:
            AssistantMessage.objects.create(
                session=session,
                role=AssistantMessage.ROLE_ASSISTANT,
                content=round_content or "",
                tool_calls=tool_calls,
                metadata={"model": round_model},
            )
            llm_messages.append(
                {
                    "role": "assistant",
                    "content": round_content or "",
                    "tool_calls": tool_calls,
                }
            )

            for tc in tool_calls:
                fn = tc.get("function") or {}
                tool_name = fn.get("name", "")
                args = parse_tool_arguments(fn.get("arguments", "{}"))
                tools_used.append(tool_name)
                yield {"type": "tool_start", "tool": tool_name}
                tool_result = execute_tool(ctx, tool_name, args)
                all_citations = _merge_citations(all_citations, tool_result.citations)
                if is_proposal_tool(tool_name) and tool_result.ok:
                    meta_key = proposal_metadata_key(tool_name)
                    if meta_key:
                        proposal = (tool_result.data or {}).get(meta_key)
                        if proposal:
                            aux_metadata[meta_key] = proposal
                    log_assistant_action(
                        workspace=session.workspace,
                        user=session.user,
                        session=session,
                        tool_name=tool_name,
                        action_type="proposal",
                        status=AssistantActionAudit.STATUS_PROPOSED,
                        payload=args,
                    )
                else:
                    log_assistant_action(
                        workspace=session.workspace,
                        user=session.user,
                        session=session,
                        tool_name=tool_name,
                        action_type="tool_call",
                        status=AssistantActionAudit.STATUS_OK if tool_result.ok else AssistantActionAudit.STATUS_FAILED,
                        payload={"args": args, "error": tool_result.error},
                        error_code=tool_result.error or "",
                    )
                yield {"type": "tool_end", "tool": tool_name, "ok": tool_result.ok}

                tool_content = tool_result.to_llm_content()
                AssistantMessage.objects.create(
                    session=session,
                    role=AssistantMessage.ROLE_TOOL,
                    content=tool_content,
                    tool_call_id=tc.get("id", ""),
                    metadata={"tool": tool_name},
                )
                llm_messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc.get("id", ""),
                        "content": tool_content,
                    }
                )
            continue

        final_content = sanitize_assistant_content(round_content)
        final_model = round_model
        record_assistant_usage(
            session.workspace,
            prompt_tokens=estimate_tokens(user_message) + sum(estimate_tokens(m.get("content", "")) for m in llm_messages),
            completion_tokens=estimate_tokens(final_content),
        )
        break
    else:
        yield _chat_error_event(
            "tool_loop_exhausted",
            "Número máximo de chamadas de ferramentas atingido",
        )
        return

    if not final_content:
        yield _chat_error_event("empty_response", "Resposta vazia do modelo")
        return

    assistant_message = AssistantMessage.objects.create(
        session=session,
        role=AssistantMessage.ROLE_ASSISTANT,
        content=final_content,
        citations=all_citations,
        metadata={
            "model": final_model,
            "tools_used": tools_used,
            "intent": intent,
            "route_surface": route.surface,
            "rag_chunk_count": len(rag_chunks),
            "orchestrated": bool(orchestration_plan),
            "usage_today_tokens": usage_summary.get("today_tokens"),
            "budget_alert": usage_summary.get("budget_alert"),
            "first_token_ms": first_token_ms,
            "degraded_mode": degraded_mode_out[0],
            **aux_metadata,
        },
    )
    record_assistant_response(
        session.workspace,
        used_tools=bool(tools_used),
        first_token_ms=first_token_ms,
    )
    record_chat_outcome(success=True)
    record_assistant_message(str(session.workspace_id), str(session.user_id))
    schedule_session_summarization(str(session.id))
    session.refresh_from_db()

    from operoz.app.serializers.assistant import AssistantMessageSerializer, AssistantSessionSerializer

    yield {
        "type": "done",
        "message": AssistantMessageSerializer(assistant_message).data,
        "session": AssistantSessionSerializer(session).data,
    }


def confirm_assistant_action(session: AssistantSession, proposal: dict) -> dict:
    from operoz.assistant.confirmed_actions import execute_confirmed_action
    from operoz.assistant.security.confirmation import EXECUTABLE_CONFIRMED_ACTIONS

    action_type = str(proposal.get("action_type") or "")
    if action_type not in EXECUTABLE_CONFIRMED_ACTIONS:
        raise AssistantServiceError("invalid_action_type", "Tipo de ação inválido")

    ctx = _actor_from_session(session)
    if not require_workspace_member(ctx):
        raise AssistantServiceError("forbidden", "Sem acesso ao workspace")

    result = execute_confirmed_action(ctx, proposal)
    log_assistant_action(
        workspace=session.workspace,
        user=session.user,
        session=session,
        tool_name=f"confirm_{action_type}",
        action_type=action_type,
        status=AssistantActionAudit.STATUS_OK if result.get("ok") else AssistantActionAudit.STATUS_FAILED,
        payload=proposal,
        error_code=str(result.get("error") or ""),
    )
    if not result.get("ok"):
        raise AssistantServiceError(str(result.get("error") or "action_failed"), "Não foi possível executar a ação")
    return result


@transaction.atomic
def run_chat(session: AssistantSession, user_message: str) -> AssistantMessage:
    assistant_message: AssistantMessage | None = None
    for event in iter_chat_events(session, user_message, stream=False):
        if event["type"] == "error":
            raise AssistantServiceError(event["error"], event.get("message", event["error"]))
        if event["type"] == "done":
            assistant_message = AssistantMessage.objects.get(pk=event["message"]["id"])

    if not assistant_message:
        raise AssistantServiceError("empty_response", "Resposta vazia do modelo")
    return assistant_message
