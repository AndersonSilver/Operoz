from __future__ import annotations

import json
import logging
import os
import time
import uuid
from datetime import timedelta
from typing import Any, Iterator

from django.conf import settings
from django.db import IntegrityError
from django.utils import timezone

from operoz.assistant.llm.concurrency import get_fair_queue_status, register_fair_job, release_llm_slot
from operoz.assistant.security.rate_limit import release_active_chat
from operoz.assistant.service import AssistantServiceError, validate_chat_request
from operoz.db.models import AssistantChatJob, AssistantMessage, AssistantSession
from operoz.settings.redis import redis_instance

logger = logging.getLogger(__name__)

EVENT_STREAM_TTL_SECONDS = int(os.environ.get("ASSISTANT_CHAT_EVENT_TTL", str(60 * 60 * 24)))
EVENT_BLOCK_MS = int(os.environ.get("ASSISTANT_CHAT_STREAM_BLOCK_MS", "5000"))


def _stream_key(job_id: str) -> str:
    return f"assistant:chat:job:{job_id}:events"


def _stream_idle_timeout_seconds() -> float:
    return float(getattr(settings, "ASSISTANT_CHAT_STREAM_IDLE_SECONDS", 90))


def _stale_job_threshold_seconds() -> int:
    return int(getattr(settings, "ASSISTANT_CHAT_JOB_STALE_SECONDS", 900))


def publish_job_event(job_id: str, event: dict[str, Any]) -> str | None:
    try:
        redis = redis_instance()
        entry_id = redis.xadd(_stream_key(job_id), {"payload": json.dumps(event, default=str)})
        redis.expire(_stream_key(job_id), EVENT_STREAM_TTL_SECONDS)
        return entry_id.decode() if isinstance(entry_id, bytes) else str(entry_id)
    except Exception:
        logger.exception("assistant chat job: failed to publish event job_id=%s", job_id)
        return None


def _load_job_snapshot(job_id: str) -> AssistantChatJob | None:
    return (
        AssistantChatJob.objects.filter(pk=job_id)
        .select_related("session", "session__workspace", "user")
        .only(
            "id",
            "status",
            "error_code",
            "error_message",
            "created_at",
            "session_id",
            "user_id",
            "session__workspace_id",
        )
        .first()
    )


def _job_is_pending(status: str) -> bool:
    return status in (AssistantChatJob.STATUS_QUEUED, AssistantChatJob.STATUS_RUNNING)


def _synthetic_done_event(job: AssistantChatJob) -> dict[str, Any] | None:
    """Re-emite done quando o job já completou mas o cliente perdeu o evento no Redis Stream."""
    message = (
        AssistantMessage.objects.filter(
            session_id=job.session_id,
            role=AssistantMessage.ROLE_ASSISTANT,
            created_at__gte=job.created_at,
        )
        .order_by("-created_at")
        .first()
    )
    if message is None:
        return None

    from operoz.app.serializers.assistant import AssistantMessageSerializer, AssistantSessionSerializer

    session = AssistantSession.objects.filter(pk=job.session_id).first()
    return {
        "type": "done",
        "message": AssistantMessageSerializer(message).data,
        "session": AssistantSessionSerializer(session).data if session else {},
        "synthetic": True,
    }


def _stream_idle_error_event() -> dict[str, Any]:
    return {
        "type": "error",
        "error": "stream_idle_timeout",
        "message": "Sem actualizações do chat. Tente novamente.",
        "retry_after": 30,
    }


def iter_job_events(job_id: str, *, last_id: str = "0-0", timeout_seconds: float = 600) -> Iterator[dict[str, Any]]:
    """Lê eventos SSE publicados pelo worker (Redis Stream)."""
    redis = redis_instance()
    stream = _stream_key(job_id)
    cursor = last_id
    started = time.monotonic()
    idle_timeout = _stream_idle_timeout_seconds()
    last_activity = started

    while time.monotonic() - started < timeout_seconds:
        now = time.monotonic()
        if now - last_activity >= idle_timeout:
            job = _load_job_snapshot(job_id)
            if job and _job_is_pending(job.status):
                yield _stream_idle_error_event()
                return
            if job and job.status == AssistantChatJob.STATUS_COMPLETED:
                synthetic = _synthetic_done_event(job)
                if synthetic:
                    yield synthetic
                return
            last_activity = now

        remaining_total = timeout_seconds - (now - started)
        remaining_idle = idle_timeout - (now - last_activity)
        block_seconds = min(EVENT_BLOCK_MS / 1000, remaining_total, max(0.05, remaining_idle))
        block_ms = max(1, int(block_seconds * 1000))

        try:
            batches = redis.xread({stream: cursor}, block=block_ms, count=32)
        except Exception:
            logger.exception("assistant chat job: xread failed job_id=%s", job_id)
            yield {"type": "error", "error": "stream_read_failed", "message": "Falha ao ler stream do job"}
            return

        if not batches:
            job = _load_job_snapshot(job_id)
            if job and job.status == AssistantChatJob.STATUS_FAILED:
                yield {
                    "type": "error",
                    "error": job.error_code or "job_failed",
                    "message": job.error_message or "Job de chat falhou",
                }
                return
            if job and job.status == AssistantChatJob.STATUS_COMPLETED:
                synthetic = _synthetic_done_event(job)
                if synthetic:
                    yield synthetic
                return
            continue

        for _stream_name, entries in batches:
            for entry_id, fields in entries:
                raw = fields.get(b"payload") or fields.get("payload")
                if raw is None:
                    continue
                if isinstance(raw, bytes):
                    raw = raw.decode()
                try:
                    event = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                last_activity = time.monotonic()
                yield event
                cursor = entry_id.decode() if isinstance(entry_id, bytes) else str(entry_id)
                if event.get("type") in ("done", "error"):
                    return


