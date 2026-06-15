from __future__ import annotations

import json
import logging
import os
import re
from typing import Any

from django.core.cache import cache

from operis.assistant.embeddings import content_hash
from operis.assistant.types import AssistantActorContext

logger = logging.getLogger(__name__)

RAG_RESULTS_PREFIX = "assistant:rag:results:"
DEFAULT_RESULTS_TTL_SECONDS = 60 * 3  # 3 minutes


def normalize_query(text: str) -> str:
    """Normaliza query para cache (case-insensitive, whitespace colapsado)."""
    cleaned = (text or "").strip().casefold()
    return re.sub(r"\s+", " ", cleaned)


def query_hash(text: str) -> str:
    return content_hash(normalize_query(text))


def _results_ttl() -> int:
    raw = os.environ.get("ASSISTANT_RAG_RESULTS_CACHE_TTL", str(DEFAULT_RESULTS_TTL_SECONDS))
    try:
        return max(30, int(raw))
    except ValueError:
        return DEFAULT_RESULTS_TTL_SECONDS


def _cache_key(ctx: AssistantActorContext, digest: str) -> str:
    board = (ctx.board_slug or "").strip().casefold()
    project = str(ctx.project_id or "")
    user_id = str(ctx.user.id)
    return f"{RAG_RESULTS_PREFIX}{ctx.workspace.id}:{user_id}:{board}:{project}:{digest}"


def get_cached_rag_results(ctx: AssistantActorContext, query: str) -> list[dict[str, Any]] | None:
    from operis.assistant.observability import record_rag_cache_access

    digest = query_hash(query)
    raw = cache.get(_cache_key(ctx, digest))
    if raw is None:
        record_rag_cache_access(hit=False)
        return None
    try:
        payload = json.loads(raw)
        if not isinstance(payload, list):
            record_rag_cache_access(hit=False)
            return None
        record_rag_cache_access(hit=True)
        logger.debug(
            "assistant rag cache hit workspace=%s query_hash=%s chunks=%s",
            ctx.workspace.id,
            digest[:12],
            len(payload),
        )
        return payload
    except (TypeError, ValueError, json.JSONDecodeError):
        return None


def store_rag_results(ctx: AssistantActorContext, query: str, chunks: list[dict[str, Any]]) -> None:
    digest = query_hash(query)
    cache.set(_cache_key(ctx, digest), json.dumps(chunks), timeout=_results_ttl())


def invalidate_workspace_rag_cache(workspace_id: str) -> None:
    """Invalida entradas RAG do workspace (best-effort via pattern delete)."""
    try:
        from operis.settings.redis import redis_instance

        ri = redis_instance()
        pattern = f"{RAG_RESULTS_PREFIX}{workspace_id}:*"
        cursor = 0
        deleted = 0
        while True:
            cursor, keys = ri.scan(cursor=cursor, match=pattern, count=200)
            if keys:
                deleted += ri.delete(*keys)
            if cursor == 0:
                break
        if deleted:
            logger.info("assistant rag cache invalidated workspace=%s keys=%s", workspace_id, deleted)
    except Exception:
        logger.exception("assistant rag cache invalidation failed workspace=%s", workspace_id)
