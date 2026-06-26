import pytest

from operis.alerts.access import user_can_receive_issue_alert
from operis.app.permissions import ROLE


class _FakeUser:
    def __init__(self, user_id: str, *, is_active: bool = True):
        self.id = user_id
        self.is_active = is_active


class _FakeIssue:
    def __init__(self, *, workspace_id: str, project_id: str, created_by_id: str):
        self.workspace_id = workspace_id
        self.project_id = project_id
        self.created_by_id = created_by_id


@pytest.mark.unit
def test_guest_can_receive_own_issue_alert(mocker):
    issue = _FakeIssue(workspace_id="ws-1", project_id="proj-1", created_by_id="user-guest")
    user = _FakeUser("user-guest")
    mocker.patch(
        "operis.alerts.access.WorkspaceMember.objects.filter",
        return_value=mocker.Mock(exists=lambda: False),
    )
    member = mocker.Mock(role=ROLE.GUEST.value, is_active=True)
    mocker.patch(
        "operis.alerts.access.ProjectMember.objects.filter",
        return_value=mocker.Mock(first=lambda: member),
    )
    assert user_can_receive_issue_alert(user=user, issue=issue) is True


@pytest.mark.unit
def test_guest_cannot_receive_other_issue_alert(mocker):
    issue = _FakeIssue(workspace_id="ws-1", project_id="proj-1", created_by_id="user-other")
    user = _FakeUser("user-guest")
    mocker.patch(
        "operis.alerts.access.WorkspaceMember.objects.filter",
        return_value=mocker.Mock(exists=lambda: False),
    )
    member = mocker.Mock(role=ROLE.GUEST.value, is_active=True)
    mocker.patch(
        "operis.alerts.access.ProjectMember.objects.filter",
        return_value=mocker.Mock(first=lambda: member),
    )
    assert user_can_receive_issue_alert(user=user, issue=issue) is False


@pytest.mark.unit
def test_workspace_admin_can_receive_any_issue_alert(mocker):
    issue = _FakeIssue(workspace_id="ws-1", project_id="proj-1", created_by_id="user-other")
    user = _FakeUser("user-admin")
    mocker.patch(
        "operis.alerts.access.WorkspaceMember.objects.filter",
        return_value=mocker.Mock(exists=lambda: True),
    )
    assert user_can_receive_issue_alert(user=user, issue=issue) is True