def reclaim_stale_assistant_jobs(*, dry_run: bool = False) -> dict[str, Any]:
    """
    Marca jobs queued/running antigos como failed e publica erro no stream.
    Liberta slots LLM/active-chat de jobs running órfãos.
    """
    cutoff = timezone.now() - timedelta(seconds=_stale_job_threshold_seconds())
    stale_jobs = list(
        AssistantChatJob.objects.filter(
            status__in=(AssistantChatJob.STATUS_QUEUED, AssistantChatJob.STATUS_RUNNING),
            updated_at__lt=cutoff,
        ).select_related("session", "session__workspace", "user")
    )

    reclaimed = 0
    for job in stale_jobs:
        if dry_run:
            reclaimed += 1
            continue

        if job.status == AssistantChatJob.STATUS_RUNNING:
            release_llm_slot(str(job.id))
            release_active_chat(
                str(job.session.workspace_id),
                str(job.user_id),
                str(job.id),
            )

        mark_job_failed(
            job,
            error_code="stale_job",
            error_message="Job de chat expirou sem conclusão",
        )
        publish_job_event(
            str(job.id),
            {
                "type": "error",
                "error": "stale_job",
                "message": "Job de chat expirou sem conclusão",
                "retry_after": 30,
            },
        )
        reclaimed += 1
        logger.warning("assistant chat job reclaimed as stale job_id=%s status=%s", job.id, job.status)

    return {
        "dry_run": dry_run,
        "reclaimed": reclaimed,
        "threshold_seconds": _stale_job_threshold_seconds(),
        "cutoff": cutoff.isoformat(),
    }


def _generate_client_message_id(client_message_id: str | None) -> str:
    cleaned = (client_message_id or "").strip()
    return cleaned[:128]


def enqueue_chat_job(
    session: AssistantSession,
    *,
    user,
    message: str,
    client_message_id: str = "",
) -> tuple[AssistantChatJob, bool]:
    """
    Valida pedido, cria job e enfileira task Celery.
    Retorna (job, created) — created=False quando idempotência reutiliza job existente.
    """
    validated_message = validate_chat_request(session, message)
    client_message_id = _generate_client_message_id(client_message_id)

    if client_message_id:
        existing = AssistantChatJob.objects.filter(
            session=session,
            client_message_id=client_message_id,
        ).first()
        if existing:
            return existing, False

    job = AssistantChatJob.objects.create(
        session=session,
        user=user,
        message=validated_message,
        client_message_id=client_message_id,
        status=AssistantChatJob.STATUS_QUEUED,
    )

    register_fair_job(str(job.id), str(session.workspace_id))
    position, estimated_wait = get_fair_queue_status(str(job.id), str(session.workspace_id))
    job.queue_position = position
    job.estimated_wait_seconds = estimated_wait
    job.save(update_fields=["queue_position", "estimated_wait_seconds", "updated_at"])

    try:
        from operoz.bgtasks.assistant_chat_task import run_assistant_chat_job_task

        async_result = run_assistant_chat_job_task.delay(str(job.id))
        job.celery_task_id = async_result.id or ""
        job.save(update_fields=["celery_task_id", "updated_at"])
    except Exception as exc:
        job.status = AssistantChatJob.STATUS_FAILED
        job.error_code = "enqueue_failed"
        job.error_message = str(exc)
        job.save(update_fields=["status", "error_code", "error_message", "updated_at"])
        publish_job_event(
            str(job.id),
            {"type": "error", "error": "enqueue_failed", "message": "Não foi possível enfileirar o chat"},
        )
        raise

    publish_job_event(
        str(job.id),
        {
            "type": "queued",
            "job_id": str(job.id),
            "status": "queued",
            "queue_position": position,
            "estimated_wait_seconds": estimated_wait,
        },
    )
    return job, True


def update_job_queue_status(
    job: AssistantChatJob,
    *,
    queue_position: int,
    estimated_wait_seconds: int,
) -> None:
    job.queue_position = max(0, queue_position)
    job.estimated_wait_seconds = max(0, estimated_wait_seconds)
    job.save(update_fields=["queue_position", "estimated_wait_seconds", "updated_at"])


def enqueue_chat_job_safe(
    session: AssistantSession,
    *,
    user,
    message: str,
    client_message_id: str = "",
) -> AssistantChatJob:
    try:
        job, _created = enqueue_chat_job(
            session,
            user=user,
            message=message,
            client_message_id=client_message_id,
        )
        return job
    except AssistantServiceError:
        raise
    except IntegrityError:
        if client_message_id:
            existing = AssistantChatJob.objects.filter(
                session=session,
                client_message_id=client_message_id,
            ).first()
            if existing:
                return existing
        raise


def mark_job_running(job: AssistantChatJob) -> None:
    job.status = AssistantChatJob.STATUS_RUNNING
    job.save(update_fields=["status", "updated_at"])


def mark_job_completed(job: AssistantChatJob) -> None:
    job.status = AssistantChatJob.STATUS_COMPLETED
    job.error_code = ""
    job.error_message = ""
    job.save(update_fields=["status", "error_code", "error_message", "updated_at"])


def mark_job_failed(job: AssistantChatJob, *, error_code: str, error_message: str) -> None:
    job.status = AssistantChatJob.STATUS_FAILED
    job.error_code = error_code[:64]
    job.error_message = error_message
    job.save(update_fields=["status", "error_code", "error_message", "updated_at"])


def new_client_message_id() -> str:
    return str(uuid.uuid4())

