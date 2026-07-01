from datetime import date, datetime, timedelta

import pytest
from django.utils import timezone

from operoz.alerts.evaluator import (
    evaluate_due_approaching,
    evaluate_no_due_date,
    evaluate_overdue,
    evaluate_support_sla_approaching,
    evaluate_support_sla_breached,
    get_matching_threshold,
)
from operoz.db.models.intake import IntakeIssueStatus


class _FakeIntakeIssue:
    def __init__(self, *, status=IntakeIssueStatus.ACCEPTED, extra=None):
        self.status = status
        self.extra = extra or {}


@pytest.mark.unit
def test_evaluate_due_approaching():
    today = date(2024, 1, 10)
    target = today + timedelta(days=3)
    assert evaluate_due_approaching(target_date=target, today=today, threshold_days=7) is True
    assert evaluate_due_approaching(target_date=today + timedelta(days=10), today=today, threshold_days=7) is False


@pytest.mark.unit
def test_evaluate_overdue():
    today = date(2024, 1, 10)
    assert evaluate_overdue(target_date=today - timedelta(days=1), today=today) is True
    assert evaluate_overdue(target_date=today + timedelta(days=1), today=today) is False


@pytest.mark.unit
def test_evaluate_no_due_date_grace():
    now = timezone.now()
    assert evaluate_no_due_date(
        target_date=None,
        created_at=now - timedelta(days=5),
        grace_period_days=3,
        now=now,
    )
    assert not evaluate_no_due_date(
        target_date=None,
        created_at=now,
        grace_period_days=3,
        now=now,
    )


@pytest.mark.unit
def test_get_matching_threshold():
    assert get_matching_threshold([7, 3, 1], 3) == 3
    assert get_matching_threshold([7, 3, 1], 5) is None


@pytest.mark.unit
def test_support_sla_approaching():
    now = timezone.now()
    sla_due = (now + timedelta(minutes=30)).isoformat()
    intake = _FakeIntakeIssue(status=IntakeIssueStatus.PENDING, extra={"support": {"sla_due_at": sla_due}})
    assert evaluate_support_sla_approaching(intake, threshold_minutes=60, now=now) is True


@pytest.mark.unit
def test_support_sla_breached_active_ticket():
    now = timezone.now()
    sla_due = (now - timedelta(minutes=5)).isoformat()
    active = _FakeIntakeIssue(status=IntakeIssueStatus.PENDING, extra={"support": {"sla_due_at": sla_due}})
    assert evaluate_support_sla_breached(active, now=now) is True
