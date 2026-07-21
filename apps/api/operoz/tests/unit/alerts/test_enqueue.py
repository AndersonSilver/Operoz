from types import SimpleNamespace
from unittest.mock import patch

import pytest
from django.db import transaction

from operoz.alerts.enqueue import schedule_support_alert
from operoz.alerts.preferences import UserAlertPreferences


@pytest.mark.unit
@pytest.mark.django_db(transaction=True)
def test_schedule_support_alert_runs_after_commit():
    calls: list[dict] = []

    def fake_delay(**kwargs):
        calls.append(kwargs)

    with patch("operoz.bgtasks.alert_dispatch_task.dispatch_support_alert") as mock_task:
        mock_task.delay.side_effect = fake_delay

        with transaction.atomic():
            schedule_support_alert(
                intake_issue_id="intake-1",
                alert_type="support_ticket_created",
                actor_id="user-1",
            )
            assert calls == []

        assert calls == [
            {
                "intake_issue_id": "intake-1",
                "alert_type": "support_ticket_created",
                "actor_id": "user-1",
                "extra": None,
            }
        ]


@pytest.mark.unit
@pytest.mark.django_db(transaction=True)
def test_schedule_support_alert_runs_inline_when_broker_unavailable():
    with patch("operoz.bgtasks.alert_dispatch_task.dispatch_support_alert") as mock_task:
        mock_task.delay.side_effect = ConnectionError("broker down")

        schedule_support_alert(
            intake_issue_id="intake-2",
            alert_type="support_ticket_created",
        )

        mock_task.delay.assert_called_once()
        mock_task.assert_called_once_with(
            intake_issue_id="intake-2",
            alert_type="support_ticket_created",
            actor_id=None,
            extra=None,
        )


@pytest.mark.unit
@pytest.mark.django_db(transaction=True)
def test_schedule_intake_created_alert_runs_after_commit():
    calls: list[dict] = []

    def fake_delay(**kwargs):
        calls.append(kwargs)

    with patch("operoz.bgtasks.alert_dispatch_task.dispatch_support_alert") as mock_task:
        mock_task.delay.side_effect = fake_delay

        with transaction.atomic():
            schedule_support_alert(
                intake_issue_id="intake-3",
                alert_type="intake_created",
                actor_id="user-1",
            )
            assert calls == []

        assert calls == [
            {
                "intake_issue_id": "intake-3",
                "alert_type": "intake_created",
                "actor_id": "user-1",
                "extra": None,
            }
        ]


@pytest.mark.unit
def test_user_alert_preferences_default_all_channels_enabled():
    user = SimpleNamespace(id="user-1")
    prefs = UserAlertPreferences(user=user, workspace_id="ws-1", overrides={}, notification_pref=None)

    assert prefs.is_enabled("support_ticket_created", "email") is True
    assert prefs.is_enabled("support_ticket_created", "in_app") is True
    assert prefs.is_enabled("support_ticket_created", "discord_dm") is True
    assert prefs.is_enabled("support_ticket_created", "google_calendar") is True
    assert prefs.is_enabled("intake_created", "discord_dm") is True
