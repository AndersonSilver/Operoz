"""
Validação profunda por fase do epic Escala do Chat (Fases 1–7 + Governança).

Executada via `python manage.py validate_assistant_scaling --deep`.
"""
from __future__ import annotations

import json
import uuid
from pathlib import Path
from unittest.mock import patch

import pytest
from django.test import Client, override_settings
from rest_framework import status

from operoz.app.permissions import ROLE
from operoz.assistant.chat_jobs import _stream_key, publish_job_event
from operoz.assistant.llm.degraded_mode import should_use_degraded_mode
from operoz.assistant.observability import render_prometheus_metrics
from operoz.assistant.service import AssistantServiceError, iter_chat_events
from operoz.bgtasks.assistant_chat_task import run_assistant_chat_job_task
from operoz.db.models import AssistantChatJob, AssistantSession, User, WorkspaceMember
from operoz.settings.redis import redis_instance


def _job_event_types(job_id: str) -> list[str]:
    entries = redis_instance().xrange(_stream_key(job_id), count=50)
    types: list[str] = []
    for _entry_id, fields in entries:
        raw = fields.get(b"payload") or fields.get("payload")
        if isinstance(raw, bytes):
            raw = raw.decode()
        if not raw:
            continue
        types.append(json.loads(raw).get("type", ""))
    return types


def _docs_root() -> Path:
    if Path("/docs/assistant-scaling.md").is_file():
        return Path("/docs")
    root = _repo_root_optional()
    if root is not None:
        return root / "docs"
    pytest.skip("docs/ not available")


def _repo_root_optional() -> Path | None:
    here = Path(__file__).resolve()
    for parent in here.parents:
        if (parent / "docker-compose-local.yml").is_file():
            return parent
        if (parent / "docs" / "assistant-scaling.md").is_file() and (parent / "apps" / "api").is_dir():
            return parent
    return None


def _require_monorepo_root() -> Path:
    root = _repo_root_optional()
    if root is None:
        pytest.skip("Monorepo Operoz/ not mounted (skip infra file checks in api-only container)")
    return root


# ---------------------------------------------------------------------------
# Fase 1 — Streaming e caminho quente
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPhase1Streaming:
    @patch("operoz.assistant.service.release_active_chat")
    @patch("operoz.assistant.service.acquire_active_chat", return_value=True)
    @patch("operoz.assistant.service.release_llm_slot")
    @patch("operoz.assistant.service.try_acquire_llm_slot", return_value=True)
    @patch("operoz.assistant.service.check_assistant_rate_limit", return_value=(True, "ok", 0))
    @patch("operoz.assistant.service.record_assistant_message")
    @patch("operoz.assistant.service.hybrid_retrieve", return_value=[])
    @patch("operoz.assistant.service.stream_chat_completion")
    def test_tokens_stream_before_done_and_persist_message(
        self, mock_stream, _rag, _record, _rate, _try, _rel, _acq, _rel_chat, create_user, workspace
    ):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace, member=create_user, defaults={"role": ROLE.ADMIN.value}
        )
        session = AssistantSession.objects.create(workspace=workspace, user=create_user, context={})

        def _gen():
            yield {"type": "token", "content": "A"}
            yield {"type": "token", "content": "B"}
            yield {"type": "complete", "content": "AB", "model": "gpt-4o-mini"}

        mock_stream.return_value = _gen()
        events = list(iter_chat_events(session, "ping", stream=True, skip_llm_wait=True))
        types = [e["type"] for e in events]
        assert types.index("token") < types.index("done")
        assert events[-1]["type"] == "done"
        assert events[-1]["message"]["content"] == "AB"

    @patch("operoz.assistant.service.release_active_chat")
    @patch("operoz.assistant.service.acquire_active_chat", return_value=True)
    @patch("operoz.assistant.service.release_llm_slot")
    @patch("operoz.assistant.service.try_acquire_llm_slot", return_value=True)
    @patch("operoz.assistant.service.check_assistant_rate_limit", return_value=(True, "ok", 0))
    @patch("operoz.assistant.service.record_assistant_message")
    @patch("operoz.assistant.service.hybrid_retrieve", return_value=[])
    @patch("operoz.assistant.service.stream_chat_completion")
    def test_tool_round_yields_tool_events_then_done(
        self, mock_stream, _rag, _record, _rate, _try, _rel, _acq, _rel_chat, create_user, workspace
    ):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace, member=create_user, defaults={"role": ROLE.ADMIN.value}
        )
        session = AssistantSession.objects.create(workspace=workspace, user=create_user, context={})

        def round_one():
            yield {
                "type": "tool_calls",
                "tool_calls": [
                    {
                        "id": "c1",
                        "type": "function",
                        "function": {"name": "search_issues", "arguments": '{"query":"x","limit":1}'},
                    }
                ],
                "content": "",
                "model": "gpt-4o-mini",
            }

        def round_two():
            yield {"type": "complete", "content": "ok", "model": "gpt-4o-mini"}

        mock_stream.side_effect = [round_one(), round_two()]
        events = list(iter_chat_events(session, "buscar", stream=True, skip_llm_wait=True))
        assert any(e["type"] == "tool_start" for e in events)
        assert events[-1]["type"] == "done"

    @patch("operoz.app.views.assistant.sessions.iter_chat_events")
    def test_sync_sse_endpoint_format(self, mock_iter, session_client, workspace, setup_instance):
        create = session_client.post(
            f"/api/workspaces/{workspace.slug}/assistant/sessions/", {}, format="json"
        )
        session_id = create.data["id"]

        mock_iter.return_value = [
            {"type": "token", "content": "x"},
            {"type": "done", "message": {"content": "x", "role": "assistant"}},
        ]

        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/assistant/sessions/{session_id}/chat/",
            {"message": "oi", "stream": True},
            HTTP_ACCEPT="text/event-stream",
        )
        assert response.status_code == 200
        assert response["Content-Type"].startswith("text/event-stream")
        body = b"".join(response.streaming_content).decode()
        assert "data:" in body
        assert '"type": "token"' in body or '"type":"token"' in body


