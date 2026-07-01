from __future__ import annotations

import json
import logging
import os
from typing import Sequence

from django.core.cache import cache

from operoz.assistant.embeddings import (
    EmbeddingPurpose,
    _embed_texts_uncached,
    content_hash,
    embedding_cache_scope,
)
from operoz.assistant.rag_cache import normalize_query

logger = logging.getLogger(__name__)

CACHE_PREFIX = "assistant:embedding:"
QUERY_CACHE_PREFIX = "assistant:rag:query-embedding:"
DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days — indexação de conteúdo
DEFAULT_QUERY_TTL_SECONDS = 60 * 10  # 10 minutes — queries RAG


def _content_cache_ttl() -> int:
    raw = os.environ.get("ASSISTANT_EMBEDDING_CACHE_TTL", str(DEFAULT_TTL_SECONDS))
    try:
        return max(60, int(raw))
    except ValueError:
        return DEFAULT_TTL_SECONDS


def _query_cache_ttl() -> int:
    raw = os.environ.get("ASSISTANT_RAG_QUERY_EMBEDDING_CACHE_TTL", str(DEFAULT_QUERY_TTL_SECONDS))
    try:
        return max(60, int(raw))
    except ValueError:
        return DEFAULT_QUERY_TTL_SECONDS


def _cache_key(prefix: str, model: str, digest: str) -> str:
    return f"{prefix}{model}:{digest}"


def _load_cached_vector(prefix: str, model: str, digest: str) -> list[float] | None:
    raw = cache.get(_cache_key(prefix, model, digest))
    if raw is None:
        return None
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list) and parsed:
            return [float(v) for v in parsed]
    except (TypeError, ValueError, json.JSONDecodeError):
        return None
    return None


def _store_cached_vector(prefix: str, model: str, digest: str, vector: list[float], *, ttl: int) -> None:
    if not vector:
        return
    cache.set(_cache_key(prefix, model, digest), json.dumps(vector), timeout=ttl)


def embed_texts_cached(
    texts: Sequence[str],
    *,
    purpose: EmbeddingPurpose = "document",
) -> list[list[float]] | None:
    """Embeddings com cache por hash de conteúdo (Redis via Django cache)."""
    if not texts:
        return []

    cache_scope = embedding_cache_scope()
    cleaned = [(t or "").strip() for t in texts]
    hashes = [content_hash(text) for text in cleaned]

    vectors: list[list[float] | None] = [None] * len(cleaned)
    misses: list[tuple[int, str]] = []

    for index, (text, digest) in enumerate(zip(cleaned, hashes, strict=True)):
        if not text:
            vectors[index] = []
            continue
        cached = _load_cached_vector(CACHE_PREFIX, cache_scope, digest)
        if cached is not None:
            vectors[index] = cached
        else:
            misses.append((index, text))

    if misses:
        fetched = _embed_texts_uncached([text for _, text in misses], purpose=purpose)
        if fetched is None:
            return None
        for (index, _), vector in zip(misses, fetched, strict=True):
            vectors[index] = vector
            if vector:
                _store_cached_vector(
                    CACHE_PREFIX, cache_scope, hashes[index], vector, ttl=_content_cache_ttl()
                )

    return [v if v is not None else [] for v in vectors]


def embed_query_cached(query: str) -> list[float] | None:
    """Embedding de query RAG com TTL curto e normalização."""
    normalized = normalize_query(query)
    if not normalized:
        return None

    cache_scope = embedding_cache_scope()
    digest = content_hash(normalized)
    cached = _load_cached_vector(QUERY_CACHE_PREFIX, cache_scope, digest)
    if cached is not None:
        from operoz.assistant.observability import record_rag_cache_access

        record_rag_cache_access(hit=True)
        logger.debug(
            "assistant query embedding cache hit scope=%s digest=%s", cache_scope, digest[:12]
        )
        return cached

    from operoz.assistant.observability import record_rag_cache_access

    record_rag_cache_access(hit=False)
    fetched = _embed_texts_uncached([normalized], purpose="query")
    if not fetched or not fetched[0]:
        return None
    vector = fetched[0]
    _store_cached_vector(QUERY_CACHE_PREFIX, cache_scope, digest, vector, ttl=_query_cache_ttl())
    return vector
