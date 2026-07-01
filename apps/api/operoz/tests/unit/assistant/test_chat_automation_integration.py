from __future__ import annotations

import pytest

from operoz.app.permissions import ROLE
from operoz.assistant.intent import classify_chat_intent
from operoz.assistant.tools.registry import execute_tool
from operoz.assistant.types import AssistantActorContext
from operoz.automation.packs_lifecycle import install_automation_pack
from operoz.db.models import BoardAutomationRule, BoardAutomationRun, BoardPlaybook, WorkspaceMember
from operoz.playbooks.resolver import resolve_shared_board_playbooks


@pytest.mark.unit
class TestChatAutomationIntent:
    def test_classify_automation_intent(self):
        assert classify_chat_intent("Crie uma regra que envia email toda segunda") == "automation"
        assert classify_chat_intent("Por que o Status Report falhou?") == "automation"
        assert classify_chat_intent("Instale o pack Gestão Operacional") == "automation"

    def test_classify_metrics_without_automation_overlap(self):
        assert classify_chat_intent("Quantos cards abertos no projeto?") == "metrics"


@pytest.mark.unit
@pytest.mark.django_db
class TestChatAutomationTools:
    def test_list_automation_packs(self, create_user, workspace, workspace_board):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=create_user,
            defaults={"role": ROLE.ADMIN.value},
        )
        ctx = AssistantActorContext(user=create_user, workspace=workspace, board_slug=workspace_board.slug)
        result = execute_tool(ctx, "list_automation_packs", {"board_slug": workspace_board.slug})
        assert result.ok is True
        assert isinstance(result.data["packs"], list)

    def test_propose_pack_install(self, create_user, workspace, workspace_board):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=create_user,
            defaults={"role": ROLE.ADMIN.value},
        )
        ctx = AssistantActorContext(user=create_user, workspace=workspace, board_slug=workspace_board.slug)
        listed = execute_tool(ctx, "list_automation_packs", {"board_slug": workspace_board.slug})
        pack_name = listed.data["packs"][0]["name"]

        proposal = execute_tool(
            ctx,
            "propose_automation_pack_install",
            {"pack_name": pack_name, "board_slug": workspace_board.slug},
        )
        assert proposal.ok is True
        assert proposal.data["pack_install_proposal"]["pack_name"] == pack_name

        install_automation_pack(workspace_board, pack_name, actor=create_user, create_rules=False)
        again = execute_tool(
            ctx,
            "propose_automation_pack_install",
            {"pack_name": pack_name, "board_slug": workspace_board.slug},
        )
        assert again.ok is False
        assert again.error == "pack_already_installed"

    def test_explain_run_by_rule_name(self, create_user, workspace, workspace_board):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=create_user,
            defaults={"role": ROLE.ADMIN.value},
        )
        rule = BoardAutomationRule.objects.create(
            workspace=workspace,
            board=workspace_board,
            name="Status Report Semanal",
            graph={"nodes": [], "edges": []},
        )
        run = BoardAutomationRun.objects.create(
            rule=rule,
            board=workspace_board,
            event_id="evt-2",
            event_type="schedule.cron",
            status=BoardAutomationRun.STATUS_FAILED,
            step_logs=[{"kind": "action", "ok": False, "error": "smtp_timeout"}],
            dry_run=False,
        )

        ctx = AssistantActorContext(user=create_user, workspace=workspace, board_slug=workspace_board.slug)

        from unittest.mock import MagicMock, patch

        with patch("operoz.assistant.automation_intelligence.chat_completion") as mock_chat:
            mock_chat.return_value = MagicMock(error=None, content="Falhou no envio de email.")
            result = execute_tool(
                ctx,
                "explain_automation_run",
                {"rule_name": "Status Report", "board_slug": workspace_board.slug},
            )
        assert result.ok is True
        assert result.data["run_id"] == str(run.id)
        assert "email" in result.data["explanation"].lower()


@pytest.mark.unit
@pytest.mark.django_db
class TestSharedPlaybooks:
    def test_assistant_and_executor_share_playbooks(self, workspace, workspace_board):
        BoardPlaybook.objects.create(
            workspace=workspace,
            board=workspace_board,
            title="SLA Sustentação",
            slug="sla-sustentacao",
            published_markdown="# SLA 4h",
            published_version=1,
            is_active=True,
            metadata={"intents": ["automation"], "tags": ["sla"]},
        )
        shared = resolve_shared_board_playbooks(str(workspace_board.id))
        assert len(shared) == 1
        assert shared[0].title == "SLA Sustentação"
