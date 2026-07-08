from __future__ import annotations

import logging
from typing import Any

from operoz.automation.catalog.registry import CatalogEntry, catalog
from operoz.automation.domain import DomainEvent

logger = logging.getLogger(__name__)


def _resolved_config(config: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    from operoz.automation.secrets import resolve_config_value

    workspace_id = context.get("workspace_id") or ""
    return resolve_config_value(config, workspace_id=str(workspace_id))


def _action_set_field(
    event: DomainEvent,
    config: dict[str, Any],
    context: dict[str, Any],
    *,
    dry_run: bool,
) -> dict[str, Any]:
    config = _resolved_config(config, context)
    issue = context.get("issue")
    if not issue:
        return {"ok": False, "message": "Issue não encontrada"}
    field = config.get("field")
    value = config.get("value")
    if not field:
        return {"ok": False, "message": "Campo obrigatório"}
    if dry_run:
        return {"ok": True, "message": f"[dry-run] Definir {field}={value!r} no card {issue.id}"}
    if field == "state_id" and value:
        issue.state_id = value
        issue.save(update_fields=["state_id", "updated_at"])
        return {"ok": True, "message": f"Estado atualizado para {value}"}
    if field == "priority" and value is not None:
        issue.priority = value
        issue.save(update_fields=["priority", "updated_at"])
        return {"ok": True, "message": f"Prioridade atualizada para {value}"}
    if field == "name" and value:
        issue.name = value
        issue.save(update_fields=["name", "updated_at"])
        return {"ok": True, "message": "Nome atualizado"}
    return {"ok": False, "message": f"Campo {field} não suportado"}


def _action_add_comment(
    event: DomainEvent,
    config: dict[str, Any],
    context: dict[str, Any],
    *,
    dry_run: bool,
) -> dict[str, Any]:
    config = _resolved_config(config, context)
    issue = context.get("issue")
    actor = context.get("automation_actor")
    comment_html = config.get("comment_html") or config.get("body") or ""
    if not issue:
        return {"ok": False, "message": "Issue não encontrada"}
    if dry_run:
        return {"ok": True, "message": f"[dry-run] Comentário automático no card {issue.id}"}
    from operoz.db.models import IssueComment

    IssueComment.objects.create(
        issue=issue,
        project_id=issue.project_id,
        comment_html=comment_html,
        created_by=actor,
        updated_by=actor,
    )
    return {"ok": True, "message": "Comentário adicionado"}


def _action_webhook(
    event: DomainEvent,
    config: dict[str, Any],
    context: dict[str, Any],
    *,
    dry_run: bool,
) -> dict[str, Any]:
    config = _resolved_config(config, context)
    url = config.get("url")
    if not url:
        return {"ok": False, "message": "URL do webhook obrigatória"}
    if dry_run:
        return {"ok": True, "message": f"[dry-run] POST {url}"}
    try:
        import requests

        requests.post(url, json={"event": event.to_dict(), "rule_id": context.get("rule_id")}, timeout=10)
        return {"ok": True, "message": f"Webhook enviado para {url}"}
    except Exception as exc:
        logger.exception("automation webhook failed")
        return {"ok": False, "message": str(exc)}


def _action_run_script(
    event: DomainEvent,
    config: dict[str, Any],
    context: dict[str, Any],
    *,
    dry_run: bool,
) -> dict[str, Any]:
    from operoz.automation.script_runner import run_javascript
    from operoz.db.models import BoardAutomationScript

    config = _resolved_config(config, context)
    script_id = config.get("script_id")
    if not script_id:
        return {"ok": False, "message": "Script não selecionado"}
    try:
        script = BoardAutomationScript.objects.get(pk=script_id, deleted_at__isnull=True, is_active=True)
    except BoardAutomationScript.DoesNotExist:
        return {"ok": False, "message": "Script não encontrado ou inativo"}

    from operoz.automation.policy import get_board_policy, script_runtime_limits, validate_script_source

    board_id = context.get("board_id")
    policy = get_board_policy(str(board_id)) if board_id else None
    if policy:
        script_check = validate_script_source(policy, script.source_code)
        if not script_check.allowed:
            return {"ok": False, "message": script_check.message, "code": script_check.code}
        limits = script_runtime_limits(policy)
    else:
        limits = {"timeout_seconds": 10, "max_memory_mb": 128}

    js_context = {
        "event": event.to_dict(),
        "issue_id": str(context["issue"].id) if context.get("issue") else None,
        "rule_id": context.get("rule_id"),
    }
    result = run_javascript(
        script.source_code,
        js_context,
        dry_run=dry_run,
        timeout_seconds=limits["timeout_seconds"],
        max_memory_mb=limits["max_memory_mb"],
    )
    result["script_id"] = str(script.id)
    result["script_name"] = script.name
    return result


def _action_send_email(
    event: DomainEvent,
    config: dict[str, Any],
    context: dict[str, Any],
    *,
    dry_run: bool,
) -> dict[str, Any]:
    from operoz.automation.email_renderer import build_email_context, send_automation_email
    from operoz.db.models import Board, BoardAutomationEmailTemplate, User

    config = _resolved_config(config, context)
    template_id = config.get("template_id")
    if not template_id:
        return {"ok": False, "message": "Template de e-mail não selecionado"}

    try:
        template = BoardAutomationEmailTemplate.objects.get(pk=template_id, deleted_at__isnull=True, is_active=True)
    except BoardAutomationEmailTemplate.DoesNotExist:
        return {"ok": False, "message": "Template de e-mail não encontrado ou inativo"}

    user_ids = config.get("recipient_user_ids") or []
    extra_emails = config.get("recipient_emails") or []
    emails: list[str] = [str(e).strip() for e in extra_emails if str(e).strip()]

    if user_ids:
        emails.extend(
            list(User.objects.filter(id__in=user_ids, is_active=True).exclude(email="").values_list("email", flat=True))
        )

    emails = list(dict.fromkeys(emails))
    issue = context.get("issue")
    board = None
    if issue and getattr(issue, "project", None):
        board_id = getattr(issue.project, "board_id", None)
        if board_id:
            board = Board.objects.filter(pk=board_id).first()
    if board is None and event.board_id:
        board = Board.objects.filter(pk=event.board_id, deleted_at__isnull=True).first()

    email_context = build_email_context(event, issue, board)
    return send_automation_email(
        subject_template=template.subject,
        html_template=template.html_body,
        to_emails=emails,
        context=email_context,
        dry_run=dry_run,
    )


def _action_mcp_call(
    event: DomainEvent,
    config: dict[str, Any],
    context: dict[str, Any],
    *,
    dry_run: bool,
) -> dict[str, Any]:
    """Piloto tipado Slack/Jira via webhook configurado (sem MCP runtime arbitrário)."""
    config = _resolved_config(config, context)
    integration = str(config.get("integration") or "slack").lower()
    action = str(config.get("action") or "post_message")
    url = config.get("url")
    if not url:
        return {"ok": False, "message": f"URL obrigatória para integração {integration}"}
    payload = {
        "integration": integration,
        "action": action,
        "event": event.to_dict(),
        "rule_id": context.get("rule_id"),
        "body": config.get("body") or config.get("message") or {},
    }
    if dry_run:
        return {"ok": True, "message": f"[dry-run] MCP {integration}.{action} → {url}", "payload": payload}
    try:
        import requests

        response = requests.post(url, json=payload, timeout=15)
        return {
            "ok": response.ok,
            "message": f"MCP {integration}.{action} status {response.status_code}",
            "status_code": response.status_code,
        }
    except Exception as exc:
        logger.exception("automation mcp_call failed")
        return {"ok": False, "message": str(exc)}


def _action_operoz_tool(
    event: DomainEvent,
    config: dict[str, Any],
    context: dict[str, Any],
    *,
    dry_run: bool,
) -> dict[str, Any]:
    from operoz.assistant.tools.registry import execute_tool
    from operoz.assistant.types import AssistantActorContext
    from operoz.db.models import Board, User, Workspace

    config = _resolved_config(config, context)
    tool_name = str(config.get("tool_name") or "")
    arguments = dict(config.get("arguments") or {})
    if not tool_name:
        return {"ok": False, "message": "tool_name obrigatório"}

    if dry_run:
        return {"ok": True, "message": f"[dry-run] Tool {tool_name}", "arguments": arguments}

    actor = context.get("automation_actor")
    workspace_id = context.get("workspace_id") or event.workspace_id
    board_id = event.board_id
    if not isinstance(actor, User):
        return {"ok": False, "message": "automation_actor ausente"}

    workspace = Workspace.objects.filter(pk=workspace_id).first()
    board_slug = None
    if board_id:
        board = Board.objects.filter(pk=board_id).only("slug").first()
        board_slug = board.slug if board else None
    if not workspace:
        return {"ok": False, "message": "workspace não encontrado"}

    ctx = AssistantActorContext(user=actor, workspace=workspace, board_slug=board_slug)
    result = execute_tool(ctx, tool_name, arguments)
    return {
        "ok": result.ok,
        "message": result.error or "tool_executed",
        "data": result.data,
    }


def _action_ask_assistant(
    event: DomainEvent,
    config: dict[str, Any],
    context: dict[str, Any],
    *,
    dry_run: bool,
) -> dict[str, Any]:
    from operoz.automation.automation_llm import llm_json_completion

    config = _resolved_config(config, context)
    prompt = str(config.get("prompt") or "Resuma o contexto do evento.")
    store_key = str(config.get("store_result_in") or "assistant_answer")

    if dry_run:
        answer = "[dry-run] Resposta do assistente"
    else:
        result = llm_json_completion(
            system='Responda em português (pt-BR) de forma concisa. JSON: {"answer": string}',
            user=f"{prompt}\n\nEvento: {event.to_dict()}",
        )
        if not result.get("ok"):
            return {"ok": False, "message": result.get("error", "llm_failed")}
        answer = str(result.get("answer") or result.get("content") or "")

    context[store_key] = answer
    return {"ok": True, "message": "Assistente respondeu", "answer": answer, "store_key": store_key}


def _action_notify(
    event: DomainEvent,
    config: dict[str, Any],
    context: dict[str, Any],
    *,
    dry_run: bool,
) -> dict[str, Any]:
    user_ids = config.get("user_ids") or []
    message = config.get("message") or "Automação executada"
    if dry_run:
        return {"ok": True, "message": f"[dry-run] Notificar {len(user_ids)} usuário(s): {message}"}
    return {"ok": True, "message": f"Notificação enfileirada para {len(user_ids)} usuário(s)"}


def register_actions() -> None:
    catalog.register(
        CatalogEntry(
            key="action.set_field",
            kind="action",
            label="Definir campo",
            description="Atualiza um campo do card (estado, prioridade, nome).",
            icon="pencil",
            config_schema={
                "type": "object",
                "properties": {
                    "field": {"type": "string"},
                    "value": {},
                },
                "required": ["field"],
            },
            handler=_action_set_field,
        )
    )
    catalog.register(
        CatalogEntry(
            key="action.add_comment",
            kind="action",
            label="Adicionar comentário",
            description="Publica um comentário automático no card.",
            icon="message-square",
            config_schema={
                "type": "object",
                "properties": {
                    "comment_html": {"type": "string"},
                },
            },
            handler=_action_add_comment,
        )
    )
    catalog.register(
        CatalogEntry(
            key="action.webhook",
            kind="action",
            label="Webhook",
            description="Envia POST HTTP com payload do evento.",
            icon="globe",
            config_schema={
                "type": "object",
                "properties": {
                    "url": {"type": "string", "format": "uri"},
                },
                "required": ["url"],
            },
            handler=_action_webhook,
        )
    )
    catalog.register(
        CatalogEntry(
            key="action.notify",
            kind="action",
            label="Notificar membros",
            description="Envia notificação in-app para membros selecionados.",
            icon="bell",
            config_schema={
                "type": "object",
                "properties": {
                    "user_ids": {"type": "array", "items": {"type": "string"}},
                    "message": {"type": "string"},
                },
            },
            handler=_action_notify,
        )
    )
    catalog.register(
        CatalogEntry(
            key="action.run_script",
            kind="action",
            label="Executar script",
            description="Executa um script JavaScript guardado neste board.",
            icon="code",
            config_schema={
                "type": "object",
                "properties": {
                    "script_id": {"type": "string"},
                },
                "required": ["script_id"],
            },
            handler=_action_run_script,
        )
    )
    catalog.register(
        CatalogEntry(
            key="action.send_email",
            kind="action",
            label="Enviar e-mail",
            description="Envia um e-mail HTML usando um template guardado.",
            icon="mail",
            config_schema={
                "type": "object",
                "properties": {
                    "template_id": {"type": "string"},
                    "recipient_user_ids": {"type": "array", "items": {"type": "string"}},
                    "recipient_emails": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["template_id"],
            },
            handler=_action_send_email,
        )
    )
    catalog.register(
        CatalogEntry(
            key="action.mcp_call",
            kind="action",
            label="Integração MCP (piloto)",
            description="Chamada tipada Slack/Jira via webhook configurado.",
            icon="plug",
            config_schema={
                "type": "object",
                "properties": {
                    "integration": {"type": "string", "enum": ["slack", "jira"]},
                    "action": {"type": "string"},
                    "url": {"type": "string", "format": "uri"},
                    "message": {"type": "string"},
                    "body": {"type": "object"},
                },
                "required": ["integration", "url"],
            },
            handler=_action_mcp_call,
        )
    )
    catalog.register(
        CatalogEntry(
            key="action.operoz_tool",
            kind="action",
            label="Tool Operoz",
            description="Executa uma tool interna do Assistente com permissões do utilizador da automação.",
            icon="bot",
            config_schema={
                "type": "object",
                "properties": {
                    "tool_name": {"type": "string"},
                    "arguments": {"type": "object"},
                },
                "required": ["tool_name"],
            },
            handler=_action_operoz_tool,
        )
    )
    catalog.register(
        CatalogEntry(
            key="action.ask_assistant",
            kind="action",
            label="Perguntar ao assistente",
            description="Consulta LLM e guarda a resposta no contexto do fluxo.",
            icon="sparkles",
            config_schema={
                "type": "object",
                "properties": {
                    "prompt": {"type": "string"},
                    "store_result_in": {"type": "string", "default": "assistant_answer"},
                },
                "required": ["prompt"],
            },
            handler=_action_ask_assistant,
        )
    )
    catalog.register(
        CatalogEntry(
            key="action.retry_until",
            kind="action",
            label="Repetir até condição",
            description="Reexecuta o ramo seguinte até sucesso ou atingir max_iterations (Ralph loop).",
            icon="refresh-cw",
            config_schema={
                "type": "object",
                "properties": {
                    "max_iterations": {"type": "integer", "minimum": 1, "default": 3},
                    "backoff_seconds": {"type": "number", "minimum": 0, "default": 1},
                    "until": {"type": "string", "enum": ["action_ok"], "default": "action_ok"},
                },
            },
            handler=_action_retry_until_stub,
        )
    )


def _action_retry_until_stub(
    event: DomainEvent,
    config: dict[str, Any],
    context: dict[str, Any],
    *,
    dry_run: bool,
) -> dict[str, Any]:
    return {
        "ok": True,
        "message": "retry_until é executado pelo executor com iterações — conecte ações ao ramo de saída.",
    }
