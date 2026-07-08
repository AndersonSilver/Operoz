from __future__ import annotations

import hashlib
import os
from typing import Literal, Sequence

from operoz.assistant.llm.config import GEMINI_OPENAI_BASE_URL, get_llm_base_url
from operoz.assistant.llm.http_client import create_openai_client
from operoz.db.models.search_embedding import EMBEDDING_DIMENSIONS
from operoz.license.utils.instance_value import get_configuration_value
from operoz.utils.exception_logger import log_exception

DEFAULT_OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"
DEFAULT_GEMINI_EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_BATCH_SIZE = 64
DEFAULT_INDEX_RATE_LIMIT_MAX_RETRIES = 8
DEFAULT_INDEX_RATE_LIMIT_BACKOFF_SECONDS = 30
MAX_INDEX_RATE_LIMIT_COUNTDOWN_SECONDS = 600
MIN_INDEX_RATE_LIMIT_COUNTDOWN_SECONDS = 30

OPENAI_EMBEDDING_MODELS = frozenset(
    {
        "text-embedding-3-small",
        "text-embedding-3-large",
        "text-embedding-ada-002",
    }
)
GEMINI_EMBEDDING_MODELS = frozenset(
    {
        "gemini-embedding-001",
        "gemini-embedding-2-preview",
    }
)

EmbeddingPurpose = Literal["document", "query"]


class EmbeddingRateLimitError(Exception):
    """Provider LLM devolveu 429/503 — fila assistant deve fazer retry com backoff."""

    def __init__(self, message: str = "embedding rate limited", *, retry_after_seconds: int | None = None):
        super().__init__(message)
        self.retry_after_seconds = retry_after_seconds


def _parse_retry_after_seconds(exc: Exception) -> int | None:
    response = getattr(exc, "response", None)
    headers = getattr(response, "headers", None) if response is not None else None
    if headers:
        raw = headers.get("retry-after") or headers.get("Retry-After")
        if raw is not None:
            try:
                return max(1, int(float(raw)))
            except (TypeError, ValueError):
                return None
    return None


def _maybe_raise_embedding_rate_limit(exc: Exception) -> None:
    from operoz.assistant.llm.http_client import classify_llm_exception

    if classify_llm_exception(exc) != "llm_rate_limit":
        return
    raise EmbeddingRateLimitError(
        str(exc),
        retry_after_seconds=_parse_retry_after_seconds(exc),
    )


def index_rate_limit_max_retries() -> int:
    raw = os.environ.get("ASSISTANT_INDEX_RATE_LIMIT_MAX_RETRIES", str(DEFAULT_INDEX_RATE_LIMIT_MAX_RETRIES))
    try:
        return max(1, int(raw))
    except ValueError:
        return DEFAULT_INDEX_RATE_LIMIT_MAX_RETRIES


def index_rate_limit_countdown(exc: EmbeddingRateLimitError, retries: int) -> int:
    if exc.retry_after_seconds is not None:
        return min(
            MAX_INDEX_RATE_LIMIT_COUNTDOWN_SECONDS,
            max(MIN_INDEX_RATE_LIMIT_COUNTDOWN_SECONDS, exc.retry_after_seconds),
        )
    raw = os.environ.get(
        "ASSISTANT_INDEX_RATE_LIMIT_BACKOFF_SECONDS",
        str(DEFAULT_INDEX_RATE_LIMIT_BACKOFF_SECONDS),
    )
    try:
        base = max(5, int(raw))
    except ValueError:
        base = DEFAULT_INDEX_RATE_LIMIT_BACKOFF_SECONDS
    return min(MAX_INDEX_RATE_LIMIT_COUNTDOWN_SECONDS, base * (2**retries))


def content_hash(text: str) -> str:
    return hashlib.sha256((text or "").encode("utf-8")).hexdigest()


def _resolve_embedding_provider(provider_key: str | None, api_key: str | None) -> str:
    explicit = (provider_key or os.environ.get("LLM_PROVIDER") or "openai").strip().lower()
    if explicit != "openai":
        return explicit
    if api_key and str(api_key).startswith("AIza"):
        return "gemini"
    return "openai"


def _default_embedding_model(provider_key: str) -> str:
    if provider_key == "gemini":
        return DEFAULT_GEMINI_EMBEDDING_MODEL
    return DEFAULT_OPENAI_EMBEDDING_MODEL


