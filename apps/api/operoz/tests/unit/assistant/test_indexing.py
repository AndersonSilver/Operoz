from unittest.mock import patch

import pytest

from operoz.app.permissions import ROLE
from operoz.assistant.indexing import chunk_text, index_entity
from operoz.db.models import Issue, Project, ProjectMember, SearchEmbedding, State, WorkspaceMember


@pytest.mark.unit
class TestIndexingChunking:
    def test_chunk_text_single_short(self):
        assert chunk_text("hello") == ["hello"]

    def test_chunk_text_splits_long_text(self):
        text = "a" * 2500
        chunks = chunk_text(text, chunk_size=1000, overlap=100)
        assert len(chunks) >= 2
        assert all(len(c) <= 1000 for c in chunks)


@pytest.mark.unit
@pytest.mark.django_db
class TestIndexEntity:
    @patch("operoz.assistant.indexing.embed_texts")
    def test_index_issue_creates_embeddings(
        self, mock_embed, create_user, workspace, workspace_board, mute_assistant_auto_index
    ):
        mock_embed.side_effect = lambda texts: [[0.1] * 1536 for _ in texts]
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
            name="Guia de onboarding",
            description_html="<p>Passo a passo completo</p>",
            project=project,
            workspace=workspace,
            state=state,
            created_by=create_user,
        )
        issue.description_stripped = "Passo a passo completo"
        issue.save(update_fields=["description_stripped"])

        mock_embed.side_effect = lambda texts: [[0.1] * 1536 for _ in texts]

        result = index_entity(SearchEmbedding.ENTITY_ISSUE, str(issue.id))
        assert result["ok"] is True
        assert result["indexed"] == 1
        assert SearchEmbedding.objects.filter(entity_type="issue", entity_id=issue.id).count() == 1
