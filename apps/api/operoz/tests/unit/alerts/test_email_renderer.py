from types import SimpleNamespace
from unittest.mock import Mock, patch

import pytest

from operoz.alerts.email_renderer import build_alert_email_context


def _issue(*, name="Falha no checkout", sequence_id=135):
    project = SimpleNamespace(identifier="MAGALU", name="MAGALU")
    workspace = SimpleNamespace(slug="operoz")
    issue = Mock()
    issue.sequence_id = sequence_id
    issue.name = name
    issue.project = project
    issue.workspace = workspace
    issue.workspace_id = "ws-1"
    issue.id = "issue-1"
    issue.assignees.all.return_value = [SimpleNamespace(display_name="Anderson Silveira")]
    return issue


@pytest.mark.unit
def test_build_alert_email_context_support_includes_details():
    issue = _issue()
    intake = SimpleNamespace(
        extra={
            "support": {
                "criticality": "p0",
                "ticket_number": "12345",
                "sla_due_at": "2026-06-27T12:18:00+00:00",
            },
            "submission": {"client": "MAGALU"},
        },
        created_by_id=None,
        source_email="",
        support_queue=None,
        issue=issue,
    )

    with patch("operoz.alerts.email_renderer._load_intake_issue", return_value=intake):
        with patch("operoz.alerts.email_renderer._support_payload") as mock_payload:
            mock_payload.return_value = {
                "client": "MAGALU",
                "criticality": "p0",
                "criticality_label": "P0 — CRÍTICO",
                "ticket_number": "12345",
                "reporter": "Anderson Silveira",
                "queue": None,
                "sla_due_at": "2026-06-27 12:18",
            }
            context = build_alert_email_context(
                issue=issue,
                alert_type="support_ticket_created",
                issue_url="https://app/operoz/issues/1",
                extra={},
            )

    assert context["is_support_alert"] is True
    assert context["content_intro"]
    assert context["support_details"]["client"] == "MAGALU"
    assert context["support_details"]["criticality_label"] == "P0 — CRÍTICO"
    assert context["support_details"]["assignee"] == "Anderson Silveira"


@pytest.mark.unit
def test_build_alert_email_context_generic_issue():
    issue = _issue(name="Card simples", sequence_id=10)
    context = build_alert_email_context(
        issue=issue,
        alert_type="issue_created",
        issue_url="https://app/operoz/issues/10",
        extra={},
    )

    assert context["is_support_alert"] is False
    assert context["support_details"] is None
    assert context["issue_identifier"] == "MAGALU-10"
