import logging

from celery import shared_task
from django.db import OperationalError

from operis.assistant.index_status import mark_index_processing
from operis.assistant.indexing import index_entity

logger = logging.getLogger(__name__)

ASSISTANT_QUEUE = "assistant"
TRANSIENT_ERRORS = (OperationalError, ConnectionError, TimeoutError)


@shared_task(
    bind=True,
    autoretry_for=TRANSIENT_ERRORS,
    retry_backoff=True,
    retry_backoff_max=300,
    max_retries=3,
    queue=ASSISTANT_QUEUE,
)
def index_entity_task(self, entity_type: str, entity_id: str, workspace_id: str | None = None) -> dict:
    mark_index_processing(entity_type, entity_id)
    result = index_entity(entity_type, entity_id, workspace_id=workspace_id)
    if workspace_id:
        from operis.assistant.rag_cache import invalidate_workspace_rag_cache

        invalidate_workspace_rag_cache(str(workspace_id))
    if not result.get("ok"):
        logger.warning(
            "assistant index failed entity_type=%s entity_id=%s error=%s",
            entity_type,
            entity_id,
            result.get("error"),
        )
    return result
