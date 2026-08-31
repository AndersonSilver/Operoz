import logging

from celery import shared_task
from celery.exceptions import MaxRetriesExceededError
from django.db import OperationalError

from operoz.rag.embeddings import (
    EmbeddingRateLimitError,
    index_rate_limit_countdown,
    index_rate_limit_max_retries,
)
from operoz.rag.index_status import mark_index_pending, mark_index_processing, persist_index_outcome
from operoz.rag.indexing import index_entity

logger = logging.getLogger(__name__)

# Valor da fila mantido: workers assinam "assistant" e renomear exigiria
# reiniciar tudo em sincronia, perdendo o que estivesse em voo.
RAG_QUEUE = "assistant"

# Nome da task fixado no caminho antigo do modulo. Sem isto, o rename
# assistant_index_task -> rag_index_task mudaria o nome derivado e as mensagens
# enfileiradas antes do deploy virariam "unregistered task". Pode sair depois
# que a fila drenar.
INDEX_TASK_NAME = "operoz.bgtasks.assistant_index_task.index_entity_task"
TRANSIENT_ERRORS = (OperationalError, ConnectionError, TimeoutError)


def _persist_rate_limit_failure(entity_type: str, entity_id: str) -> dict:
    result = {"ok": False, "error": "embedding_rate_limited", "indexed": 0}
    persist_index_outcome(entity_type, entity_id, result)
    return result


@shared_task(
    bind=True,
    autoretry_for=TRANSIENT_ERRORS,
    retry_backoff=True,
    retry_backoff_max=300,
    max_retries=3,
    queue=RAG_QUEUE,
    name=INDEX_TASK_NAME,
)
def index_entity_task(self, entity_type: str, entity_id: str, workspace_id: str | None = None) -> dict:
    mark_index_processing(entity_type, entity_id)
    try:
        result = index_entity(entity_type, entity_id, workspace_id=workspace_id)
    except EmbeddingRateLimitError as exc:
        max_retries = index_rate_limit_max_retries()
        if self.request.retries >= max_retries:
            logger.warning(
                "assistant index rate limit exhausted entity_type=%s entity_id=%s retries=%s",
                entity_type,
                entity_id,
                self.request.retries,
            )
            return _persist_rate_limit_failure(entity_type, entity_id)

        countdown = index_rate_limit_countdown(exc, self.request.retries)
        mark_index_pending(entity_type, entity_id)
        logger.warning(
            "assistant index rate limited entity_type=%s entity_id=%s retry=%s countdown=%ss",
            entity_type,
            entity_id,
            self.request.retries + 1,
            countdown,
        )
        try:
            raise self.retry(exc=exc, countdown=countdown, max_retries=max_retries)
        except MaxRetriesExceededError:
            return _persist_rate_limit_failure(entity_type, entity_id)

    if workspace_id:
        from operoz.rag.rag_cache import invalidate_workspace_rag_cache

        invalidate_workspace_rag_cache(str(workspace_id))
    if not result.get("ok"):
        logger.warning(
            "assistant index failed entity_type=%s entity_id=%s error=%s",
            entity_type,
            entity_id,
            result.get("error"),
        )
    return result
