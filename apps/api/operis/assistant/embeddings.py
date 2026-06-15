from __future__ import annotations

import hashlib
import os
from typing import Sequence

from operis.assistant.llm.http_client import create_openai_client
from operis.license.utils.instance_value import get_configuration_value
from operis.utils.exception_logger import log_exception

DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_BATCH_SIZE = 64


def content_hash(text: str) -> str:
    return hashlib.sha256((text or "").encode("utf-8")).hexdigest()


def get_embedding_config() -> tuple[str | None, str]:
    from operis.assistant.llm.key_pool import get_api_key

    api_key = get_api_key()
    if not api_key:
        (api_key,) = get_configuration_value(
            [{"key": "LLM_API_KEY", "default": os.environ.get("LLM_API_KEY", None)}]
        )
    model = os.environ.get("ASSISTANT_EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL)
    return api_key, model


def _embed_texts_uncached(texts: Sequence[str]) -> list[list[float]] | None:
    if not texts:
        return []

    api_key, model = get_embedding_config()
    if not api_key:
        log_exception(ValueError("LLM_API_KEY missing for embeddings"))
        return None

    cleaned = [(t or "").strip() for t in texts]
    if not any(cleaned):
        return [[] for _ in cleaned]

    try:
        client = create_openai_client(api_key)
        vectors: list[list[float]] = []
        for start in range(0, len(cleaned), EMBEDDING_BATCH_SIZE):
            batch = cleaned[start : start + EMBEDDING_BATCH_SIZE]
            response = client.embeddings.create(model=model, input=batch)
            vectors.extend(item.embedding for item in response.data)
        return vectors
    except Exception as exc:
        log_exception(exc)
        return None


def embed_texts(texts: Sequence[str], *, use_cache: bool = True) -> list[list[float]] | None:
    if use_cache:
        from operis.assistant.embedding_cache import embed_texts_cached

        return embed_texts_cached(texts)
    return _embed_texts_uncached(texts)
