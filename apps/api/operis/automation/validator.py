from __future__ import annotations

from typing import Any

from operis.automation.catalog import ensure_catalog
from operis.automation.compiler import compile_graph


def validate_graph(graph: dict[str, Any], *, board_id: str | None = None) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    from operis.automation.catalog import catalog_for_board, ensure_catalog

    catalog = catalog_for_board(board_id) if board_id else ensure_catalog()

    nodes = graph.get("nodes") or []
    if not nodes:
        errors.append("Adicione pelo menos um nó ao fluxo.")
        return {"valid": False, "errors": errors, "warnings": warnings}

    triggers = [n for n in nodes if (n.get("data") or {}).get("kind") == "trigger"]
    if len(triggers) != 1:
        errors.append("O fluxo deve ter exatamente um trigger.")
    if not any((n.get("data") or {}).get("kind") == "action" for n in nodes):
        warnings.append("Nenhuma ação definida — a regra não fará nada.")

    for node in nodes:
        data = node.get("data") or {}
        kind = data.get("kind")
        key = data.get("catalog_key")
        if not key:
            errors.append(f"Nó {node.get('id')} sem catalog_key.")
            continue
        if kind == "decision":
            if key not in {"decision.switch", "decision.llm"}:
                errors.append(f"Nó de decisão {node.get('id')} deve usar decision.switch ou decision.llm.")
            branches = (data.get("config") or {}).get("branches") or []
            if not branches:
                errors.append(f"Nó de decisão {node.get('id')} precisa de pelo menos um ramo.")
            continue
        if kind == "parallel":
            if key != "parallel.fan_out":
                errors.append(f"Nó paralelo {node.get('id')} deve usar parallel.fan_out.")
            outgoing = [
                edge
                for edge in (graph.get("edges") or [])
                if edge.get("source") == node.get("id")
            ]
            if len(outgoing) < 2:
                warnings.append(f"Fan-out {node.get('id')} deve ter pelo menos dois ramos conectados.")
            continue
        if kind == "action" and key == "action.retry_until":
            max_iterations = (data.get("config") or {}).get("max_iterations", 3)
            if int(max_iterations) < 1:
                errors.append(f"retry_until {node.get('id')}: max_iterations deve ser ≥ 1.")
            continue
        entry = catalog.get(key)
        if not entry:
            errors.append(f"Tipo desconhecido: {key}")

    try:
        compile_graph(graph)
    except ValueError as exc:
        errors.append(str(exc))

    from operis.automation.graph_trigger import extract_trigger_from_graph
    from operis.automation.schedule import validate_schedule_config

    extracted = extract_trigger_from_graph(graph)
    if extracted:
        trigger_key, trigger_config = extracted
        if trigger_key == "schedule.cron":
            errors.extend(validate_schedule_config(trigger_config or {}))

    return {"valid": not errors, "errors": errors, "warnings": warnings}
