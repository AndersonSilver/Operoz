from __future__ import annotations

from typing import Any

from operoz.automation.catalog.registry import CatalogEntry, catalog
from operoz.automation.domain import DomainEvent


def _filter_project(event: DomainEvent, config: dict[str, Any], context: dict[str, Any]) -> bool:
    project_ids = config.get("project_ids") or []
    if not project_ids:
        return True
    return event.project_id in [str(p) for p in project_ids]


def _filter_state(event: DomainEvent, config: dict[str, Any], context: dict[str, Any]) -> bool:
    states = config.get("state_ids") or []
    if not states:
        return True
    issue = context.get("issue")
    if not issue:
        return False
    state_id = str(getattr(issue, "state_id", "") or "")
    return state_id in [str(s) for s in states]


def _filter_assignee(event: DomainEvent, config: dict[str, Any], context: dict[str, Any]) -> bool:
    assignee_ids = config.get("assignee_ids") or []
    if not assignee_ids:
        return True
    issue = context.get("issue")
    if not issue:
        return False
    current = {str(a.id) for a in issue.assignees.all()}
    expected = {str(a) for a in assignee_ids}
    mode = config.get("mode", "any")
    if mode == "all":
        return expected.issubset(current)
    return bool(current & expected)


def _filter_field_changed(event: DomainEvent, config: dict[str, Any], context: dict[str, Any]) -> bool:
    fields = config.get("fields") or []
    if not fields:
        return True
    changes = event.payload.get("changed_fields") or []
    return any(f in changes for f in fields)


def register_filters() -> None:
    catalog.register(
        CatalogEntry(
            key="filter.project",
            kind="filter",
            label="Projeto",
            description="Limita a regra a projetos específicos.",
            icon="folder",
            config_schema={
                "type": "object",
                "properties": {
                    "project_ids": {"type": "array", "items": {"type": "string"}},
                },
            },
            handler=_filter_project,
        )
    )
    catalog.register(
        CatalogEntry(
            key="filter.state",
            kind="filter",
            label="Estado",
            description="Filtra pelo estado atual do card.",
            icon="circle-dot",
            config_schema={
                "type": "object",
                "properties": {
                    "state_ids": {"type": "array", "items": {"type": "string"}},
                },
            },
            handler=_filter_state,
        )
    )
    catalog.register(
        CatalogEntry(
            key="filter.assignee",
            kind="filter",
            label="Responsável",
            description="Filtra por responsáveis do card.",
            icon="user",
            config_schema={
                "type": "object",
                "properties": {
                    "assignee_ids": {"type": "array", "items": {"type": "string"}},
                    "mode": {"type": "string", "enum": ["any", "all"], "default": "any"},
                },
            },
            handler=_filter_assignee,
        )
    )
    catalog.register(
        CatalogEntry(
            key="filter.field_changed",
            kind="filter",
            label="Campo alterado",
            description="Só passa se campos específicos mudaram.",
            icon="edit",
            config_schema={
                "type": "object",
                "properties": {
                    "fields": {"type": "array", "items": {"type": "string"}},
                },
            },
            handler=_filter_field_changed,
        )
    )