# ---------------------------------------------------------------------------
# Fase 2 — Infraestrutura (api-chat, PgBouncer, proxy)
# ---------------------------------------------------------------------------


class TestPhase2Infrastructure:
    def test_docker_compose_defines_api_chat_and_pgbouncer(self):
        root = _require_monorepo_root()
        compose = (root / "docker-compose-local.yml").read_text(encoding="utf-8")
        assert "api-chat:" in compose
        assert "operoz-pgbouncer:" in compose
        assert "GUNICORN_CHAT_WORKERS" in compose or "docker-entrypoint-api-chat" in compose

    def test_caddy_routes_assistant_chat_to_api_chat(self):
        root = _require_monorepo_root()
        caddy = (root / "apps" / "proxy" / "Caddyfile.ce").read_text(encoding="utf-8")
        assert "@assistant_chat" in caddy
        assert "assistant/sessions/*/chat" in caddy
        assert "flush_interval -1" in caddy

    def test_settings_expose_scaling_knobs(self):
        from django.conf import settings

        assert hasattr(settings, "ASSISTANT_MAX_CONCURRENT_LLM")
        assert settings.ASSISTANT_MAX_CONCURRENT_LLM >= 1

    def test_pgbouncer_wiring_in_compose_and_settings(self):
        settings_src = (
            Path(__file__).resolve().parents[3] / "settings" / "common.py"
        ).read_text(encoding="utf-8")
        assert "DISABLE_SERVER_SIDE_CURSORS" in settings_src
        root = _repo_root_optional()
        if root is not None:
            compose = (root / "docker-compose-local.yml").read_text(encoding="utf-8")
            assert "USE_PGBOUNCER" in compose


