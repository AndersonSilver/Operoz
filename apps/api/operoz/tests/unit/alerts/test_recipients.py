from types import SimpleNamespace
from unittest.mock import Mock, patch

import pytest

from operoz.alerts.recipients import resolve_recipients, resolve_support_recipients
from operoz.alerts.types import AlertSubject


def _issue(*, assignees=None, created_by=None):
    issue = Mock()
    issue.workspace_id = "ws-1"
    issue.project_id = "proj-1"
    issue.assignees.all.return_value = assignees or []
    issue.created_by = created_by
    issue.created_by_id = getattr(created_by, "id", None)
    return issue


@pytest.mark.unit
def test_resolve_recipients_skips_bot_users():
    human = SimpleNamespace(id="human-1", is_bot=False)
    bot = SimpleNamespace(id="bot-1", is_bot=True)
    issue = _issue(assignees=[human, bot], created_by=bot)
    subject = AlertSubject(issue=issue)
    recipients = resolve_recipients(subject, {"notify_assignees": True, "notify_creator": True})
    assert [str(user.id) for user in recipients] == ["human-1"]


@pytest.mark.unit
def test_resolve_recipients_deduplicates_users():
    user = SimpleNamespace(id="user-1", is_bot=False)
    issue = _issue(assignees=[user], created_by=user)
    subject = AlertSubject(issue=issue)
    recipients = resolve_recipients(subject, {"notify_assignees": True, "notify_creator": True})
    assert len(recipients) == 1
    assert str(recipients[0].id) == "user-1"


@pytest.mark.unit
@patch("operoz.db.models.ProjectMember")
@patch("operoz.db.models.WorkspaceMember")
@patch("operoz.db.models.User")
@patch("operoz.db.models.Project")
def test_resolve_support_recipients_includes_project_lead(
    mock_project, mock_user, mock_workspace_member, mock_project_member
):
    lead = SimpleNamespace(id="lead-1", is_bot=False)
    issue = _issue(assignees=[], created_by=None)
    intake_issue = SimpleNamespace(id="intake-1")
    subject = AlertSubject(issue=issue, intake_issue=intake_issue)

    mock_project.objects.filter.return_value.select_related.return_value.first.return_value = SimpleNamespace(
        project_lead=lead
    )
    mock_project_member.objects.filter.return_value.values_list.return_value = []
    mock_workspace_member.objects.filter.return_value.values_list.return_value = []
    mock_user.objects.filter.return_value = []

    recipients = resolve_support_recipients(subject, {"notify_project_lead": True})
    assert [str(user.id) for user in recipients] == ["lead-1"]


@pytest.mark.unit
@patch("operoz.db.models.ProjectMember")
@patch("operoz.db.models.WorkspaceMember")
@patch("operoz.db.models.User")
def test_resolve_support_recipients_includes_support_team(mock_user, mock_workspace_member, mock_project_member):
    team_member = SimpleNamespace(id="team-1", is_bot=False)
    issue = _issue(assignees=[], created_by=None)
    intake_issue = SimpleNamespace(id="intake-1")
    subject = AlertSubject(issue=issue, intake_issue=intake_issue)

    mock_project_member.objects.filter.return_value.values_list.return_value = ["team-1"]
    mock_workspace_member.objects.filter.return_value.values_list.return_value = []
    mock_user.objects.filter.return_value = [team_member]

    recipients = resolve_support_recipients(subject, {"notify_support_team": True})
    assert [str(user.id) for user in recipients] == ["team-1"]
