from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from operis.automation.email_renderer import deliver_automation_email, send_automation_email


@pytest.mark.unit
class TestAutomationEmailQueue:
    def test_dry_run_does_not_enqueue(self):
        result = send_automation_email(
            subject_template="Olá {{ issue.name }}",
            html_template="<p>{{ issue.name }}</p>",
            to_emails=["user@example.com"],
            context={"issue": {"name": "Card 1"}},
            dry_run=True,
        )
        assert result["ok"] is True
        assert result.get("dry_run") is True
        assert "queued" not in result

    @patch("operis.bgtasks.automation_email_task.send_automation_email_task.delay")
    def test_send_enqueues_on_email_queue(self, mock_delay: MagicMock):
        result = send_automation_email(
            subject_template="Assunto",
            html_template="<p>Corpo</p>",
            to_emails=["a@b.com", "c@d.com"],
            context={},
            dry_run=False,
        )
        assert result["ok"] is True
        assert result.get("queued") is True
        mock_delay.assert_called_once_with(
            subject_template="Assunto",
            html_template="<p>Corpo</p>",
            to_emails=["a@b.com", "c@d.com"],
            context={},
        )

    def test_empty_recipients(self):
        result = send_automation_email(
            subject_template="x",
            html_template="y",
            to_emails=[],
            context={},
        )
        assert result["ok"] is False

    @patch("operis.automation.email_renderer.EmailMultiAlternatives")
    @patch("operis.automation.email_renderer.get_instance_smtp_connection")
    def test_deliver_sends_smtp(self, mock_smtp, mock_email_cls):
        mock_smtp.return_value = (MagicMock(), "noreply@operis.local")
        msg = MagicMock()
        mock_email_cls.return_value = msg

        result = deliver_automation_email(
            subject_template="Hi",
            html_template="<p>Hi</p>",
            to_emails=["user@example.com"],
            context={},
        )
        assert result["ok"] is True
        msg.send.assert_called_once()
