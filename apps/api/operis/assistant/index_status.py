from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from operis.assistant.embeddings import content_hash
from operis.assistant.page_content import build_page_indexable_text
from operis.assistant.retrieval import is_rag_enabled
from operis.db.models import Page, SearchEmbedding
from operis.settings.redis import redis_instance

logger = logging.getLogger(__name__)

DEBOUNCE_SECONDS = 30
PROCESSING_ESTIMATE_SECONDS = 45
PENDING_STALE_SECONDS = 600

AssistantIndexStatus = Literal[
    "disabled",
    "empty",
    "not_indexed",
    "pending",
    "processing",
    "indexed",
    "failed",
    "stale",
]

_STATUS_TTL_SECONDS = {
    "pending": 900,
    "processing": 900,
    "indexed": 60 * 60 * 24 * 7,
    "failed": 60 * 60 * 24,
}

_DEBOUNCE_KEY_PREFIX = "assistant:index:debounce"
_STATUS_KEY_PREFIX = "assistant:index:status"


def _status_key(entity_type: str, entity_id: str) -> str:
    return f"{_STATUS_KEY_PREFIX}:{entity_type}:{entity_id}"


def _debounce_key(entity_type: str, entity_id: str) -> str:
    return f"{_DEBOUNCE_KEY_PREFIX}:{entity_type}:{entity_id}"


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _redis_get(key: str) -> str | None:
    try:
        redis = redis_instance()
        value = redis.get(key)
        if value is None:
            return None
        if isinstance(value, bytes):
            return value.decode("utf-8")
        return str(value)
    except Exception:
        return None


def _redis_setex(key: str, ttl: int, value: str) -> None:
    try:
        redis = redis_instance()
        redis.setex(key, ttl, value)
    except Exception:
        logger.debug("assistant index status: redis set failed key=%s", key)


def _redis_ttl(key: str) -> int | None:
    try:
        redis = redis_instance()
        ttl = redis.ttl(key)
        if ttl is None or ttl < 0:
            return None
        return int(ttl)
    except Exception:
        return None


def _parse_iso_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed
    except ValueError:
        return None


def _eta_iso(seconds_from_now: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(seconds=seconds_from_now)).isoformat()


def _load_status_record(entity_type: str, entity_id: str) -> dict[str, Any] | None:
    raw = _redis_get(_status_key(entity_type, entity_id))
    if not raw:
        return None
    try:
        data = json.loads(raw)
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError:
        return None


def _save_status_record(entity_type: str, entity_id: str, payload: dict[str, Any]) -> None:
    status = payload.get("status", "pending")
    ttl = _STATUS_TTL_SECONDS.get(status, 900)
    _redis_setex(_status_key(entity_type, entity_id), ttl, json.dumps(payload))


def is_index_debounce_active(entity_type: str, entity_id: str) -> bool:
    return bool(_redis_get(_debounce_key(entity_type, entity_id)))


def mark_index_pending(entity_type: str, entity_id: str) -> None:
    previous = _load_status_record(entity_type, entity_id) or {}
    _save_status_record(
        entity_type,
        entity_id,
        {
            "status": "pending",
            "updated_at": _utc_now_iso(),
            "queued_at": _utc_now_iso(),
            "eta_at": _eta_iso(DEBOUNCE_SECONDS + PROCESSING_ESTIMATE_SECONDS),
            "chunk_count": previous.get("chunk_count", 0),
            "fingerprint": previous.get("fingerprint"),
            "error": None,
        },
    )


def mark_index_processing(entity_type: str, entity_id: str) -> None:
    previous = _load_status_record(entity_type, entity_id) or {}
    _save_status_record(
        entity_type,
        entity_id,
        {
            "status": "processing",
            "updated_at": _utc_now_iso(),
            "queued_at": previous.get("queued_at") or _utc_now_iso(),
            "processing_started_at": _utc_now_iso(),
            "eta_at": _eta_iso(PROCESSING_ESTIMATE_SECONDS),
            "chunk_count": previous.get("chunk_count", 0),
            "fingerprint": previous.get("fingerprint"),
            "error": None,
        },
    )


def _compute_index_duration_seconds(record: dict[str, Any]) -> int | None:
    start = _parse_iso_datetime(record.get("queued_at")) or _parse_iso_datetime(
        record.get("processing_started_at")
    )
    if not start:
        return None
    return max(1, int((datetime.now(timezone.utc) - start).total_seconds()))


