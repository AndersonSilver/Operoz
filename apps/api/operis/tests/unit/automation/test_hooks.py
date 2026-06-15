import uuid
from unittest.mock import patch

import pytest

from operis.automation.domain import DomainEvent
from operis.automation.executor import execute_graph
from operis.automation.hooks_registry import HookExecutionContext, execute_hook_handler
from operis.db.models import BoardAutomationHook


def _webhook_graph(url: str = "https://evil.example/hook") -> dict:
    return {
        "nodes": [
            {
                "id": "t1",
                "data": {
                    "kind": "trigger",
                    "catalog_key": "issue.created",
                    "config": {"event_type": "issue.created"},
                },
            },
            {
                "id": "a1",
                "data": {
                    "kind": "action",
                    "catalog_key": "action.webhook",
                    "config": {"url": url},
                },
            },
        ],
        "edges": [{"id": "e1", "source": "t1", "target": "a1"}],
    }


def _domain_event(workspace_id: str, board_id: str) -> DomainEvent:
    return DomainEvent.create(
        event_type="issue.created",
        workspace_id=workspace_id,
        board_id=board_id,
        actor_id="user-1",
        entity_type="issue",
        entity_id=str(uuid.uuid4()),
        project_id=str(uuid.uuid4()),
        payload={},
    )


@pytest.mark.unit
@pytest.mark.django_db
class TestAutomationHooks:
    def test_pre_action_blocks_webhook(self, workspace, workspace_board):
        board = workspace_board
        BoardAutomationHook.objects.create(
            workspace=workspace,
            board=board,
            name="Bloquear webhook",
            event=BoardAutomationHook.EVENT_PRE_ACTION,
            matcher="action.webhook",
            handler_type=BoardAutomationHook.HANDLER_BLOCK_CATALOG,
            config={"catalog_keys": ["action.webhook"], "message": "Webhook bloqueado"},
        )

        result = execute_graph(
            _webhook_graph(),
            _domain_event(str(workspace.id), str(board.id)),
            rule_id="rule-1",
            automation_actor=None,
            dry_run=True,
        )

        hook_steps = [s for s in result["steps"] if s.get("kind") == "hook"]
        action_steps = [s for s in result["steps"] if s.get("kind") == "action"]
        assert hook_steps
        assert hook_steps[0]["allowed"] is False
        assert action_steps
        assert action_steps[0].get("blocked_by_hook") is True

    @patch("operis.automation.hooks_registry.record_metric")
    def test_post_action_records_metric(self, mock_metric, workspace, workspace_board):
        board = workspace_board
        BoardAutomationHook.objects.create(
            workspace=workspace,
            board=board,
            name="Métrica pós-ação",
            event=BoardAutomationHook.EVENT_POST_ACTION,
            matcher="action.add_comment",
            handler_type=BoardAutomationHook.HANDLER_RECORD_METRIC,
            config={"metric_name": "automation_post_action_test"},
        )

        from operis.automation.hooks_registry import run_board_hooks

        ctx = HookExecutionContext(
            event=_domain_event(str(workspace.id), str(board.id)),
            context={},
            rule_id="rule-1",
            board_id=str(board.id),
            dry_run=False,
            catalog_key="action.add_comment",
            action_result={"ok": True},
        )
        steps, _ = run_board_hooks(BoardAutomationHook.EVENT_POST_ACTION, ctx, catalog_key="action.add_comment")

        assert steps
        mock_metric.assert_called()
        assert mock_metric.call_args.args[0] == "automation_post_action_test"

    def test_webhook_allowlist_blocks_unknown_domain(self, workspace, workspace_board):
        board = workspace_board
        hook = BoardAutomationHook(
            handler_type=BoardAutomationHook.HANDLER_WEBHOOK_ALLOWLIST,
            config={"domains": ["allowed.example"]},
        )
        ctx = HookExecutionContext(
            event=_domain_event(str(workspace.id), str(board.id)),
            context={},
            rule_id="rule-1",
            board_id=str(board.id),
            dry_run=True,
            catalog_key="action.webhook",
            action_config={"url": "https://evil.example/hook"},
        )
        outcome = execute_hook_handler(hook, ctx)
        assert outcome.allowed is False

        ctx_allowed = HookExecutionContext(
            event=_domain_event(str(workspace.id), str(board.id)),
            context={},
            rule_id="rule-1",
            board_id=str(board.id),
            dry_run=True,
            catalog_key="action.webhook",
            action_config={"url": "https://api.allowed.example/hook"},
        )
        assert execute_hook_handler(hook, ctx_allowed).allowed is True
