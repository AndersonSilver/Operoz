import pytest
from django.test import override_settings

from operoz.assistant.indexing import index_entity
from operoz.assistant.indexing_scheduler import schedule_entity_index
from operoz.assistant.rag_flags import is_rag_indexing_enabled
from operoz.db.models import SearchEmbedding

ENTITY_ID = "44444444-4444-4444-4444-444444444444"
WORKSPACE_ID = "55555555-5555-5555-5555-555555555555"


@pytest.mark.unit
class TestRagIndexingFlag:
    def test_enabled_by_default(self):
        assert is_rag_indexing_enabled() is True

    @pytest.mark.parametrize("value", ["0", "false", "FALSE", "no"])
    def test_disabled_by_falsy_values(self, value):
        with override_settings(ASSISTANT_RAG_INDEXING_ENABLED=value):
            assert is_rag_indexing_enabled() is False

    @pytest.mark.parametrize("value", ["1", "true", "sim-qualquer-coisa"])
    def test_enabled_by_any_other_value(self, value):
        with override_settings(ASSISTANT_RAG_INDEXING_ENABLED=value):
            assert is_rag_indexing_enabled() is True


@pytest.mark.unit
class TestSchedulerRespectsFlag:
    @override_settings(ASSISTANT_RAG_INDEXING_ENABLED="0")
    def test_schedule_does_not_enqueue_when_disabled(self, monkeypatch):
        calls = []
        monkeypatch.setattr(
            "operoz.assistant.indexing_scheduler.mark_index_pending",
            lambda *args, **kwargs: calls.append("mark"),
        )
        monkeypatch.setattr(
            "operoz.assistant.indexing_scheduler.index_entity_task.apply_async",
            lambda *args, **kwargs: calls.append("enqueue"),
        )

        schedule_entity_index(SearchEmbedding.ENTITY_PAGE, ENTITY_ID, WORKSPACE_ID)

        assert calls == []

    def test_schedule_enqueues_when_enabled(self, monkeypatch):
        calls = []
        monkeypatch.setattr(
            "operoz.assistant.indexing_scheduler.mark_index_pending",
            lambda *args, **kwargs: calls.append("mark"),
        )
        monkeypatch.setattr(
            "operoz.assistant.indexing_scheduler.index_entity_task.apply_async",
            lambda *args, **kwargs: calls.append("enqueue"),
        )

        schedule_entity_index(SearchEmbedding.ENTITY_PAGE, ENTITY_ID, WORKSPACE_ID)

        assert "mark" in calls


@pytest.mark.unit
class TestIndexEntityRespectsFlag:
    @override_settings(ASSISTANT_RAG_INDEXING_ENABLED="0")
    def test_index_entity_skips_without_touching_db(self, db, monkeypatch):
        def _fail(*args, **kwargs):
            raise AssertionError("não deveria carregar chunks com indexação desligada")

        monkeypatch.setattr("operoz.assistant.indexing._load_entity_chunks", _fail)

        result = index_entity(SearchEmbedding.ENTITY_PAGE, ENTITY_ID, workspace_id=WORKSPACE_ID)

        assert result == {"ok": True, "indexed": 0, "skipped": "indexing_disabled"}
        assert not SearchEmbedding.objects.filter(entity_id=ENTITY_ID).exists()
