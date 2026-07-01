from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable


@dataclass
class CatalogEntry:
    key: str
    kind: str  # trigger | filter | action
    label: str
    description: str
    icon: str
    config_schema: dict[str, Any] = field(default_factory=dict)
    output_schema: dict[str, Any] = field(default_factory=dict)
    handler: Callable[..., Any] | None = None


class AutomationCatalog:
    def __init__(self) -> None:
        self._entries: dict[str, CatalogEntry] = {}

    def register(self, entry: CatalogEntry) -> None:
        self._entries[entry.key] = entry

    def get(self, key: str) -> CatalogEntry | None:
        return self._entries.get(key)

    def list_by_kind(self, kind: str) -> list[CatalogEntry]:
        return [e for e in self._entries.values() if e.kind == kind]

    def copy(self) -> AutomationCatalog:
        cloned = AutomationCatalog()
        cloned._entries = dict(self._entries)
        return cloned

    def merge(self, entries: list[CatalogEntry]) -> AutomationCatalog:
        merged = self.copy()
        for entry in entries:
            merged._entries[entry.key] = entry
        return merged

    def to_api_list(self) -> dict[str, list[dict[str, Any]]]:
        result: dict[str, list[dict[str, Any]]] = {
            "triggers": [],
            "filters": [],
            "decisions": [],
            "parallel": [],
            "actions": [],
        }
        kind_map = {
            "trigger": "triggers",
            "filter": "filters",
            "decision": "decisions",
            "parallel": "parallel",
            "action": "actions",
        }
        for entry in self._entries.values():
            bucket = kind_map.get(entry.kind)
            if not bucket:
                continue
            result[bucket].append(
                {
                    "key": entry.key,
                    "label": entry.label,
                    "description": entry.description,
                    "icon": entry.icon,
                    "config_schema": entry.config_schema,
                    "output_schema": entry.output_schema,
                }
            )
        return result


catalog = AutomationCatalog()
