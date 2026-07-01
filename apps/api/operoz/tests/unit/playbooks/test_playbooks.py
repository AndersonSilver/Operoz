from __future__ import annotations

from unittest.mock import patch

import pytest

from datetime import datetime

from operoz.assistant.indexing import build_playbook_chunks, split_markdown_sections
from operoz.automation.domain import DomainEvent
from operoz.automation.executor import build_execution_context
from operoz.assistant.prompts import resolve_playbook_snippet
from operoz.assistant.types import AssistantActorContext
from operoz.db.models import BoardPlaybook, SearchEmbedding
from operoz.playbooks.lifecycle import publish_playbook
from operoz.playbooks.resolver import (
    playbook_matches_intent,
    resolve_playbooks_for_automation,
    resolve_playbooks_for_intent,
)


@pytest.mark.django_db
class TestBoardPlaybookResolver:
    def test_intent_filter(self):
        assert playbook_matches_intent({}, "documentation") is True
        assert playbook_matches_intent({"intents": ["documentation"]}, "documentation") is True
        assert playbook_matches_intent({"intents": ["documentation"]}, "metrics") is False

    def test_resolve_for_documentation_intent(self, workspace, workspace_board):
        BoardPlaybook.objects.create(
            workspace=workspace,
            board=workspace_board,
            title="SLA",
            slug="sla",
            draft_markdown="## SLA\nRegra",
            published_markdown="## SLA\nRegra",
            published_version=1,
            metadata={"intents": ["documentation"]},
        )
        BoardPlaybook.objects.create(
            workspace=workspace,
            board=workspace_board,
            title="Métricas",
            slug="metricas",
            draft_markdown="## KPI",
            published_markdown="## KPI",
            published_version=1,
            metadata={"intents": ["metrics"]},
        )

        docs = resolve_playbooks_for_intent(str(workspace_board.id), "documentation")
        assert len(docs) == 1
        assert docs[0].slug == "sla"

    def test_resolve_for_automation(self, workspace, workspace_board):
        BoardPlaybook.objects.create(
            workspace=workspace,
            board=workspace_board,
            title="Glossário",
            slug="glossario",
            published_markdown="Termos",
            published_version=1,
            metadata={"tags": ["glossary"]},
        )
        matched = resolve_playbooks_for_automation(str(workspace_board.id))
        assert len(matched) == 1


@pytest.mark.django_db
class TestBoardPlaybookLifecycle:
    def test_publish_increments_version_and_indexes(self, workspace, workspace_board):
        playbook = BoardPlaybook.objects.create(
            workspace=workspace,
            board=workspace_board,
            title="Operação",
            slug="operacao",
            draft_markdown="## SLA\n24h",
        )
        with patch("operoz.playbooks.lifecycle.index_playbook") as mock_index:
            publish_playbook(playbook)
            mock_index.assert_called_once_with(str(playbook.id))

        playbook.refresh_from_db()
        assert playbook.published_version == 1
        assert "## SLA" in playbook.published_markdown

    def test_split_markdown_sections(self):
        sections = split_markdown_sections("## SLA\nRegra\n\n## Glossário\nTermo")
        assert len(sections) == 2
        assert sections[0][0] == "SLA"
        assert "Regra" in sections[0][1]

    def test_build_playbook_chunks_metadata(self, workspace, workspace_board):
        playbook = BoardPlaybook.objects.create(
            workspace=workspace,
            board=workspace_board,
            title="Guia",
            slug="guia",
            published_markdown="## SLA\nTexto longo de sustentação",
            published_version=1,
        )
        chunks = build_playbook_chunks(playbook)
        assert chunks
        assert chunks[0].metadata["section"] == "SLA"
        assert chunks[0].metadata["playbook_id"] == str(playbook.id)


@pytest.mark.django_db
class TestBoardPlaybookInjection:
    def test_execution_context_includes_playbook(self, workspace, workspace_board):
        BoardPlaybook.objects.create(
            workspace=workspace,
            board=workspace_board,
            title="SLA Board",
            slug="sla-board",
            published_markdown="## SLA\n48 horas",
            published_version=1,
            metadata={"tags": ["sla"]},
        )
        event = DomainEvent(
            event_id="evt-1",
            event_type="issue.created",
            workspace_id=str(workspace.id),
            board_id=str(workspace_board.id),
            actor_id=None,
            entity_type="issue",
            entity_id="00000000-0000-0000-0000-000000000001",
            project_id=None,
            payload={},
            occurred_at=datetime.utcnow(),
        )
        ctx = build_execution_context(event, rule_id="rule-1", automation_actor=None)
        assert "48 horas" in ctx["playbook_snippets"]

    def test_assistant_snippet_by_intent(self, workspace, workspace_board, create_user):
        BoardPlaybook.objects.create(
            workspace=workspace,
            board=workspace_board,
            title="Docs",
            slug="docs",
            published_markdown="## Guia\nConteúdo",
            published_version=1,
            metadata={"intents": ["documentation"]},
        )
        actor_ctx = AssistantActorContext(
            workspace=workspace,
            user=create_user,
            board_slug=workspace_board.slug,
            project_id=None,
        )
        snippet = resolve_playbook_snippet(actor_ctx, intent="documentation")
        assert "Guia" in snippet
        assert resolve_playbook_snippet(actor_ctx, intent="metrics") == ""
