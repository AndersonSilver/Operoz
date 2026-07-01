from __future__ import annotations

from operoz.assistant.index_status import DEBOUNCE_SECONDS, mark_index_pending
from operoz.bgtasks.assistant_index_task import index_entity_task
from operoz.settings.redis import redis_instance


def schedule_entity_index(entity_type: str, entity_id: str, workspace_id: str) -> None:
    mark_index_pending(entity_type, entity_id)
    cache_key = f"assistant:index:debounce:{entity_type}:{entity_id}"
    try:
        redis = redis_instance()
        if redis.get(cache_key):
            return
        redis.setex(cache_key, DEBOUNCE_SECONDS, "1")
    except Exception:
        pass

    try:
        index_entity_task.apply_async(
            args=[entity_type, entity_id, workspace_id],
            countdown=DEBOUNCE_SECONDS,
            queue="assistant",
        )
    except Exception:
        from operoz.assistant.indexing import index_entity

        index_entity(entity_type, entity_id, workspace_id=workspace_id)


def ensure_page_index_queued(page) -> bool:
    """Enfileira indexação se a página tem conteúdo mas ainda não está na fila."""
    from operoz.assistant.index_status import is_index_debounce_active
    from operoz.assistant.page_content import build_page_indexable_text
    from operoz.db.models import SearchEmbedding

    entity_type = SearchEmbedding.ENTITY_PAGE
    entity_id = str(page.id)
    workspace_id = str(page.workspace_id)

    if not build_page_indexable_text(page).strip():
        return False

    if is_index_debounce_active(entity_type, entity_id):
        return False

    schedule_entity_index(entity_type, entity_id, workspace_id)
    return True
