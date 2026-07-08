from __future__ import annotations


from operoz.automation.catalog import ensure_catalog
from operoz.automation.domain import DomainEvent
from operoz.automation.graph_trigger import extract_trigger_from_graph
from operoz.automation.rule_lifecycle import get_rule_execution_graph


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