# ---------------------------------------------------------------------------
# Fase 3 — Fila assíncrona Celery + Redis Stream
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPhase3AsyncQueue:
    @patch("operoz.bgtasks.assistant_chat_task.iter_chat_events")
    @patch("operoz.bgtasks.assistant_chat_task.wait_for_llm_resources", return_value=True)
    @patch("operoz.bgtasks.assistant_chat_task.release_llm_slot")
    def test_celery_job_publishes_stream_events_until_done(
        self, _release, _wait, mock_iter, create_user, workspace
    ):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace, member=create_user, defaults={"role": ROLE.ADMIN.value}
        )
        session = AssistantSession.objects.create(workspace=workspace, user=create_user, context={})
        job = AssistantChatJob.objects.create(
            session=session,
            user=create_user,
            message="async ping",
            client_message_id="phase3-e2e",
            status=AssistantChatJob.STATUS_QUEUED,
        )

        mock_iter.return_value = iter([
            {"type": "token", "content": "async"},
            {
                "type": "done",
                "message": {"content": "async ok", "role": "assistant"},
            },
        ])

        result = run_assistant_chat_job_task.run(str(job.id))
        assert result["ok"] is True

        job.refresh_from_db()
        assert job.status == AssistantChatJob.STATUS_COMPLETED

        types = _job_event_types(str(job.id))
        assert "started" in types
        assert "token" in types
        assert "done" in types

    def test_publish_and_read_job_events_roundtrip(self):
        job_id = f"test-job-roundtrip-{uuid.uuid4().hex}"
        publish_job_event(job_id, {"type": "queued", "status": "queued"})
        publish_job_event(job_id, {"type": "token", "content": "t"})
        publish_job_event(job_id, {"type": "done", "message": {"content": "t"}})

        types = _job_event_types(job_id)
        assert types == ["queued", "token", "done"]

    @patch("operoz.app.views.assistant.sessions.enqueue_chat_job_safe")
    def test_async_chat_returns_202_with_job_id(self, mock_enqueue, session_client, workspace, create_user, setup_instance):
        create = session_client.post(
            f"/api/workspaces/{workspace.slug}/assistant/sessions/", {}, format="json"
        )
        session_id = create.data["id"]
        session = AssistantSession.objects.get(pk=session_id)
        job = AssistantChatJob.objects.create(
            session=session,
            user=create_user,
            message="ping",
            client_message_id="phase3-contract",
            status=AssistantChatJob.STATUS_QUEUED,
        )
        mock_enqueue.return_value = job

        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/assistant/sessions/{session_id}/chat/",
            {"message": "ping", "stream": True, "async_mode": True, "client_message_id": "phase3-contract"},
            format="json",
            HTTP_ACCEPT="application/json",
        )
        assert response.status_code == status.HTTP_202_ACCEPTED
        assert response.data["job_id"] == str(job.id)


# ---------------------------------------------------------------------------
# Fase 4 — RAG cache, embedding cache, resumo
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPhase4RagOptimization:
    @patch("operoz.assistant.service.hybrid_retrieve")
    @patch("operoz.assistant.service.release_active_chat")
    @patch("operoz.assistant.service.acquire_active_chat", return_value=True)
    @patch("operoz.assistant.service.release_llm_slot")
    @patch("operoz.assistant.service.try_acquire_llm_slot", return_value=True)
    @patch("operoz.assistant.service.check_assistant_rate_limit", return_value=(True, "ok", 0))
    @patch("operoz.assistant.service.record_assistant_message")
    @patch("operoz.assistant.service.stream_chat_completion")
    def test_rag_context_injected_before_llm(
        self, mock_stream, _record, _rate, _try, _rel, _acq, _rel_chat, mock_rag, create_user, workspace
    ):
        from operoz.assistant.retrieval import RetrievedChunk

        WorkspaceMember.objects.get_or_create(
            workspace=workspace, member=create_user, defaults={"role": ROLE.ADMIN.value}
        )
        session = AssistantSession.objects.create(
            workspace=workspace, user=create_user, context={"board_slug": "b1"}
        )
        mock_rag.return_value = [
            RetrievedChunk(
                embedding_id="1",
                entity_type="issue",
                entity_id="ISS-1",
                chunk_index=0,
                content="Contexto RAG importante",
                metadata={},
                combined_score=0.9,
            )
        ]

        def _gen():
            yield {"type": "complete", "content": "resp", "model": "gpt-4o-mini"}

        mock_stream.return_value = _gen()
        list(iter_chat_events(session, "o que há no board?", stream=True, skip_llm_wait=True))
        assert mock_rag.called
        assert mock_stream.called

    @patch.dict("os.environ", {"ASSISTANT_SUMMARY_SYNC": "0"})
    @patch("operoz.bgtasks.assistant_deferred_task.summarize_session_task")
    def test_long_thread_schedules_async_summary(self, mock_task, create_user, workspace):
        from operoz.assistant.thread_summarization import schedule_session_summarization
        from operoz.db.models import AssistantMessage

        session = AssistantSession.objects.create(workspace=workspace, user=create_user)
        for index in range(16):
            AssistantMessage.objects.create(
                session=session,
                role=AssistantMessage.ROLE_USER if index % 2 == 0 else AssistantMessage.ROLE_ASSISTANT,
                content=f"m{index}",
            )
        schedule_session_summarization(str(session.id))
        mock_task.delay.assert_called_once()


