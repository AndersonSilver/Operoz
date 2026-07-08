from __future__ import annotations

from unittest.mock import patch

import pytest
from django.db.models.signals import post_save
from rest_framework import status

from operoz.db.models import User

from operoz.db.models import (
    Issue,
    Project,
    ProjectMember,
    State,
    TransitionValidator,
    Workflow,
    WorkflowScheme,
    WorkflowSchemeEntry,
    WorkflowTransition,
)
from operoz.workflow.engine import (
    ConditionNotSatisfiedError,
    ConcurrentStateChangeError,
)


@pytest.fixture(autouse=True)
def mute_user_notification_preferences_signal():
    """Test DB may lag migrations for notification preferences; workflow tests do not need them."""
    from operoz.db.models.user import create_user_notification

    post_save.disconnect(create_user_notification, sender=User)
    yield
    post_save.connect(create_user_notification, sender=User)


class TestWorkflowExecuteBase:
    def execute_url(self, slug: str, project_id, issue_id, transition_id) -> str:
        return f"/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/transitions/{transition_id}/execute/"

    def _create_project(self, workspace, workspace_board, create_user) -> Project:
        project = Project.objects.create(
            name="Workflow Contract Project",
            identifier="WFC1",
            workspace=workspace,
            board=workspace_board,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20)

        if not State.objects.filter(project=project).exists():
            State.objects.create(
                name="Backlog",
                project=project,
                workspace=workspace,
                sequence=1,
                group="backlog",
                color="#858585",
                created_by=create_user,
            )
            State.objects.create(
                name="In Progress",
                project=project,
                workspace=workspace,
                sequence=2,
                group="started",
                color="#3b82f6",
                created_by=create_user,
            )

        return project

    def _setup_workflow_issue(
        self,
        workspace,
        create_user,
        project: Project,
        *,
        with_comment_validator: bool = False,
    ):
        states = list(State.objects.filter(project=project).order_by("sequence"))
        assert len(states) >= 2
        from_state, to_state = states[0], states[1]

        workflow = Workflow.objects.create(
            workspace=workspace,
            name="Contract Workflow",
            is_draft=False,
            is_active=True,
            created_by=create_user,
            updated_by=create_user,
        )
        scheme = WorkflowScheme.objects.create(
            workspace=workspace,
            name="Contract Scheme",
            created_by=create_user,
            updated_by=create_user,
        )
        WorkflowSchemeEntry.objects.create(
            scheme=scheme,
            issue_type=None,
            workflow=workflow,
            created_by=create_user,
            updated_by=create_user,
        )
        project.workflow_scheme = scheme
        project.save(update_fields=["workflow_scheme", "updated_at"])

        transition = WorkflowTransition.objects.create(
            workflow=workflow,
            from_state=from_state,
            to_state=to_state,
            name="Move forward",
            created_by=create_user,
            updated_by=create_user,
        )
        if with_comment_validator:
            TransitionValidator.objects.create(
                transition=transition,
                validator_type="has_comment",
                config={},
                created_by=create_user,
                updated_by=create_user,
            )

        blocked_transition = WorkflowTransition.objects.create(
            workflow=workflow,
            from_state=to_state,
            to_state=from_state,
            name="Wrong state transition",
            created_by=create_user,
            updated_by=create_user,
        )

        issue = Issue.objects.create(
            name="Workflow contract issue",
            project=project,
            workspace=workspace,
            state=from_state,
            created_by=create_user,
        )

        return issue, transition, blocked_transition, to_state


@pytest.mark.contract
class TestWorkflowExecuteContract(TestWorkflowExecuteBase):
    @pytest.mark.django_db
    def test_execute_transition_success(self, session_client, workspace, workspace_board, create_user):
        project = self._create_project(workspace, workspace_board, create_user)
        issue, transition, _, to_state = self._setup_workflow_issue(workspace, create_user, project)

        response = session_client.post(
            self.execute_url(workspace.slug, project.id, issue.id, transition.id),
            {"comment": "Moving along"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["state_id"]) == str(to_state.id)
        issue.refresh_from_db()
        assert str(issue.state_id) == str(to_state.id)

    @pytest.mark.django_db
    def test_execute_transition_not_available_returns_403(
        self, session_client, workspace, workspace_board, create_user
    ):
        project = self._create_project(workspace, workspace_board, create_user)
        issue, _, blocked_transition, _ = self._setup_workflow_issue(workspace, create_user, project)

        response = session_client.post(
            self.execute_url(workspace.slug, project.id, issue.id, blocked_transition.id),
            {},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data["error"] == "transition_not_available"

    @pytest.mark.django_db
    @patch("operoz.app.views.workflow.base.execute_transition")
    def test_execute_condition_not_satisfied_returns_403(
        self, mock_execute, session_client, workspace, workspace_board, create_user
    ):
        mock_execute.side_effect = ConditionNotSatisfiedError("Only assignee can run this transition")

        project = self._create_project(workspace, workspace_board, create_user)
        issue, transition, _, _ = self._setup_workflow_issue(workspace, create_user, project)

        response = session_client.post(
            self.execute_url(workspace.slug, project.id, issue.id, transition.id),
            {},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data["error"] == "condition_not_satisfied"

    @pytest.mark.django_db
    def test_execute_validation_failed_returns_422(self, session_client, workspace, workspace_board, create_user):
        project = self._create_project(workspace, workspace_board, create_user)
        issue, transition, _, _ = self._setup_workflow_issue(
            workspace, create_user, project, with_comment_validator=True
        )

        response = session_client.post(
            self.execute_url(workspace.slug, project.id, issue.id, transition.id),
            {},
            format="json",
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert response.data["error"] == "validation_failed"
        assert isinstance(response.data.get("fields"), list)
        assert len(response.data["fields"]) > 0

    @pytest.mark.django_db
    @patch("operoz.app.views.workflow.base.execute_transition")
    def test_execute_concurrent_state_change_returns_409(
        self, mock_execute, session_client, workspace, workspace_board, create_user
    ):
        mock_execute.side_effect = ConcurrentStateChangeError("Issue state changed during transition execution")

        project = self._create_project(workspace, workspace_board, create_user)
        issue, transition, _, _ = self._setup_workflow_issue(workspace, create_user, project)

        response = session_client.post(
            self.execute_url(workspace.slug, project.id, issue.id, transition.id),
            {},
            format="json",
        )

        assert response.status_code == status.HTTP_409_CONFLICT
        assert response.data["error"] == "concurrent_state_change"
