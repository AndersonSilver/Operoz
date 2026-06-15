from __future__ import annotations

import os
from typing import Any

from django.conf import settings

from operis.assistant.llm.client import chat_completion
from operis.db.models import AssistantMessage, AssistantSession

CONTEXT_SUMMARY_KEY = "thread_summary"
CONTEXT_SUMMARY_MESSAGE_COUNT_KEY = "thread_summary_message_count"


def _summarize_threshold() -> int:
    return int(getattr(settings, "ASSISTANT_HISTORY_SUMMARIZE_AFTER", 14))


def _keep_recent() -> int:
    return int(getattr(settings, "ASSISTANT_HISTORY_KEEP_RECENT", 8))


def summary_sync_enabled() -> bool:
    return str(getattr(settings, "ASSISTANT_SUMMARY_SYNC", "0")).lower() in ("1", "true", "yes")


def _message_to_llm(msg: AssistantMessage) -> dict[str, Any]:
    entry: dict[str, Any] = {"role": msg.role, "content": msg.content}
    if msg.tool_calls:
        entry["tool_calls"] = msg.tool_calls
    if msg.tool_call_id:
        entry["tool_call_id"] = msg.tool_call_id
    return entry


def _fallback_summary(messages: list[AssistantMessage]) -> str:
    lines: list[str] = []
    for msg in messages:
        role = "Usuário" if msg.role == AssistantMessage.ROLE_USER else "Assistente"
        snippet = (msg.content or "").strip().replace("\n", " ")
        if len(snippet) > 180:
            snippet = snippet[:177] + "..."
        if snippet:
            lines.append(f"- {role}: {snippet}")
    return "\n".join(lines[:20])


def summarize_message_batch(messages: list[AssistantMessage], *, use_llm: bool = True) -> str:
    if not messages:
        return ""

    if not use_llm:
        return _fallback_summary(messages)

    transcript = []
    for msg in messages:
        if msg.role == AssistantMessage.ROLE_TOOL:
            continue
        role = msg.role
        content = (msg.content or "").strip()
        if content:
            transcript.append(f"{role}: {content[:500]}")

    if not transcript:
        return _fallback_summary(messages)

    llm = chat_completion(
        [
            {
                "role": "system",
                "content": (
                    "Resuma a conversa anterior em português (pt-BR), máx. 6 frases. "
                    "Preserve fatos, IDs citados, decisões e pedidos pendentes."
                ),
            },
            {"role": "user", "content": "\n".join(transcript[-24:])},
        ],
        tools=None,
    )
    if llm.error or not (llm.content or "").strip():
        return _fallback_summary(messages)
    return llm.content.strip()


def get_persisted_summary(session: AssistantSession) -> str | None:
    ctx = session.context or {}
    summary = (ctx.get(CONTEXT_SUMMARY_KEY) or "").strip()
    if not summary:
        return None
    stored_count = int(ctx.get(CONTEXT_SUMMARY_MESSAGE_COUNT_KEY) or 0)
    current_count = session.messages.count()
    keep_recent = _keep_recent()
    if current_count - stored_count > keep_recent + 2:
        return None
    return summary


def persist_session_summary(session: AssistantSession) -> str:
    """Gera e persiste resumo LLM para threads longas (task Celery)."""
    messages = list(session.messages.order_by("created_at"))
    threshold = _summarize_threshold()
    keep_recent = _keep_recent()
    if len(messages) <= threshold:
        return ""

    older = messages[:-keep_recent]
    summary = summarize_message_batch(older, use_llm=True)
    ctx = dict(session.context or {})
    ctx[CONTEXT_SUMMARY_KEY] = summary
    ctx[CONTEXT_SUMMARY_MESSAGE_COUNT_KEY] = len(messages)
    session.context = ctx
    session.save(update_fields=["context", "updated_at"])
    return summary


def schedule_session_summarization(session_id: str) -> None:
    if summary_sync_enabled():
        return
    session = AssistantSession.objects.filter(pk=session_id).only("id").first()
    if not session:
        return
    if session.messages.count() <= _summarize_threshold():
        return

    from operis.bgtasks.assistant_deferred_task import summarize_session_task

    summarize_session_task.delay(str(session_id))


def build_llm_history(session: AssistantSession, *, use_llm_summary: bool | None = None) -> list[dict[str, Any]]:
    """Compacta threads longas antes de enviar ao modelo."""
    messages = list(session.messages.order_by("created_at"))
    threshold = _summarize_threshold()
    keep_recent = _keep_recent()

    if len(messages) <= threshold:
        return [_message_to_llm(m) for m in messages]

    older = messages[:-keep_recent]
    recent = messages[-keep_recent:]

    if use_llm_summary is None:
        use_llm_summary = summary_sync_enabled()

    if use_llm_summary:
        summary = summarize_message_batch(older, use_llm=True)
    else:
        summary = get_persisted_summary(session) or _fallback_summary(older)

    compacted: list[dict[str, Any]] = [
        {
            "role": "user",
            "content": f"[Resumo da conversa anterior — {len(older)} mensagens]\n{summary}",
        },
        {
            "role": "assistant",
            "content": "Entendido. Continuo com o contexto resumido acima.",
        },
    ]
    compacted.extend(_message_to_llm(m) for m in recent)
    return compacted
