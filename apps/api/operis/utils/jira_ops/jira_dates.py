"""Extrai datas de início e fim dos fields retornados pela API Jira."""

from __future__ import annotations

from datetime import date
from typing import Any

from django.conf import settings

_active_cloud_id: str | None = None
_date_registry: dict[str, tuple[str | None, str]] = {}
_date_field_ids: dict[str, list[str]] = {}

START_DATE_SCORES: tuple[tuple[str, int], ...] = (
    ("start date", 100),
    ("data de início", 95),
    ("data de inicio", 95),
    ("data inicio", 90),
)
START_DATE_EXCLUDE_HINTS: tuple[str, ...] = (
    "problema",
    "pendência",
    "pendencia",
    "sla",
    "fim da",
    "fim de",
    "vencimento",
)


def set_active_jira_cloud(cloud_id: str | None) -> None:
    global _active_cloud_id
    _active_cloud_id = (cloud_id or "").strip() or None


def score_start_date_field_name(name: str) -> int:
    """Pontua campos de data para escolher o start date correto (maior = melhor)."""
    lower = (name or "").lower().strip()
    if not lower:
        return -1
    if any(hint in lower for hint in START_DATE_EXCLUDE_HINTS):
        return -1
    score = 0
    for hint, points in START_DATE_SCORES:
        if hint in lower:
            score = max(score, points)
    if score:
        return score
    if lower in {"início", "inicio", "start"}:
        return 50
    if "início" in lower or "inicio" in lower:
        return 30
    if "start" in lower:
        return 20
    return -1


def register_jira_date_fields(
    cloud_id: str,
    start_field: str | None,
    due_field: str,
    *,
    all_date_field_ids: list[str] | None = None,
) -> None:
    cid = (cloud_id or "").strip()
    _date_registry[cid] = (start_field, due_field or "duedate")
    if all_date_field_ids:
        _date_field_ids[cid] = list(dict.fromkeys(all_date_field_ids))


def _parse_jira_date(value: Any) -> date | None:
    if value is None or value == "":
        return None
    if isinstance(value, str):
        try:
            return date.fromisoformat(value[:10])
        except ValueError:
            return None
    if isinstance(value, dict):
        for key in ("start", "date", "value", "end"):
            parsed = _parse_jira_date(value.get(key))
            if parsed:
                return parsed
    return None


def _default_start_date_field_candidates() -> list[str]:
    explicit = (getattr(settings, "JIRA_OPS_START_DATE_FIELD", "") or "").strip()
    candidates: list[str] = []
    if explicit:
        candidates.append(explicit)
    candidates.extend(
        [
            "customfield_10015",
            "customfield_10008",
            "startdate",
        ]
    )
    seen: set[str] = set()
    ordered: list[str] = []
    for key in candidates:
        if key not in seen:
            seen.add(key)
            ordered.append(key)
    return ordered


def jira_search_date_fields_for_client(cloud_id: str | None = None) -> list[str]:
    cid = (cloud_id or _active_cloud_id or "").strip()
    start_field, due_field = _date_registry.get(cid, (None, "duedate"))
    fields = [due_field or "duedate"]
    if start_field and start_field not in fields:
        fields.append(start_field)
    for key in _date_field_ids.get(cid, []):
        if key not in fields:
            fields.append(key)
    for key in _default_start_date_field_candidates():
        if key not in fields:
            fields.append(key)
    return fields


def jira_search_date_fields() -> list[str]:
    return jira_search_date_fields_for_client(_active_cloud_id)


def jira_issue_dates(fields: dict) -> tuple[date | None, date | None]:
    """Retorna (start_date, target_date) para um issue Jira."""
    cid = (_active_cloud_id or "").strip()
    start_field, due_field = _date_registry.get(cid, (None, "duedate"))

    target = _parse_jira_date(fields.get(due_field or "duedate"))
    start: date | None = None

    start_candidates: list[str] = []
    if start_field:
        start_candidates.append(start_field)
    start_candidates.extend(_default_start_date_field_candidates())

    for key in start_candidates:
        if fields.get(key):
            start = _parse_jira_date(fields.get(key))
            if start:
                break

    if start is None:
        for key, value in fields.items():
            if not str(key).startswith("customfield_"):
                continue
            if key == due_field:
                continue
            parsed = _parse_jira_date(value)
            if parsed and parsed != target:
                start = parsed
                break

    return start, target
