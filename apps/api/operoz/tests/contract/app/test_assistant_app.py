from unittest.mock import patch

import pytest
from rest_framework import status

from operoz.db.models import AssistantSession


@pytest.mark.contract
@pytest.mark.django_db
class TestAssistantAPI:
    def _sessions_url(self, slug: str) -> str:
        return f"/api/workspaces/{slug}/assistant/sessions/"

    def _chat_url(self, slug: str, session_id: str) -> str:
        return f"/api/workspaces/{slug}/assistant/sessions/{session_id}/chat/"

    def test_create_session(self, session_client, workspace, setup_instance):
        response = session_client.post(
            self._sessions_url(workspace.slug),
            {"title": "Teste", "context": {"board_slug": "test-board"}},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert AssistantSession.objects.filter(workspace=workspace).count() == 1

    def test_list_sessions_only_own(self, session_client, workspace, create_user, setup_instance):
        from operoz.db.models import User

        other = User.objects.create(email="other@plane.so", username="other-assistant-user")
        AssistantSession.objects.create(workspace=workspace, user=other, title="Outro")

        session_client.post(self._sessions_url(workspace.slug), {}, format="json")
        response = session_client.get(self._sessions_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_chat_requires_message(self, session_client, workspace, setup_instance):
        create = session_client.post(self._sessions_url(workspace.slug), {}, format="json")
        session_id = create.data["id"]
        response = session_client.post(self._chat_url(workspace.slug, session_id), {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_chat_session_isolation(self, session_client, workspace, create_user, setup_instance):
        from operoz.db.models import User, WorkspaceMember
        from operoz.app.permissions import ROLE

        create = session_client.post(self._sessions_url(workspace.slug), {}, format="json")
        session_id = create.data["id"]

        intruder = User.objects.create(email="intruder@plane.so", username="intruder-assistant-user")
        WorkspaceMember.objects.create(workspace=workspace, member=intruder, role=ROLE.MEMBER.value)
        session_client.force_authenticate(user=intruder)

        response = session_client.post(
            self._chat_url(workspace.slug, session_id),
            {"message": "oi"},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @patch("operoz.app.views.assistant.sessions.enqueue_chat_job_safe")
    @patch("operoz.assistant.chat_jobs.get_fair_queue_status", return_value=(1, 15))
    @patch("operoz.assistant.chat_jobs.register_fair_job")
    def test_chat_async_enqueue_returns_202(self, _register, _queue, mock_enqueue, session_client, workspace, create_user, setup_instance):
        create = session_client.post(self._sessions_url(workspace.slug), {}, format="json")
        session_id = create.data["id"]

        from operoz.db.models import AssistantChatJob, AssistantSession

        session = AssistantSession.objects.get(pk=session_id)
        job = AssistantChatJob.objects.create(
            session=session,
            user=create_user,
            message="ping",
            client_message_id="test-client-id",
            status=AssistantChatJob.STATUS_QUEUED,
        )
        mock_enqueue.return_value = job

        response = session_client.post(
            self._chat_url(workspace.slug, session_id),
            {"message": "ping", "stream": True, "async_mode": True, "client_message_id": "test-client-id"},
            format="json",
            HTTP_ACCEPT="application/json",
        )

        assert response.status_code == status.HTTP_202_ACCEPTED
        assert response.data["job_id"] == str(job.id)
        assert response.data["status"] == "queued"