# ---------------------------------------------------------------------------
# Fase 5 — Concorrência, fair queue, degraded mode, key pool
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPhase5ConcurrencyProtection:
    @patch("operoz.assistant.service.release_active_chat")
    @patch("operoz.assistant.service.acquire_active_chat", return_value=True)
    @patch("operoz.assistant.service.release_llm_slot")
    @patch("operoz.assistant.service.try_acquire_llm_slot", return_value=False)
    @patch("operoz.assistant.service.check_assistant_rate_limit", return_value=(True, "ok", 0))
    def test_llm_capacity_yields_retry_after(self, _rate, _try, _rel, _acq, _rel_chat, create_user, workspace):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace, member=create_user, defaults={"role": ROLE.ADMIN.value}
        )
        session = AssistantSession.objects.create(workspace=workspace, user=create_user, context={})
        events = list(iter_chat_events(session, "oi", stream=True, skip_llm_wait=False))
        assert events[0]["type"] == "error"
        assert events[0]["error"] == "llm_capacity"
        assert events[0].get("retry_after") == 15

    @patch("operoz.assistant.llm.concurrency.llm_slots_in_use", return_value=99)
    def test_degraded_mode_when_queue_saturated(self, _slots, workspace):
        assert should_use_degraded_mode(workspace) is True

    @patch("operoz.assistant.service.check_assistant_rate_limit", return_value=(False, "concurrent_rate_limit", 30))
    def test_concurrent_rate_limit_raises_with_retry(self, _rate, create_user, workspace):
        from operoz.assistant.chat_jobs import enqueue_chat_job

        WorkspaceMember.objects.get_or_create(
            workspace=workspace, member=create_user, defaults={"role": ROLE.ADMIN.value}
        )
        session = AssistantSession.objects.create(workspace=workspace, user=create_user, context={})
        with pytest.raises(AssistantServiceError) as exc:
            enqueue_chat_job(session, user=create_user, message="x")
        assert exc.value.code == "concurrent_rate_limit"
        assert exc.value.retry_after == 30

    @patch("operoz.bgtasks.assistant_chat_task.wait_for_llm_resources", return_value=False)
    def test_job_fails_with_llm_wait_timeout_event(self, _wait, create_user, workspace):
        session = AssistantSession.objects.create(workspace=workspace, user=create_user, context={})
        job = AssistantChatJob.objects.create(
            session=session,
            user=create_user,
            message="wait fail",
            status=AssistantChatJob.STATUS_QUEUED,
        )
        result = run_assistant_chat_job_task.run(str(job.id))
        assert result["ok"] is False
        job.refresh_from_db()
        assert job.status == AssistantChatJob.STATUS_FAILED
        types = _job_event_types(str(job.id))
        assert "llm_wait_timeout" in str(types) or any(
            t == "error" for t in types
        )


