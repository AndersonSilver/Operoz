from unittest.mock import MagicMock, patch

import pytest

from operis.assistant.chat_jobs import enqueue_chat_job, publish_job_event
from operis.assistant.service import AssistantServiceError
from operis.app.permissions import ROLE
from operis.db.models import AssistantChatJob, AssistantSession, WorkspaceMember


@pytest.mark.unit
@pytest.mark.django_db
class TestAssistantChatJobs:
    @patch("operis.assistant.chat_jobs.get_fair_queue_status", return_value=(1, 15))
    @patch("operis.assistant.chat_jobs.register_fair_job")
    @patch("operis.bgtasks.assistant_chat_task.run_assistant_chat_job_task")
    @patch("operis.assistant.chat_jobs.publish_job_event")
    @patch("operis.assistant.service.check_assistant_rate_limit", return_value=(True, "ok", 0))
    def test_enqueue_creates_job_and_dispatches_task(
        self,
        _rate,
        mock_publish,
        mock_task,
        _register,
        _queue_status,
        create_user,
        workspace,
    ):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=create_user,
            defaults={"role": ROLE.ADMIN.value},
        )
        session = AssistantSession.objects.create(workspace=workspace, user=create_user, context={})
        mock_task.delay.return_value = MagicMock(id="celery-task-1")

        job, created = enqueue_chat_job(
            session,
            user=create_user,
            message="Olá",
            client_message_id="client-1",
        )

        assert created is True
        assert job.status == AssistantChatJob.STATUS_QUEUED
        assert job.celery_task_id == "celery-task-1"
        mock_task.delay.assert_called_once_with(str(job.id))
        mock_publish.assert_called()

    @patch("operis.assistant.chat_jobs.get_fair_queue_status", return_value=(1, 15))
    @patch("operis.assistant.chat_jobs.register_fair_job")
    @patch("operis.bgtasks.assistant_chat_task.run_assistant_chat_job_task")
    @patch("operis.assistant.chat_jobs.publish_job_event")
    @patch("operis.assistant.service.check_assistant_rate_limit", return_value=(True, "ok", 0))
    def test_enqueue_idempotent_client_message_id(
        self,
        _rate,
        _publish,
        mock_task,
        _register,
        _queue_status,
        create_user,
        workspace,
    ):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=create_user,
            defaults={"role": ROLE.ADMIN.value},
        )
        session = AssistantSession.objects.create(workspace=workspace, user=create_user, context={})
        mock_task.delay.return_value = MagicMock(id="celery-task-1")

        job1, created1 = enqueue_chat_job(
            session,
            user=create_user,
            message="Olá",
            client_message_id="same-client-id",
        )
        job2, created2 = enqueue_chat_job(
            session,
            user=create_user,
            message="Olá de novo",
            client_message_id="same-client-id",
        )

        assert created1 is True
        assert created2 is False
        assert job1.id == job2.id
        assert mock_task.delay.call_count == 1

    @patch("operis.assistant.service.check_assistant_rate_limit", return_value=(False, "user_rate_limit", 30))
    def test_enqueue_respects_rate_limit(self, _rate, create_user, workspace):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=create_user,
            defaults={"role": ROLE.ADMIN.value},
        )
        session = AssistantSession.objects.create(workspace=workspace, user=create_user, context={})

        with pytest.raises(AssistantServiceError) as exc:
            enqueue_chat_job(session, user=create_user, message="Olá")

        assert exc.value.code == "user_rate_limit"


@pytest.mark.unit
def test_publish_job_event_serializes_done_payload():
    with patch("operis.assistant.chat_jobs.redis_instance") as mock_redis_factory:
        redis = MagicMock()
        redis.xadd.return_value = b"1-0"
        mock_redis_factory.return_value = redis

        publish_job_event("job-1", {"type": "token", "content": "Oi"})

        redis.xadd.assert_called_once()
        redis.expire.assert_called_once()
