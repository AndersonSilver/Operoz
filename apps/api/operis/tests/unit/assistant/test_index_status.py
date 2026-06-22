from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest

from operis.app.permissions import ROLE
from operis.assistant.index_status import (
    mark_index_pending,
    persist_index_outcome,
    resolve_page_index_status,
)
from operis.db.models import Page, Project, ProjectMember, SearchEmbedding, WorkspaceMember


@pytest.mark.unit
@pytest.mark.django_db
class TestIndexStatus:
    @patch("operis.assistant.signals.schedule_entity_index")
    @patch("operis.assistant.index_status.is_rag_enabled", return_value=True)
    @patch("operis.assistant.index_status._load_status_record")
    @patch("operis.assistant.index_status.is_index_debounce_active", return_value=True)
    @patch("operis.assistant.index_status._redis_ttl", return_value=18)
    def test_resolve_pending_when_debounce_active(
        self, _ttl, _debounce, mock_load, _rag, _schedule, create_user, workspace
    ):
        page = Page.objects.create(
            name="Manual da Tradição",
            description_html="<p>Conteúdo sobre tradição operacional.</p>",
            workspace=workspace,
            owned_by=create_user,
        )
        mock_load.return_value = None

        status = resolve_page_index_status(page)
        assert status["status"] == "pending"
        assert status["estimated_seconds_remaining"] == 18 + 45
        assert status["eta_at"] is not None

    @patch("operis.assistant.index_status.is_rag_enabled", return_value=True)
    @patch("operis.assistant.index_status._compute_index_duration_seconds", return_value=75)
    @patch("operis.assistant.index_status._load_status_record", return_value={"queued_at": "2026-06-11T12:00:00+00:00"})
    @patch("operis.assistant.index_status._save_status_record")
    def test_persist_index_outcome_indexed(self, mock_save, _load, _duration, _rag):
        persist_index_outcome(
            SearchEmbedding.ENTITY_PAGE,
            "page-id",
            {"ok": True, "indexed": 3},
            fingerprint="abc",
        )
        payload = mock_save.call_args[0][2]
        assert payload["status"] == "indexed"
        assert payload["chunk_count"] == 3
        assert payload["last_index_duration_seconds"] == 75

    @patch("operis.assistant.index_status.is_rag_enabled", return_value=True)
    @patch("operis.assistant.index_status._save_status_record")
    def test_mark_index_pending(self, mock_save, _rag):
        mark_index_pending(SearchEmbedding.ENTITY_PAGE, "page-id")
        payload = mock_save.call_args[0][2]
        assert payload["status"] == "pending"

    @patch("operis.assistant.signals.schedule_entity_index")
    @patch("operis.assistant.index_status.is_rag_enabled", return_value=False)
    def test_resolve_disabled(self, _rag, _schedule, create_user, workspace):
        page = Page.objects.create(
            name="Doc",
            description_html="<p>x</p>",
            workspace=workspace,
            owned_by=create_user,
        )
        assert resolve_page_index_status(page)["status"] == "disabled"

    @patch("operis.assistant.signals.schedule_entity_index")
    @patch("operis.assistant.index_status.is_rag_enabled", return_value=True)
    @patch("operis.assistant.index_status._load_status_record")
    @patch("operis.assistant.index_status.is_index_debounce_active", return_value=False)
    def test_resolve_indexed_from_db_chunks(
        self,
        _debounce,
        mock_load,
        _rag,
        _schedule,
        create_user,
        workspace,
        workspace_board,
    ):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=create_user,
            defaults={"role": ROLE.ADMIN.value},
        )
        project = Project.objects.create(
            name="Operoz",
            identifier="OPZ",
            workspace=workspace,
            board=workspace_board,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=ROLE.ADMIN.value)
        page = Page.objects.create(
            name="Manual",
            description_html="<p>Texto indexável do manual.</p>",
            workspace=workspace,
            owned_by=create_user,
        )
        mock_load.return_value = None
        SearchEmbedding.objects.create(
            workspace=workspace,
            entity_type=SearchEmbedding.ENTITY_PAGE,
            entity_id=page.id,
            chunk_index=0,
            content="Manual\n\nTexto indexável do manual.",
            embedding=[0.0] * 1536,
        )

        status = resolve_page_index_status(page)
        assert status["status"] == "indexed"
        assert status["chunk_count"] == 1

    @patch("operis.assistant.signals.schedule_entity_index")
    @patch("operis.assistant.index_status.is_rag_enabled", return_value=True)
    @patch("operis.assistant.index_status._load_status_record")
    @patch("operis.assistant.index_status.is_index_debounce_active", return_value=False)
    def test_stale_pending_record_still_shows_indexed(
        self,
        _debounce,
        mock_load,
        _rag,
        _schedule,
        create_user,
        workspace,
        workspace_board,
    ):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=create_user,
            defaults={"role": ROLE.ADMIN.value},
        )
        project = Project.objects.create(
            name="Operoz",
            identifier="OPZ",
            workspace=workspace,
            board=workspace_board,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=ROLE.ADMIN.value)
        page = Page.objects.create(
            name="Manual",
            description_html="<p>Texto indexável do manual.</p>",
            workspace=workspace,
            owned_by=create_user,
        )
        from operis.assistant.index_status import compute_page_fingerprint

        fingerprint = compute_page_fingerprint(page)
        mock_load.return_value = {
            "status": "pending",
            "updated_at": "2026-06-11T12:00:00+00:00",
            "fingerprint": fingerprint,
            "chunk_count": 0,
        }
        SearchEmbedding.objects.create(
            workspace=workspace,
            entity_type=SearchEmbedding.ENTITY_PAGE,
            entity_id=page.id,
            chunk_index=0,
            content="Manual\n\nTexto indexável do manual.",
            embedding=[0.0] * 1536,
        )

        status = resolve_page_index_status(page)
        assert status["status"] == "indexed"
        assert status["chunk_count"] == 1

    @patch("operis.assistant.signals.schedule_entity_index")
    @patch("operis.assistant.index_status.is_rag_enabled", return_value=True)
    @patch("operis.assistant.index_status._load_status_record", return_value=None)
    @patch("operis.assistant.index_status.is_index_debounce_active", return_value=False)
    @patch("operis.assistant.indexing_scheduler.index_entity_task")
    def test_not_indexed_auto_queues_index(
        self,
        _task,
        _debounce,
        _load,
        _rag,
        _schedule,
        create_user,
        workspace,
    ):
        page = Page.objects.create(
            name="Manual Tradição",
            description_html=(
                '<html-document-embed src="00000000-0000-4000-8000-000000000001" '
                'title="Manual"></html-document-embed>'
            ),
            workspace=workspace,
            owned_by=create_user,
        )

        status = resolve_page_index_status(page)
        assert status["status"] == "pending"
        assert status["estimated_seconds_remaining"] is not None

    @patch("operis.assistant.indexing_scheduler.ensure_page_index_queued")
    @patch("operis.assistant.signals.schedule_entity_index")
    @patch("operis.assistant.index_status.is_rag_enabled", return_value=True)
    @patch("operis.assistant.index_status._load_status_record")
    @patch("operis.assistant.index_status.is_index_debounce_active", return_value=False)
    def test_pending_without_debounce_does_not_requeue_on_poll(
        self,
        _debounce,
        mock_load,
        _rag,
        _schedule,
        mock_ensure,
        create_user,
        workspace,
    ):
        page = Page.objects.create(
            name="Magalu Consórcios",
            description_html="<p>PRD consórcio Magalu.</p>",
            workspace=workspace,
            owned_by=create_user,
        )
        now = datetime.now(timezone.utc)
        mock_load.return_value = {
            "status": "pending",
            "updated_at": now.isoformat(),
            "queued_at": now.isoformat(),
            "eta_at": (now + timedelta(seconds=75)).isoformat(),
            "chunk_count": 0,
        }

        status = resolve_page_index_status(page)

        assert status["status"] == "pending"
        mock_ensure.assert_not_called()
        _schedule.assert_not_called()
