from __future__ import annotations

from typing import Any

from operis.automation.catalog import ensure_catalog
from operis.automation.domain import DomainEvent
from operis.automation.graph_trigger import extract_trigger_from_graph
from operis.automation.rule_lifecycle import get_rule_execution_graph


def rule_trigger_matches_event(rule, event: DomainEvent) -> bool:
    graph = get_rule_execution_graph(rule)
    extracted = extract_trigger_from_graph(graph)
    if not extracted:
        return False

    catalog_key, config = extracted
    entry = ensure_catalog().get(catalog_key)
    if not entry or not entry.handler:
        return False

    try:
        return bool(entry.handler(event, config))
    except Exception:
        return False
