import pytest
from django.test import override_settings

from operis.app.permissions import ROLE
from operis.assistant.service import iter_chat_events, validate_chat_request, AssistantServiceError
from operis.db.models import AssistantSession, Project, WorkspaceMember


@pytest.mark.unit
@pytest.mark.django_db
class TestAssistantSessionScope:
    @override_settings(ASSISTANT_REQUIRE_SESSION_SCOPE="1")
    def test_validate_chat_request_requires_project(self, create_user, workspace, workspace_board):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=create_user,
            defaults={"role": ROLE.ADMIN.value},
        )
        session = AssistantSession.objects.create(
            workspace=workspace,
            user=create_user,
            context={"board_slug": workspace_board.slug},
        )

        with pytest.raises(AssistantServiceError) as exc:
            validate_chat_request(session, "Olá")

        assert exc.value.code == "context_required"

    @override_settings(ASSISTANT_REQUIRE_SESSION_SCOPE="1")
    def test_validate_chat_request_requires_board_when_workspace_has_boards(
        self, create_user, workspace, workspace_board
    ):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=create_user,
            defaults={"role": ROLE.ADMIN.value},
        )
        project = Project.objects.create(
            name="Projeto scope",
            identifier="PSC",
            workspace=workspace,
            board=workspace_board,
        )
        session = AssistantSession.objects.create(
            workspace=workspace,
            user=create_user,
            context={"project_id": str(project.id)},
        )

        with pytest.raises(AssistantServiceError) as exc:
            validate_chat_request(session, "Olá")

        assert exc.value.code == "context_required"

    @override_settings(ASSISTANT_REQUIRE_SESSION_SCOPE="1")
    def test_validate_chat_request_accepts_full_scope(self, create_user, workspace, workspace_board):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=create_user,
            defaults={"role": ROLE.ADMIN.value},
        )
        project = Project.objects.create(
            name="Projeto scope",
            identifier="PS2",
            workspace=workspace,
            board=workspace_board,
        )
        session = AssistantSession.objects.create(
            workspace=workspace,
            user=create_user,
            context={
                "board_slug": workspace_board.slug,
                "project_id": str(project.id),
            },
        )

        message = validate_chat_request(session, "Resumo do projeto")
        assert message == "Resumo do projeto"

    @override_settings(ASSISTANT_REQUIRE_SESSION_SCOPE="1")
    def test_iter_chat_events_returns_context_error_event(self, create_user, workspace):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=create_user,
            defaults={"role": ROLE.ADMIN.value},
        )
        session = AssistantSession.objects.create(
            workspace=workspace,
            user=create_user,
            context={},
        )

        events = list(iter_chat_events(session, "Olá", stream=True, skip_llm_wait=True))
        assert events
        assert events[0]["type"] == "error"
        assert events[0]["error"] == "context_required"
