"""Fallback de ASSISTANT_* para RAG_*.

É o que permite renomear as variáveis sem editar o .env dos servidores no mesmo
instante do deploy. Se este contrato quebrar, a indexação volta silenciosamente
aos defaults em produção — sem erro, sem log.
"""

import pytest

from operoz.rag.env import legacy_name, rag_env


class TestLegacyName:
    @pytest.mark.parametrize(
        "suffix,esperado",
        [
            # Prefixo duplicado no esquema antigo.
            ("ENABLED", "ASSISTANT_RAG_ENABLED"),
            ("INDEXING_ENABLED", "ASSISTANT_RAG_INDEXING_ENABLED"),
            ("TOP_K", "ASSISTANT_RAG_TOP_K"),
            ("RESULTS_CACHE_TTL", "ASSISTANT_RAG_RESULTS_CACHE_TTL"),
            # Prefixo simples.
            ("CELERY_QUEUE", "ASSISTANT_CELERY_QUEUE"),
            ("EMBEDDING_MODEL", "ASSISTANT_EMBEDDING_MODEL"),
            ("EMBEDDING_CACHE_TTL", "ASSISTANT_EMBEDDING_CACHE_TTL"),
            ("INDEX_RATE_LIMIT_MAX_RETRIES", "ASSISTANT_INDEX_RATE_LIMIT_MAX_RETRIES"),
        ],
    )
    def test_mapeia_o_nome_antigo(self, suffix, esperado):
        assert legacy_name(suffix) == esperado


class TestRagEnv:
    def test_prefere_o_nome_novo(self, monkeypatch):
        monkeypatch.setenv("RAG_TOP_K", "9")
        monkeypatch.setenv("ASSISTANT_RAG_TOP_K", "5")
        assert rag_env("TOP_K", "3") == "9"

    def test_cai_para_o_nome_antigo(self, monkeypatch):
        monkeypatch.delenv("RAG_TOP_K", raising=False)
        monkeypatch.setenv("ASSISTANT_RAG_TOP_K", "5")
        assert rag_env("TOP_K", "3") == "5"

    def test_usa_o_default_quando_nenhum_existe(self, monkeypatch):
        monkeypatch.delenv("RAG_TOP_K", raising=False)
        monkeypatch.delenv("ASSISTANT_RAG_TOP_K", raising=False)
        assert rag_env("TOP_K", "3") == "3"

    def test_valor_vazio_no_nome_novo_cai_para_o_antigo(self, monkeypatch):
        # Um RAG_* declarado vazio no .env não deve mascarar o valor antigo.
        monkeypatch.setenv("RAG_EMBEDDING_MODEL", "")
        monkeypatch.setenv("ASSISTANT_EMBEDDING_MODEL", "text-embedding-3-small")
        assert rag_env("EMBEDDING_MODEL") == "text-embedding-3-small"

    def test_default_vazio(self, monkeypatch):
        monkeypatch.delenv("RAG_EMBEDDING_MODEL", raising=False)
        monkeypatch.delenv("ASSISTANT_EMBEDDING_MODEL", raising=False)
        assert rag_env("EMBEDDING_MODEL") == ""

    def test_prefixo_simples_nao_le_o_duplicado(self, monkeypatch):
        # CELERY_QUEUE nunca teve o prefixo ASSISTANT_RAG_.
        monkeypatch.delenv("RAG_CELERY_QUEUE", raising=False)
        monkeypatch.delenv("ASSISTANT_CELERY_QUEUE", raising=False)
        monkeypatch.setenv("ASSISTANT_RAG_CELERY_QUEUE", "fila-errada")
        assert rag_env("CELERY_QUEUE", "assistant") == "assistant"