# ---------------------------------------------------------------------------
# Fase 6 — Contrato API para frontend resiliente (retry, fila)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPhase6FrontendContract:
    @patch("operoz.app.views.assistant.sessions.enqueue_chat_job_safe")
    def test_rate_limit_response_includes_retry_after_header(self, mock_enqueue, session_client, workspace, setup_instance):
        create = session_client.post(
            f"/api/workspaces/{workspace.slug}/assistant/sessions/", {}, format="json"
        )
        session_id = create.data["id"]
        mock_enqueue.side_effect = AssistantServiceError("user_rate_limit", "Limite", retry_after=45)

        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/assistant/sessions/{session_id}/chat/",
            {"message": "spam", "async_mode": True, "stream": True},
            format="json",
        )
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert response["Retry-After"] == "45"
        assert response.data["error"] == "user_rate_limit"

    @patch("operoz.app.views.assistant.sessions.iter_job_events")
    def test_job_stream_endpoint_requires_auth_and_ownership(self, mock_iter, session_client, workspace, create_user, setup_instance):
        session = AssistantSession.objects.create(workspace=workspace, user=create_user, context={})
        job = AssistantChatJob.objects.create(
            session=session,
            user=create_user,
            message="x",
            status=AssistantChatJob.STATUS_QUEUED,
        )
        mock_iter.return_value = iter([
            {"type": "queue_update", "queue_position": 2, "estimated_wait_seconds": 30},
            {"type": "done", "message": {"content": "x", "role": "assistant"}},
        ])

        url = f"/api/workspaces/{workspace.slug}/assistant/chat/jobs/{job.id}/stream/"
        response = session_client.get(url, HTTP_ACCEPT="text/event-stream")
        assert response.status_code == 200
        body = b"".join(response.streaming_content).decode()
        assert "queue_update" in body

        intruder = User.objects.create(email="intruder2@plane.so", username="intruder2")
        WorkspaceMember.objects.create(workspace=workspace, member=intruder, role=ROLE.MEMBER.value)
        session_client.force_authenticate(user=intruder)
        assert session_client.get(url).status_code == status.HTTP_404_NOT_FOUND


# ---------------------------------------------------------------------------
# Fase 7 — Observabilidade
# ---------------------------------------------------------------------------


class TestPhase7Observability:
    @patch("operoz.assistant.observability.collect_assistant_metrics")
    def test_prometheus_includes_all_scaling_gauges(self, mock_collect):
        mock_collect.return_value = {
            "assistant_chat_active": 1,
            "assistant_chat_queue_depth": 0,
            "assistant_chat_stale_jobs": 0,
            "assistant_llm_semaphore_available": 40,
            "assistant_llm_semaphore_in_use": 0,
            "assistant_rag_cache_hit_ratio": 0.0,
            "assistant_latency_p95_first_token_ms": 0,
            "assistant_chat_error_rate": 0.0,
            "collected_at": 1,
        }
        body = render_prometheus_metrics()
        for metric in (
            "assistant_chat_active",
            "assistant_chat_queue_depth",
            "assistant_chat_stale_jobs",
            "assistant_llm_semaphore_available",
            "assistant_rag_cache_hit_ratio",
            "assistant_latency_p95_first_token_ms",
            "assistant_chat_error_rate",
        ):
            assert metric in body

    @pytest.mark.django_db
    def test_metrics_endpoint_auth_and_payload(self):
        token = "phase7-test-token"
        with override_settings(ASSISTANT_METRICS_TOKEN=token):
            client = Client()
            assert client.get("/api/assistant/ops/metrics/").status_code == 401
            response = client.get(
                "/api/assistant/ops/metrics/",
                HTTP_AUTHORIZATION=f"Bearer {token}",
            )
            assert response.status_code == 200
            assert b"assistant_chat_active" in response.content


# ---------------------------------------------------------------------------
# Fase 8 — Governança (ADR, baseline, checklist)
# ---------------------------------------------------------------------------


class TestPhase8Governance:
    GOVERNANCE_DOCS = [
        "operoz-assistant-adr-004-chat-scaling.md",
        "assistant-scaling-baseline.md",
        "assistant-go-live-checklist.md",
        "assistant-incident-runbook.md",
        "assistant-scaling.md",
    ]

    @pytest.mark.parametrize("filename", GOVERNANCE_DOCS)
    def test_governance_doc_exists(self, filename: str):
        path = _docs_root() / filename
        assert path.is_file(), f"Missing governance doc: {filename}"

    def test_adr_004_documents_key_decisions(self):
        content = (_docs_root() / "operoz-assistant-adr-004-chat-scaling.md").read_text(encoding="utf-8")
        for section in ("Contexto", "Decisão", "Consequências", "150"):
            assert section.lower() in content.lower()

    def test_baseline_defines_slas_and_validation_command(self):
        content = (_docs_root() / "assistant-scaling-baseline.md").read_text(encoding="utf-8")
        assert "P95 first token" in content
        assert "validate_assistant_scaling" in content
        assert "150" in content

    def test_adrs_index_links_adr_004(self):
        content = (_docs_root() / "assistant-adrs.md").read_text(encoding="utf-8")
        assert "operoz-assistant-adr-004-chat-scaling.md" in content
        assert "004" in content
