"""Leitura de variáveis de ambiente do RAG, com fallback para os nomes antigos.

O pacote foi renomeado de `assistant` para `rag` depois que o chat saiu, e as
variáveis acompanharam: `ASSISTANT_*` virou `RAG_*`. O `.env` de produção ainda
carrega os nomes antigos, e o deploy não pode depender de o servidor ser editado
no mesmo instante — se o código pedisse só `RAG_*`, a indexação voltaria aos
defaults silenciosamente. O fallback sai quando os `.env` estiverem migrados.

Deliberadamente sem dependências além de `os`: este módulo é importado por
`embeddings`, `embedding_cache` e `rag_cache`, e qualquer import de Django aqui
recria o ciclo que `rag_flags` já evita.

`settings/common.py` mantém uma cópia própria desta lógica porque não pode
importar nada sob `operoz.` — `operoz/__init__.py` carrega o Celery, que por sua
vez lê as settings.
"""

from __future__ import annotations

import os

# Nomes que no esquema antigo carregavam o prefixo duplicado ASSISTANT_RAG_.
_LEGACY_DOUBLE_PREFIX = frozenset(
    {
        "ENABLED",
        "INDEXING_ENABLED",
        "TOP_K",
        "CANDIDATE_LIMIT",
        "RRF_K",
        "QUERY_EMBEDDING_CACHE_TTL",
        "RESULTS_CACHE_TTL",
        "HNSW_EF_SEARCH",
    }
)


def legacy_name(suffix: str) -> str:
    """Nome antigo (ASSISTANT_*) correspondente a RAG_<suffix>."""
    prefix = "ASSISTANT_RAG_" if suffix in _LEGACY_DOUBLE_PREFIX else "ASSISTANT_"
    return f"{prefix}{suffix}"


def rag_env(suffix: str, default: str = "") -> str:
    """Lê RAG_<suffix>, caindo para o nome antigo e depois para `default`."""
    return os.environ.get(f"RAG_{suffix}") or os.environ.get(legacy_name(suffix), default)
