from __future__ import annotations

from unittest.mock import patch

import pytest

from operoz.app.permissions import ROLE
from operoz.assistant.retrieval import hybrid_retrieve
from operoz.assistant.security.sanitize import sanitize_assistant_content
from operoz.assistant.tools.registry import execute_tool
from operoz.assistant.types import AssistantActorContext
from operoz.assistant.usage import get_usage_summary, record_assistant_usage
from operoz.db.models import (
    AssistantActionAudit,
    Board,
    Issue,
    Project,
    ProjectMember,
    SearchEmbedding,
    State,
    Workspace,
    WorkspaceMember,
)
from operoz.assistant.indexing import index_entity


@pytest.mark.unit
class TestSanitizeAssistantContent:
    def test_strips_script_tags(self):
        raw = 'Olá <script>alert("xss")</script> mundo'
        clean = sanitize_assistant_content(raw)
        assert "<script>" not in clean
        assert "Olá" in clean


@pytest.mark.unit
@pytest.mark.django_db
class TestCrossWorkspaceIsolation:
    def test_issue_from_other_workspace_not_accessible(self, create_user):
        ws_a = Workspace.objects.create(name="WS A", slug="ws-a", owner=create_user)
        ws_b = Workspace.objects.create(name="WS B", slug="ws-b", owner=create_user)
        WorkspaceMember.objects.create(workspace=ws_a, member=create_user, role=ROLE.ADMIN.value)
        WorkspaceMember.objects.create(workspace=ws_b, member=create_user, role=ROLE.ADMIN.value)

        board_b = Board.objects.create(name="Board B", slug="board-b", workspace=ws_b)
        project_b = Project.objects.create(name="Secret", identifier="SEC", workspace=ws_b, board=board_b)
        ProjectMember.objects.create(project=project_b, member=create_user, role=ROLE.ADMIN.value)
        state_b = State.objects.create(
            name="Todo",
            project=project_b,
            workspace=ws_b,
            sequence=1,
            group="unstarted",
            created_by=create_user,
        )
        issue_b = Issue.objects.create(
            name="Card secreto B",
            project=project_b,
            workspace=ws_b,
            state=state_b,
            created_by=create_user,
        )

        ctx_a = AssistantActorContext(user=create_user, workspace=ws_a)
        result = execute_tool(ctx_a, "get_issue", {"issue_id": str(issue_b.id)})
        assert result.ok is False

    @patch("operoz.assistant.retrieval.embed_texts", return_value=[[0.0] * 1536])
    def test_rag_does_not_leak_other_workspace_embeddings(self, _mock_embed, create_user):
        ws_a = Workspace.objects.create(name="WS A2", slug="ws-a2", owner=create_user)
        ws_b = Workspace.objects.create(name="WS B2", slug="ws-b2", owner=create_user)
        WorkspaceMember.objects.create(workspace=ws_a, member=create_user, role=ROLE.ADMIN.value)
        WorkspaceMember.objects.create(workspace=ws_b, member=create_user, role=ROLE.ADMIN.value)

        board_b = Board.objects.create(name="Board B2", slug="board-b2", workspace=ws_b)
        project_b = Project.objects.create(name="Secret2", identifier="SC2", workspace=ws_b, board=board_b)
        ProjectMember.objects.create(project=project_b, member=create_user, role=ROLE.ADMIN.value)
        state_b = State.objects.create(
            name="Todo",
            project=project_b,
            workspace=ws_b,
            sequence=1,
            group="unstarted",
            created_by=create_user,
        )
        issue_b = Issue.objects.create(
            name="Embedding isolado",
            description_stripped="conteúdo workspace B",
            project=project_b,
            workspace=ws_b,
            state=state_b,
            created_by=create_user,
        )

        with patch("operoz.assistant.indexing.embed_texts", return_value=[[0.5] * 1536]):
            index_entity(SearchEmbedding.ENTITY_ISSUE, str(issue_b.id))

        ctx_a = AssistantActorContext(user=create_user, workspace=ws_a)
        hits = hybrid_retrieve(ctx_a, "conteúdo workspace B")
        assert all(hit.entity_id != str(issue_b.id) for hit in hits)


@pytest.mark.unit
@pytest.mark.django_db
class TestConfirmedActions:
    def test_propose_issue_comment(self, create_user, workspace, workspace_board):
        from operoz.assistant.tools import handlers as _handlers  # noqa: F401

        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=create_user,
            defaults={"role": ROLE.ADMIN.value},
        )
        project = Project.objects.create(
            name="P1",
            identifier="P1",
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
            name="Card",
            project=project,
            workspace=workspace,
            state=state,
            created_by=create_user,
        )

        ctx = AssistantActorContext(user=create_user, workspace=workspace)
        result = execute_tool(
            ctx,
            "propose_issue_comment",
            {"issue_id": str(issue.id), "comment": "Atualização via assistente"},
        )
        assert result.ok is True
        assert result.data["action_proposal"]["action_type"] == "issue_comment"


@pytest.mark.unit
@pytest.mark.django_db
class TestAssistantAuditAndUsage:
    def test_usage_budget_alert(self, workspace):
        for _ in range(3):
            record_assistant_usage(workspace, prompt_tokens=60_000, completion_tokens=10_000)
        summary = get_usage_summary(workspace)
        assert summary["today_tokens"] > 0
        assert summary["budget_alert"] is True

    def test_audit_log_on_proposal(self, create_user, workspace, workspace_board):
        from operoz.assistant.security.audit import log_assistant_action
        from operoz.db.models import AssistantSession

        session = AssistantSession.objects.create(workspace=workspace, user=create_user)
        log_assistant_action(
            workspace=workspace,
            user=create_user,
            session=session,
            tool_name="propose_issue_comment",
            action_type="proposal",
            status=AssistantActionAudit.STATUS_PROPOSED,
            payload={"issue_id": "x"},
        )
        assert AssistantActionAudit.objects.filter(workspace=workspace).count() == 1