def persist_index_outcome(
    entity_type: str,
    entity_id: str,
    result: dict[str, Any],
    *,
    fingerprint: str | None = None,
) -> None:
    previous = _load_status_record(entity_type, entity_id) or {}
    duration_seconds = _compute_index_duration_seconds(previous)
    if not result.get("ok"):
        _save_status_record(
            entity_type,
            entity_id,
            {
                "status": "failed",
                "updated_at": _utc_now_iso(),
                "chunk_count": 0,
                "fingerprint": fingerprint,
                "error": result.get("error") or "index_failed",
            },
        )
        return

    indexed = int(result.get("indexed") or 0)
    if indexed <= 0:
        _save_status_record(
            entity_type,
            entity_id,
            {
                "status": "empty",
                "updated_at": _utc_now_iso(),
                "chunk_count": 0,
                "fingerprint": fingerprint,
                "error": None,
            },
        )
        return

    _save_status_record(
        entity_type,
        entity_id,
        {
            "status": "indexed",
            "updated_at": _utc_now_iso(),
            "chunk_count": indexed,
            "fingerprint": fingerprint,
            "error": None,
            "last_index_duration_seconds": duration_seconds,
            "queued_at": previous.get("queued_at"),
        },
    )


def compute_page_fingerprint(page: Page) -> str:
    return content_hash(build_page_indexable_text(page))


def _is_pending_stale(record: dict[str, Any]) -> bool:
    queued_at = _parse_iso_datetime(record.get("queued_at")) or _parse_iso_datetime(record.get("updated_at"))
    if not queued_at:
        return True
    return (datetime.now(timezone.utc) - queued_at).total_seconds() >= PENDING_STALE_SECONDS


def resolve_page_index_status(page: Page) -> dict[str, Any]:
    """Public status for UI: whether page content is in the assistant knowledge base."""
    from operis.assistant.indexing_scheduler import ensure_page_index_queued

    entity_type = SearchEmbedding.ENTITY_PAGE
    entity_id = str(page.id)

    if not is_rag_enabled():
        return _public_status_payload(
            {
                "status": "disabled",
                "chunk_count": 0,
                "updated_at": None,
                "error": None,
            }
        )

    indexable_text = build_page_indexable_text(page)
    if not indexable_text.strip():
        return _public_status_payload(
            {
                "status": "not_indexed",
                "chunk_count": 0,
                "updated_at": None,
                "error": None,
            },
            entity_type=entity_type,
            entity_id=entity_id,
        )

    fingerprint = compute_page_fingerprint(page)
    record = _load_status_record(entity_type, entity_id) or {}
    chunk_count = SearchEmbedding.objects.filter(
        entity_type=entity_type,
        entity_id=entity_id,
    ).count()
    stored_fingerprint = record.get("fingerprint")
    record_status = record.get("status")
    debounce_active = is_index_debounce_active(entity_type, entity_id)

    # Already indexed for current content — prefer stable "indexed" unless worker is running.
    if chunk_count > 0 and stored_fingerprint == fingerprint and record_status != "processing":
        return _public_status_payload(
            {
                "status": "indexed",
                "updated_at": record.get("updated_at"),
                "chunk_count": chunk_count,
                "fingerprint": fingerprint,
                "error": None,
                "last_index_duration_seconds": record.get("last_index_duration_seconds"),
            },
            entity_type=entity_type,
            entity_id=entity_id,
        )

    if record_status == "processing":
        return _public_status_payload(
            {
                **record,
                "status": "processing",
                "chunk_count": max(int(record.get("chunk_count") or 0), chunk_count),
            },
            entity_type=entity_type,
            entity_id=entity_id,
        )

    if debounce_active:
        return _public_status_payload(
            {
                "status": "pending",
                "updated_at": record.get("updated_at") or _utc_now_iso(),
                "eta_at": record.get("eta_at"),
                "chunk_count": chunk_count,
                "fingerprint": stored_fingerprint,
                "error": None,
            },
            entity_type=entity_type,
            entity_id=entity_id,
        )

    # Task already scheduled — do not re-queue on every status poll (fixes countdown loop).
    if record_status == "pending" and not _is_pending_stale(record):
        return _public_status_payload(
            {
                **record,
                "status": "pending",
                "chunk_count": chunk_count,
                "fingerprint": stored_fingerprint,
                "error": None,
            },
            entity_type=entity_type,
            entity_id=entity_id,
        )

    if record_status == "pending" and _is_pending_stale(record) and chunk_count == 0:
        return _public_status_payload(
            {
                "status": "failed",
                "updated_at": record.get("updated_at"),
                "chunk_count": 0,
                "fingerprint": stored_fingerprint,
                "error": "index_timeout",
            },
            entity_type=entity_type,
            entity_id=entity_id,
        )

    if record_status == "failed":
        return _public_status_payload(record, entity_type=entity_type, entity_id=entity_id)

    if stored_fingerprint and stored_fingerprint != fingerprint:
        if ensure_page_index_queued(page):
            record = _load_status_record(entity_type, entity_id) or {}
            return _public_status_payload(
                {
                    "status": "pending",
                    "updated_at": record.get("updated_at") or _utc_now_iso(),
                    "eta_at": record.get("eta_at"),
                    "chunk_count": chunk_count,
                    "fingerprint": stored_fingerprint,
                    "error": None,
                },
                entity_type=entity_type,
                entity_id=entity_id,
            )
        return _public_status_payload(
            {
                "status": "stale",
                "updated_at": record.get("updated_at"),
                "chunk_count": chunk_count,
                "fingerprint": stored_fingerprint,
                "error": None,
            },
            entity_type=entity_type,
            entity_id=entity_id,
        )

    if chunk_count > 0:
        return _public_status_payload(
            {
                "status": "indexed",
                "updated_at": record.get("updated_at"),
                "chunk_count": chunk_count,
                "fingerprint": fingerprint,
                "error": None,
                "last_index_duration_seconds": record.get("last_index_duration_seconds"),
            },
            entity_type=entity_type,
            entity_id=entity_id,
        )

    if ensure_page_index_queued(page):
        record = _load_status_record(entity_type, entity_id) or {}
        return _public_status_payload(
            {
                "status": "pending",
                "updated_at": record.get("updated_at") or _utc_now_iso(),
                "eta_at": record.get("eta_at"),
                "chunk_count": chunk_count,
                "fingerprint": stored_fingerprint,
                "error": None,
            },
            entity_type=entity_type,
            entity_id=entity_id,
        )

    return _public_status_payload(
        {
            "status": "not_indexed",
            "updated_at": None,
            "chunk_count": 0,
            "fingerprint": None,
            "error": None,
        },
        entity_type=entity_type,
        entity_id=entity_id,
    )


