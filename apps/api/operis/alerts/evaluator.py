from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import TYPE_CHECKING, Any

from django.utils import timezone

from operis.utils.board_support_sla import compute_support_sla_breach, parse_iso_datetime

if TYPE_CHECKING:
    from operis.db.models import IntakeIssue, Issue


def evaluate_due_approaching(*, target_date: date | None, today: date, threshold_days: int) -> bool:
    if target_date is None:
        return False
    days_until = (target_date - today).days
    return 0 <= days_until <= threshold_days


def evaluate_overdue(*, target_date: date | None, today: date) -> bool:
    if target_date is None:
        return False
    return target_date < today


def evaluate_no_due_date(
    *,
    target_date: date | None,
    created_at: datetime,
    grace_period_days: int,
    now: datetime | None = None,
) -> bool:
    if target_date is not None:
        return False
    reference = now or timezone.now()
    if timezone.is_naive(created_at):
        created_at = timezone.make_aware(created_at, timezone.get_current_timezone())
    return created_at <= reference - timedelta(days=max(grace_period_days, 0))


def get_matching_threshold(thresholds_days: list[int], days_until: int) -> int | None:
    if days_until < 0:
        return None
    for threshold in sorted(thresholds_days):
        if days_until == threshold:
            return threshold
    return None


def evaluate_support_sla_approaching(
    intake_issue: IntakeIssue,
    *,
    threshold_minutes: int,
    now: datetime | None = None,
) -> bool:
    reference = now or timezone.now()
    support = (intake_issue.extra or {}).get("support") or {}
    sla_due_at = parse_iso_datetime(support.get("sla_due_at"))
    if not sla_due_at:
        return False
    if intake_issue.status in (1, 3):  # accepted or closed
        return False
    remaining = sla_due_at - reference
    remaining_minutes = remaining.total_seconds() / 60
    return 0 < remaining_minutes <= threshold_minutes


def evaluate_support_sla_breached(intake_issue: IntakeIssue, *, now: datetime | None = None) -> bool:
    support = (intake_issue.extra or {}).get("support") or {}
    sla_due_at = parse_iso_datetime(support.get("sla_due_at"))
    closed_at = parse_iso_datetime(support.get("closed_at"))
    return compute_support_sla_breach(
        sla_due_at=sla_due_at,
        status=intake_issue.status,
        closed_at=closed_at,
    )


def should_dispatch_for_issue(issue: Issue) -> bool:
    state_group = getattr(getattr(issue, "state", None), "group", None)
    return state_group not in ("completed", "cancelled")


def support_scan_extra(intake_issue: IntakeIssue, alert_type: str, *, now: datetime | None = None) -> dict[str, Any]:
    reference = now or timezone.now()
    support = (intake_issue.extra or {}).get("support") or {}
    sla_due_at = parse_iso_datetime(support.get("sla_due_at"))
    extra: dict[str, Any] = {"criticality": support.get("criticality")}
    if sla_due_at:
        delta = sla_due_at - reference
        extra["minutes_until_sla"] = int(delta.total_seconds() // 60)
    if alert_type == "support_sla_breached" and sla_due_at:
        extra["minutes_overdue"] = int((reference - sla_due_at).total_seconds() // 60)
    return extra
