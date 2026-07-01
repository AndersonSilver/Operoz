from __future__ import annotations

import json
from typing import Any

from operoz.assistant.llm.client import chat_completion
from operoz.automation.automation_llm import llm_json_completion
from operoz.automation.dry_run_event import resolve_board_test_event
from operoz.automation.domain import DomainEvent
from operoz.automation.executor import execute_graph
from operoz.automation.validator import validate_graph
from operoz.db.models import Board, BoardAutomationRun, User


GRAPH_SYSTEM = """Você gera grafos de automação Operoz em JSON.
Formato: {"name": string, "description": string, "graph": {"nodes": [...], "edges": [...]}}.
Cada nó data: kind (trigger|filter|decision|action), catalog_key, label, config.
Use apenas catalog_keys existentes: issue.created, issue.updated, schedule.cron, filter.state,
filter.project, action.notify, action.send_email, action.webhook, decision.switch, parallel.fan_out.
Exatamente um trigger. Responda APENAS JSON válido."""


def propose_automation_rule_from_nl(
    *,
    board: Board,
    description: str,
    actor: User,
    run_dry_run: bool = True,
) -> dict[str, Any]:
    user_prompt = f"Board: {board.name}\nPedido: {description}"
    result = llm_json_completion(
        system=GRAPH_SYSTEM,
        user=user_prompt,
        dry_run=False,
    )
    if not result.get("ok"):
        return {"ok": False, "error": result.get("error", "llm_failed")}

    name = str(result.get("name") or "Regra proposta pelo Assistente")
    rule_description = str(result.get("description") or description[:500])
    graph = result.get("graph") or {}
    if not isinstance(graph, dict):
        return {"ok": False, "error": "invalid_graph"}

    validation = validate_graph(graph, board_id=str(board.id))
    payload: dict[str, Any] = {
        "ok": validation["valid"],
        "name": name,
        "description": rule_description,
        "graph": graph,
        "validation": validation,
        "board_slug": board.slug,
    }

    if validation["valid"] and run_dry_run:
        event = DomainEvent.create(
            event_type="issue.created",
            workspace_id=str(board.workspace_id),
            board_id=str(board.id),
            actor_id=str(actor.id),
            entity_type="issue",
            entity_id="00000000-0000-0000-0000-000000000099",
            project_id=None,
            payload={},
        )
        event, issue = resolve_board_test_event(board, event)
        if issue is not None:
            payload["dry_run"] = execute_graph(
                graph,
                event,
                rule_id="proposal",
                automation_actor=actor,
                dry_run=True,
            )
    return payload


def find_automation_run_for_explanation(
    *,
    board: Board,
    run_id: str | None = None,
    rule_name: str | None = None,
) -> BoardAutomationRun | None:
    qs = (
        BoardAutomationRun.objects.filter(board=board, deleted_at__isnull=True)
        .select_related("rule")
        .order_by("-created_at")
    )
    if run_id:
        return qs.filter(pk=run_id).first()
    if rule_name:
        needle = rule_name.strip()
        if needle:
            return qs.filter(rule__name__icontains=needle).first()
    return qs.filter(status=BoardAutomationRun.STATUS_FAILED, dry_run=False).first()


def explain_automation_run_steps(*, run: BoardAutomationRun) -> dict[str, Any]:
    steps = run.step_logs or []
    system = (
        "Explique em português (pt-BR), em tom Operoz, o que aconteceu nesta execução de automação. "
        "Seja conciso (máx. 8 frases). Mencione falhas e hooks se existirem."
    )
    user = json.dumps(
        {
            "rule_name": run.rule.name if run.rule_id else None,
            "status": run.status,
            "event_type": run.event_type,
            "error_message": run.error_message,
            "steps": steps[:40],
        },
        default=str,
    )[:12000]

    llm = chat_completion(
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        tools=None,
    )
    if llm.error:
        return {"ok": False, "error": llm.error}
    return {
        "ok": True,
        "explanation": (llm.content or "").strip(),
        "run_id": str(run.id),
        "status": run.status,
    }
