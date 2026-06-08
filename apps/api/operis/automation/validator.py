from __future__ import annotations

from typing import Any

from operis.automation.catalog import ensure_catalog
from operis.automation.compiler import compile_graph


def validate_graph(graph: dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    ensure_catalog()

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
            if key != "decision.switch":
                errors.append(f"Nó de decisão {node.get('id')} deve usar decision.switch.")
            branches = (data.get("config") or {}).get("branches") or []
            if not branches:
                errors.append(f"Nó de decisão {node.get('id')} precisa de pelo menos um ramo.")
            continue
        entry = ensure_catalog().get(key)
        if not entry:
            errors.append(f"Tipo desconhecido: {key}")

    try:
        compile_graph(graph)
    except ValueError as exc:
        errors.append(str(exc))

    return {"valid": not errors, "errors": errors, "warnings": warnings}
