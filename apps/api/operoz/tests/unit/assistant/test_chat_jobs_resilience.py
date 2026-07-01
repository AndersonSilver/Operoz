from __future__ import annotations

import uuid
from datetime import timedelta
from unittest.mock import MagicMock, patch

import pytest
from django.utils import timezone

from operoz.app.permissions import ROLE
from operoz.assistant.chat_jobs import (
    _synthetic_done_event,
    iter_job_events,
    publish_job_event,
    reclaim_stale_assistant_jobs,
)
from operoz.db.models import AssistantChatJob, AssistantMessage, AssistantSession, WorkspaceMember


def _collect_events(job_id: str, *, timeout_seconds: float = 2, idle_seconds: float = 0.2) -> list[dict]:
    with patch("operoz.assistant.chat_jobs._stream_idle_timeout_seconds", return_value=idle_seconds):
        return list(iter_job_events(job_id, timeout_seconds=timeout_seconds))


@pytest.mark.django_db
class TestJobStreamResilience:
    @patch("operoz.assistant.chat_jobs.redis_instance")
    def test_idle_timeout_emits_error_for_pending_job(self, mock_redis_factory, create_user, workspace):
        job = AssistantChatJob.objects.create(
            session=AssistantSession.objects.create(workspace=workspace, user=create_user),
            user=create_user,
            message="x",
            status=AssistantChatJob.STATUS_RUNNING,
        )
        redis = MagicMock()
        mock_redis_factory.return_value = redis
        redis.xread.return_value = []

        events = _collect_events(str(job.id), idle_seconds=0.15)
        assert len(events) == 1
        assert events[0]["type"] == "error"
        assert events[0]["error"] == "stream_idle_timeout"
        assert events[0]["retry_after"] == 30

    def test_synthetic_done_when_job_completed_without_stream_event(self, create_user, workspace):
        session = AssistantSession.objects.create(workspace=workspace, user=create_user)
        job = AssistantChatJob.objects.create(
            session=session,
            user=create_user,
            message="pergunta",
            status=AssistantChatJob.STATUS_COMPLETED,
        )
        AssistantMessage.objects.create(
            session=session,
            role=AssistantMessage.ROLE_ASSISTANT,
            content="resposta recuperada",
        )

        synthetic = _synthetic_done_event(job)
        assert synthetic is not None
        assert synthetic["type"] == "done"
        assert synthetic["message"]["content"] == "resposta recuperada"
        assert synthetic["synthetic"] is True

    @patch("operoz.assistant.chat_jobs.redis_instance")
    def test_completed_job_yields_synthetic_done_on_empty_stream(self, mock_redis_factory, create_user, workspace):
        session = AssistantSession.objects.create(workspace=workspace, user=create_user)
        job = AssistantChatJob.objects.create(
            session=session,
            user=create_user,
            message="pergunta",
            status=AssistantChatJob.STATUS_COMPLETED,
        )
        AssistantMessage.objects.create(
            session=session,
            role=AssistantMessage.ROLE_ASSISTANT,
            content="via stream",
        )

        redis = MagicMock()
        mock_redis_factory.return_value = redis
        redis.xread.return_value = []

        events = _collect_events(str(job.id), idle_seconds=0.15)
        assert len(events) == 1
        assert events[0]["type"] == "done"
        assert events[0]["synthetic"] is True


@pytest.mark.django_db
class TestStaleJobReaper:
    @patch("operoz.assistant.chat_jobs.publish_job_event")
    @patch("operoz.assistant.chat_jobs.release_active_chat")
    @patch("operoz.assistant.chat_jobs.release_llm_slot")
    def test_reclaim_marks_old_running_job_failed(
        self, mock_release_llm, mock_release_chat, mock_publish, create_user, workspace
    ):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace, member=create_user, defaults={"role": ROLE.ADMIN.value}
        )
        session = AssistantSession.objects.create(workspace=workspace, user=create_user)
        job = AssistantChatJob.objects.create(
            session=session,
            user=create_user,
            message="stale",
            status=AssistantChatJob.STATUS_RUNNING,
        )
        AssistantChatJob.objects.filter(pk=job.pk).update(
            updated_at=timezone.now() - timedelta(minutes=30),
        )

        result = reclaim_stale_assistant_jobs(dry_run=False)
        assert result["reclaimed"] >= 1

        job.refresh_from_db()
        assert job.status == AssistantChatJob.STATUS_FAILED
        assert job.error_code == "stale_job"
        mock_release_llm.assert_called_once_with(str(job.id))
        mock_publish.assert_called()

    def test_dry_run_does_not_mutate(self, create_user, workspace):
        session = AssistantSession.objects.create(workspace=workspace, user=create_user)
        job = AssistantChatJob.objects.create(
            session=session,
            user=create_user,
            message="stale",
            status=AssistantChatJob.STATUS_QUEUED,
        )
        AssistantChatJob.objects.filter(pk=job.pk).update(
            updated_at=timezone.now() - timedelta(minutes=30),
        )

        result = reclaim_stale_assistant_jobs(dry_run=True)
        assert result["reclaimed"] >= 1

        job.refresh_from_db()
        assert job.status == AssistantChatJob.STATUS_QUEUED

    def test_publish_roundtrip_still_works(self):
        job_id = f"resilience-{uuid.uuid4().hex}"
        publish_job_event(job_id, {"type": "token", "content": "ok"})
        publish_job_event(job_id, {"type": "done", "message": {"content": "ok"}})

        with patch("operoz.assistant.chat_jobs._stream_idle_timeout_seconds", return_value=90):
            events = list(iter_job_events(job_id, timeout_seconds=3))
        types = [e["type"] for e in events]
        assert types == ["token", "done"]
