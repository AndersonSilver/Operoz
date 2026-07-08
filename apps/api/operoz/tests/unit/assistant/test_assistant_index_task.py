from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from openai import RateLimitError

from operoz.assistant.embeddings import (
    EmbeddingRateLimitError,
    _maybe_raise_embedding_rate_limit,
    index_rate_limit_countdown,
)
from operoz.assistant.indexing import index_entity
from operoz.bgtasks.assistant_index_task import index_entity_task
from operoz.db.models import Issue, SearchEmbedding


def test_maybe_raise_embedding_rate_limit_from_openai_429():
    response = MagicMock()
    response.headers = {"retry-after": "45"}
    exc = RateLimitError("rate limited", response=response, body={"error": {"message": "429"}})
    with pytest.raises(EmbeddingRateLimitError) as raised:
        _maybe_raise_embedding_rate_limit(exc)
    assert raised.value.retry_after_seconds == 45


def test_maybe_raise_embedding_rate_limit_ignores_auth_errors():
    exc = Exception("401 unauthorized")
    _maybe_raise_embedding_rate_limit(exc)


def test_index_rate_limit_countdown_uses_retry_after():
    exc = EmbeddingRateLimitError(retry_after_seconds=120)
    assert index_rate_limit_countdown(exc, retries=0) == 120


def test_index_rate_limit_countdown_exponential_fallback():
    exc = EmbeddingRateLimitError()
    assert index_rate_limit_countdown(exc, retries=0) == 30
    assert index_rate_limit_countdown(exc, retries=2) == 120
    assert index_rate_limit_countdown(exc, retries=5) == 600


@pytest.mark.django_db
@patch("operoz.bgtasks.assistant_index_task.index_entity")
def test_index_entity_task_retries_on_rate_limit(mock_index_entity):
    mock_index_entity.side_effect = EmbeddingRateLimitError(retry_after_seconds=60)
    task = index_entity_task
    task.max_retries = 8

    with patch.object(task, "retry", side_effect=AssertionError("should retry")) as mock_retry:
        mock_retry.side_effect = lambda **kwargs: (_ for _ in ()).throw(type("Retry", (Exception,), {})())
        with pytest.raises(Exception):
            task.run("page", "00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000002")

    mock_retry.assert_called_once()
    assert mock_retry.call_args.kwargs["countdown"] == 60


@pytest.mark.django_db
@patch("operoz.bgtasks.assistant_index_task.index_entity")
@patch("operoz.bgtasks.assistant_index_task.persist_index_outcome")
def test_index_entity_task_persists_failure_after_max_retries(mock_persist, mock_index_entity):
    mock_index_entity.side_effect = EmbeddingRateLimitError(retry_after_seconds=10)
    task = index_entity_task

    with patch.object(task, "retry", side_effect=EmbeddingRateLimitError("exhausted")):
        with patch.object(task.request, "retries", 8):
            result = task.run("page", "00000000-0000-4000-8000-000000000001", None)

    assert result == {"ok": False, "error": "embedding_rate_limited", "indexed": 0}
    mock_persist.assert_called_once()


@pytest.mark.django_db
@patch("operoz.assistant.indexing.embed_texts")
def test_index_entity_preserves_embeddings_on_rate_limit(
    mock_embed,
    create_user,
    workspace,
    workspace_board,
    mute_assistant_auto_index,
):
    from operoz.app.permissions import ROLE
    from operoz.db.models import Project, ProjectMember, State, WorkspaceMember

    mock_embed.side_effect = EmbeddingRateLimitError(retry_after_seconds=30)
    WorkspaceMember.objects.get_or_create(
        workspace=workspace,
        member=create_user,
        defaults={"role": ROLE.ADMIN.value},
    )
    project = Project.objects.create(
        name="Docs",
        identifier="DOC",
        workspace=workspace,
        board=workspace_board,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=ROLE.ADMIN.value)
    state = State.objects.create(
        name="Todo",
        project=project,
        workspace=workspace,
        sequence=1,
        group="unstarted",
        created_by=create_user,
    )
    issue = Issue.objects.create(
        name="Issue indexável",
        description_html="<p>conteúdo</p>",
        project=project,
        workspace=workspace,
        state=state,
        created_by=create_user,
    )
    SearchEmbedding.objects.create(
        workspace=workspace,
        entity_type=SearchEmbedding.ENTITY_ISSUE,
        entity_id=issue.id,
        chunk_index=0,
        content="conteúdo antigo",
        embedding=[0.2] * 1536,
    )

    with pytest.raises(EmbeddingRateLimitError):
        index_entity(SearchEmbedding.ENTITY_ISSUE, str(issue.id))

    assert (
        SearchEmbedding.objects.filter(
            entity_type=SearchEmbedding.ENTITY_ISSUE,
            entity_id=issue.id,
        ).count()
        == 1
    )