def _resolve_embedding_model(provider_key: str, configured_model: str | None) -> str:
    if not configured_model:
        return _default_embedding_model(provider_key)
    if provider_key == "gemini" and configured_model in OPENAI_EMBEDDING_MODELS:
        return _default_embedding_model("gemini")
    if provider_key == "openai" and configured_model in GEMINI_EMBEDDING_MODELS:
        return _default_embedding_model("openai")
    return configured_model


def get_embedding_config() -> tuple[str | None, str, str | None, str]:
    """Returns (api_key, model, base_url, provider_key)."""
    from operoz.assistant.llm.key_pool import get_api_key, list_api_keys

    api_key = get_api_key()
    if not api_key:
        keys = list_api_keys()
        if keys:
            api_key = keys[0]

    (provider_key,) = get_configuration_value(
        [{"key": "LLM_PROVIDER", "default": os.environ.get("LLM_PROVIDER", "openai")}]
    )

    if not api_key:
        (api_key,) = get_configuration_value([{"key": "LLM_API_KEY", "default": os.environ.get("LLM_API_KEY", None)}])

    provider_key = _resolve_embedding_provider(provider_key, api_key)
    configured_model = os.environ.get("ASSISTANT_EMBEDDING_MODEL", "").strip() or None
    model = _resolve_embedding_model(provider_key, configured_model)
    base_url = get_llm_base_url(provider_key=provider_key)

    return api_key, model, base_url, provider_key


def embedding_cache_scope() -> str:
    """Stable cache namespace for provider + model (RAG embedding cache)."""
    _, model, _, provider_key = get_embedding_config()
    return f"{provider_key}:{model}"


def _embedding_request_kwargs(provider_key: str, model: str, *, purpose: EmbeddingPurpose) -> dict:
    del purpose  # reservado para embedContent nativo; OpenAI-compat não expõe task_type
    if provider_key in {"openai", "gemini"} and (
        model.startswith("text-embedding-3") or model.startswith("gemini-embedding")
    ):
        return {"dimensions": EMBEDDING_DIMENSIONS}
    return {}


def _normalize_vector(vector: list[float]) -> list[float] | None:
    if len(vector) == EMBEDDING_DIMENSIONS:
        return vector
    if len(vector) > EMBEDDING_DIMENSIONS:
        return vector[:EMBEDDING_DIMENSIONS]
    log_exception(ValueError(f"Embedding vector has {len(vector)} dimensions; expected {EMBEDDING_DIMENSIONS}"))
    return None


def _embed_texts_uncached(
    texts: Sequence[str],
    *,
    purpose: EmbeddingPurpose = "document",
) -> list[list[float]] | None:
    if not texts:
        return []

    api_key, model, base_url, provider_key = get_embedding_config()
    if not api_key:
        log_exception(ValueError("LLM_API_KEY missing for embeddings"))
        return None

    cleaned = [(t or "").strip() for t in texts]
    if not any(cleaned):
        return [[] for _ in cleaned]

    request_kwargs = _embedding_request_kwargs(provider_key, model, purpose=purpose)

    try:
        client = create_openai_client(api_key, base_url=base_url)
        vectors: list[list[float]] = []
        for start in range(0, len(cleaned), EMBEDDING_BATCH_SIZE):
            batch = cleaned[start : start + EMBEDDING_BATCH_SIZE]
            response = client.embeddings.create(model=model, input=batch, **request_kwargs)
            for item in response.data:
                normalized = _normalize_vector(list(item.embedding))
                if normalized is None:
                    return None
                vectors.append(normalized)
        return vectors
    except Exception as exc:
        _maybe_raise_embedding_rate_limit(exc)
        log_exception(exc)
        return None


def embed_texts(
    texts: Sequence[str],
    *,
    use_cache: bool = True,
    purpose: EmbeddingPurpose = "document",
) -> list[list[float]] | None:
    if use_cache:
        from operoz.assistant.embedding_cache import embed_texts_cached

        return embed_texts_cached(texts, purpose=purpose)
    return _embed_texts_uncached(texts, purpose=purpose)


def gemini_embedding_base_url() -> str:
    """Exposed for tests/docs parity with chat Gemini routing."""
    return GEMINI_OPENAI_BASE_URL
