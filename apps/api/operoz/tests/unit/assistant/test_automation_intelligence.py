from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from operoz.assistant.automation_intelligence import (
    explain_automation_run_steps,
    find_automation_run_for_explanation,
    propose_automation_rule_from_nl,
)
from operoz.db.models import BoardAutomationRule, BoardAutomationRun


@pytest.mark.unit
class TestAutomationIntelligence:
    @patch("operoz.assistant.automation_intelligence.llm_json_completion")
    def test_propose_validates_graph(self, mock_llm, workspace, workspace_board, create_user):
        mock_llm.return_value = {
            "ok": True,
            "name": "Regra teste",
            "description": "Desc",
            "graph": {
                "nodes": [
                    {
                        "id": "t1",
                        "data": {
                            "kind": "trigger",
                            "catalog_key": "issue.created",
                            "config": {},
                        },
                    },
                    {
                        "id": "a1",
                        "data": {
                            "kind": "action",
                            "catalog_key": "action.notify",
                            "config": {"user_ids": [], "message": "ok"},
                        },
                    },
                ],
                "edges": [{"id": "e1", "source": "t1", "target": "a1"}],
            },
        }
        result = propose_automation_rule_from_nl(
            board=workspace_board,
            description="Notificar quando card criado",
            actor=create_user,
            run_dry_run=False,
        )
        assert result.get("validation", {}).get("valid") is True
        assert result["name"] == "Regra teste"

    @patch("operoz.assistant.automation_intelligence.chat_completion")
    def test_explain_run(self, mock_chat, workspace, workspace_board):
        mock_chat.return_value = MagicMock(error=None, content="A regra falhou no webhook.")
        rule = BoardAutomationRule.objects.create(
            workspace=workspace,
            board=workspace_board,
            name="Regra",
            graph={"nodes": [], "edges": []},
        )
        run = BoardAutomationRun.objects.create(
            rule=rule,
            board=workspace_board,
            event_id="evt-1",
            event_type="issue.created",
            status=BoardAutomationRun.STATUS_FAILED,
            step_logs=[{"kind": "action", "ok": False}],
            dry_run=True,
        )
        result = explain_automation_run_steps(run=run)
        assert result["ok"] is True
        assert "webhook" in result["explanation"].lower()

    def test_find_run_by_rule_name(self, workspace, workspace_board):
        rule = BoardAutomationRule.objects.create(
            workspace=workspace,
            board=workspace_board,
            name="Alerta SLA",
            graph={"nodes": [], "edges": []},
        )
        run = BoardAutomationRun.objects.create(
            rule=rule,
            board=workspace_board,
            event_id="evt-3",
            event_type="issue.updated",
            status=BoardAutomationRun.STATUS_FAILED,
            step_logs=[],
            dry_run=False,
        )
        found = find_automation_run_for_explanation(
            board=workspace_board,
            rule_name="Alerta",
        )
        assert found is not None
        assert str(found.id) == str(run.id)
