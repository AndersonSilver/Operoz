import pytest

from operis.app.permissions import ROLE
from operis.assistant.security.access import (
    get_accessible_issue,
    is_project_member,
    require_workspace_member,
)
from operis.assistant.types import AssistantActorContext
from operis.db.models import Issue, Project, ProjectMember, State, WorkspaceMember


@pytest.mark.unit
@pytest.mark.django_db
class TestAssistantAccess:
    def test_require_workspace_member(self, create_user, workspace):
        ctx = AssistantActorContext(user=create_user, workspace=workspace)
        assert require_workspace_member(ctx) is True

    def test_issue_access_respects_project_membership(self, create_user, workspace, workspace_board):
        from operis.db.models import User

        outsider = create_user
        member = User.objects.create(email="member@plane.so", username="member-user")
        WorkspaceMember.objects.create(workspace=workspace, member=member, role=ROLE.MEMBER.value)

        project = Project.objects.create(
            name="P1",
            identifier="P1",
            workspace=workspace,
            board=workspace_board,
        )
        ProjectMember.objects.create(project=project, member=member, role=ROLE.ADMIN.value)

        state = State.objects.filter(project=project).first()
        if not state:
            state = State.objects.create(
                name="Todo",
                project=project,
                workspace=workspace,
                sequence=1,
                group="unstarted",
                created_by=member,
            )

        issue = Issue.objects.create(
            name="Card privado",
            project=project,
            workspace=workspace,
            state=state,
            created_by=member,
        )

        outsider_ctx = AssistantActorContext(user=outsider, workspace=workspace)
        member_ctx = AssistantActorContext(user=member, workspace=workspace)

        assert get_accessible_issue(outsider_ctx, str(issue.id)) is None
        assert get_accessible_issue(member_ctx, str(issue.id)) is not None
        assert is_project_member(member_ctx, str(project.id)) is True
        assert is_project_member(outsider_ctx, str(project.id)) is False