def _compute_eta_fields(
    record: dict[str, Any],
    *,
    entity_type: str,
    entity_id: str,
) -> dict[str, Any]:
    status = record.get("status", "not_indexed")
    if status not in {"pending", "processing", "stale", "not_indexed"}:
        return {"estimated_seconds_remaining": None, "eta_at": None}

    now = datetime.now(timezone.utc)

    if status == "processing":
        eta = _parse_iso_datetime(record.get("eta_at"))
        if not eta:
            updated = _parse_iso_datetime(record.get("updated_at"))
            base = updated or now
            eta = base + timedelta(seconds=PROCESSING_ESTIMATE_SECONDS)
    else:
        debounce_ttl = _redis_ttl(_debounce_key(entity_type, entity_id))
        stored_eta = _parse_iso_datetime(record.get("eta_at"))
        if debounce_ttl is not None:
            eta = now + timedelta(seconds=debounce_ttl + PROCESSING_ESTIMATE_SECONDS)
        elif stored_eta:
            eta = stored_eta
        else:
            queued = _parse_iso_datetime(record.get("queued_at"))
            if queued:
                eta = queued + timedelta(seconds=DEBOUNCE_SECONDS + PROCESSING_ESTIMATE_SECONDS)
            else:
                eta = now + timedelta(seconds=DEBOUNCE_SECONDS + PROCESSING_ESTIMATE_SECONDS)

    remaining = max(0, int((eta - now).total_seconds()))
    return {
        "estimated_seconds_remaining": remaining,
        "eta_at": eta.isoformat(),
    }


def _public_status_payload(
    record: dict[str, Any],
    *,
    entity_type: str | None = None,
    entity_id: str | None = None,
) -> dict[str, Any]:
    status = record.get("status", "not_indexed")
    message_keys = {
        "disabled": "assistant_index.disabled",
        "empty": "assistant_index.empty",
        "not_indexed": "assistant_index.not_indexed",
        "pending": "assistant_index.pending",
        "processing": "assistant_index.processing",
        "indexed": "assistant_index.indexed",
        "failed": "assistant_index.failed",
        "stale": "assistant_index.stale",
    }
    payload = {
        "status": status,
        "chunk_count": int(record.get("chunk_count") or 0),
        "updated_at": record.get("updated_at"),
        "error": record.get("error"),
        "message_key": message_keys.get(status, "assistant_index.not_indexed"),
        "estimated_seconds_remaining": None,
        "eta_at": None,
        "last_index_duration_seconds": record.get("last_index_duration_seconds"),
    }
    if entity_type and entity_id:
        payload.update(_compute_eta_fields(record, entity_type=entity_type, entity_id=entity_id))
    return payload
