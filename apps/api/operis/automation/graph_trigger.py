from __future__ import annotations

from typing import Any


def extract_trigger_from_graph(graph: dict[str, Any]) -> tuple[str, dict[str, Any]] | None:
    for raw in graph.get("nodes") or []:
        data = raw.get("data") or {}
        kind = data.get("kind") or raw.get("type", "")
        if kind != "trigger":
            continue
        catalog_key = data.get("catalog_key") or data.get("key") or ""
        config = data.get("config") or {}
        return catalog_key, config
    return None
