from datetime import date, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from django.utils import timezone

from operoz.alerts.services.google_calendar import resolve_calendar_event_at


def _issue(*, target_date=None):
    issue = Mock()
    issue.target_date = target_date
    issue.project = SimpleNamespace(identifier="MAGALU", sequence_id=128)
    issue.name = "LOGIN FALHANDO"
    return issue


@pytest.mark.unit
def test_resolve_calendar_event_at_uses_support_sla():
    sla_due = timezone.now() + timedelta(hours=4)
    intake_issue = SimpleNamespace(extra={"support": {"sla_due_at": sla_due.isoformat()}})

    event_at, all_day = resolve_calendar_event_at(
        issue=_issue(),
        intake_issue=intake_issue,
        alert_type="support_ticket_created",
    )

    assert event_at == sla_due
    assert all_day is False


@pytest.mark.unit
def test_resolve_calendar_event_at_uses_issue_target_date():
    due = date(2026, 6, 27)
    event_at, all_day = resolve_calendar_event_at(
        issue=_issue(target_date=due),
        intake_issue=None,
        alert_type="due_date_approaching",
    )

    assert event_at.date() == due
    assert all_day is True


@pytest.mark.unit
def test_resolve_calendar_event_at_returns_none_without_sla_or_target_date():
    event_at, all_day = resolve_calendar_event_at(
        issue=_issue(),
        intake_issue=SimpleNamespace(extra={"support": {}}),
        alert_type="support_ticket_created",
    )

    assert event_at is None
    assert all_day is False
