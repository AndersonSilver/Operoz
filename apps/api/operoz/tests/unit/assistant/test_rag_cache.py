from __future__ import annotations

from unittest.mock import patch

import pytest

from operoz.assistant.embedding_cache import embed_query_cached
from operoz.assistant.rag_cache import get_cached_rag_results, normalize_query, query_hash, store_rag_results
from operoz.assistant.types import AssistantActorContext


@pytest.mark.unit
class TestRagCache:
    def test_normalize_query_collapses_whitespace_and_case(self):
        assert normalize_query("  Olá   Mundo  ") == "olá mundo"

    def test_query_hash_stable_for_normalized_variants(self):
        assert query_hash("Teste RAG") == query_hash("  teste   rag ")

    @patch("operoz.assistant.rag_cache.cache")
    @pytest.mark.django_db
    def test_store_and_get_roundtrip(self, mock_cache, create_user, workspace):
        ctx = AssistantActorContext(user=create_user, workspace=workspace, board_slug="board-a", project_id=None)
        payload = [{"embedding_id": "1", "entity_type": "issue", "entity_id": "x", "chunk_index": 0, "content": "c"}]
        stored = {}

        def _set(key, value, timeout=None):
            stored[key] = value

        def _get(key):
            return stored.get(key)

        mock_cache.set.side_effect = _set
        mock_cache.get.side_effect = _get

        store_rag_results(ctx, "pergunta teste", payload)
        cached = get_cached_rag_results(ctx, "PERGUNTA   teste")
        assert cached == payload


@pytest.mark.unit
class TestQueryEmbeddingCache:
    @patch("operoz.assistant.embedding_cache.embedding_cache_scope", return_value="openai:text-embedding-3-small")
    @patch("operoz.assistant.embedding_cache._embed_texts_uncached")
    @patch("operoz.assistant.embedding_cache.cache")
    def test_embed_query_uses_short_ttl_prefix(self, mock_cache, mock_embed, _scope):
        mock_cache.get.return_value = None
        mock_embed.return_value = [[0.1, 0.2]]

        vector = embed_query_cached("  Query RAG  ")
        assert vector == [0.1, 0.2]
        assert mock_embed.call_args[0][0] == ["query rag"]
        assert mock_cache.set.called
        key_used = mock_cache.set.call_args[0][0]
        assert key_used.startswith("assistant:rag:query-embedding:openai:text-embedding-3-small:")
