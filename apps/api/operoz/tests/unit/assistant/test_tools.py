import pytest

from operoz.app.permissions import ROLE
from operoz.assistant.tools.registry import execute_tool
from operoz.assistant.types import AssistantActorContext
from operoz.db.models import Issue, Project, ProjectMember, State, WorkspaceMember


@pytest.mark.unit
@pytest.mark.django_db
class TestAssistantTools:
    def test_search_issues_denied_without_project_access(self, create_user, workspace, workspace_board):
        from operoz.db.models import User

        owner = User.objects.create(email="owner@plane.so", username="owner-user")
        WorkspaceMember.objects.create(workspace=workspace, member=owner, role=ROLE.ADMIN.value)

        project = Project.objects.create(
            name="Secret",
            identifier="SEC",
            workspace=workspace,
            board=workspace_board,
        )
        ProjectMember.objects.create(project=project, member=owner, role=ROLE.ADMIN.value)
        state = State.objects.create(
            name="Todo",
            project=project,
            workspace=workspace,
            sequence=1,
            group="unstarted",
            created_by=owner,
        )
        Issue.objects.create(
            name="Sustentação crítica",
            project=project,
            workspace=workspace,
            state=state,
            created_by=owner,
        )

        outsider = User.objects.create(email="outsider@plane.so", username="outsider-user")
        WorkspaceMember.objects.create(workspace=workspace, member=outsider, role=ROLE.MEMBER.value)

        ctx = AssistantActorContext(user=outsider, workspace=workspace)
        result = execute_tool(ctx, "search_issues", {"query": "Sustentação"})
        assert result.ok is True
        assert result.data["count"] == 0

        member_ctx = AssistantActorContext(user=owner, workspace=workspace)
        result_owner = execute_tool(member_ctx, "search_issues", {"query": "Sustentação"})
        assert result_owner.ok is True
        assert result_owner.data["count"] == 1

    def test_list_board_projects(self, create_user, workspace, workspace_board):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=create_user,
            defaults={"role": ROLE.ADMIN.value},
        )
        project = Project.objects.create(
            name="Cliente A",
            identifier="CLA",
            workspace=workspace,
            board=workspace_board,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=ROLE.ADMIN.value)

        ctx = AssistantActorContext(
            user=create_user,
            workspace=workspace,
            board_slug=workspace_board.slug,
        )
        result = execute_tool(ctx, "list_board_projects", {"board_slug": workspace_board.slug})
        assert result.ok is True
        assert result.data["count"] == 1
        assert result.data["projects"][0]["identifier"] == "CLA"

    def test_get_project_stats(self, create_user, workspace, workspace_board):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=create_user,
            defaults={"role": ROLE.ADMIN.value},
        )
        project = Project.objects.create(
            name="Stats Project",
            identifier="STP",
            workspace=workspace,
            board=workspace_board,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=ROLE.ADMIN.value)

        ctx = AssistantActorContext(user=create_user, workspace=workspace, board_slug=workspace_board.slug)
        result = execute_tool(ctx, "get_project_stats", {"project_id": str(project.id)})
        assert result.ok is True
        assert result.data["count"] == 1
        assert result.data["projects"][0]["total_issues"] == 0

    def test_unknown_tool(self, create_user, workspace):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=create_user,
            defaults={"role": ROLE.ADMIN.value},
        )
        ctx = AssistantActorContext(user=create_user, workspace=workspace)
        result = execute_tool(ctx, "nonexistent_tool", {})
        assert result.ok is False
        assert result.error == "unknown_tool"
