from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from django.utils import timezone
from django.utils.dateparse import parse_datetime

from operis.utils.support_criticality import DEFAULT_SLA_MINUTES, is_valid_criticality

DEFAULT_SUPPORT_SLA_DAYS = 7


def default_policies_payload() -> dict[str, dict[str, int]]:
    return {key: {"duration_minutes": minutes} for key, minutes in DEFAULT_SLA_MINUTES.items()}


def normalize_policies(raw: dict[str, Any] | None) -> dict[str, dict[str, int]]:
    base = default_policies_payload()
    if not raw:
        return base
    for key in base:
        entry = raw.get(key) if isinstance(raw.get(key), dict) else {}
        minutes = entry.get("duration_minutes")
        if minutes is not None:
            try:
                base[key]["duration_minutes"] = max(1, int(minutes))
            except (TypeError, ValueError):
                pass
    return base


def load_board_sla_policies(board_ids) -> dict[str, dict[str, dict[str, int]]]:
    from operis.db.models import BoardSupportSlaPolicy

    ids = [str(bid) for bid in board_ids if bid]
    if not ids:
        return {}
    rows = BoardSupportSlaPolicy.objects.filter(board_id__in=ids, deleted_at__isnull=True)
    return {str(row.board_id): normalize_policies(row.policies) for row in rows}


def get_criticality_duration_minutes(board_id, criticality: str | None, policies_map: dict | None = None) -> int | None:
    if not is_valid_criticality(criticality):
        return None
    policies = policies_map or {}
    board_policies = policies.get(str(board_id)) if board_id else None
    if not board_policies and board_id:
        loaded = load_board_sla_policies([board_id])
        board_policies = loaded.get(str(board_id))
    if board_policies and criticality in board_policies:
        return int(board_policies[criticality]["duration_minutes"])
    return DEFAULT_SLA_MINUTES.get(criticality or "")


def compute_sla_due_at(*, opened_at: datetime, duration_minutes: int) -> datetime:
    if timezone.is_naive(opened_at):
        opened_at = timezone.make_aware(opened_at, timezone.get_current_timezone())
    return opened_at + timedelta(minutes=max(duration_minutes, 1))


def parse_iso_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    parsed = parse_datetime(value)
    if parsed and timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
    return parsed


def compute_support_sla_breach(
    *,
    sla_due_at: datetime | None,
    status: int,
    closed_at: datetime | None,
    legacy_sla_days: int | None = None,
    opened_at: datetime | None = None,
) -> bool:
    now = timezone.now()
    if sla_due_at:
        reference = closed_at if status == 3 and closed_at else now
        if timezone.is_naive(reference):
            reference = timezone.make_aware(reference, timezone.get_current_timezone())
        if timezone.is_naive(sla_due_at):
            sla_due_at = timezone.make_aware(sla_due_at, timezone.get_current_timezone())
        return reference > sla_due_at

    if opened_at and legacy_sla_days:
        if timezone.is_naive(opened_at):
            opened_at = timezone.make_aware(opened_at, timezone.get_current_timezone())
        due = opened_at + timedelta(days=max(legacy_sla_days, 1))
        reference = closed_at if status == 3 and closed_at else now
        if timezone.is_naive(reference):
            reference = timezone.make_aware(reference, timezone.get_current_timezone())
        return reference > due
    return False
