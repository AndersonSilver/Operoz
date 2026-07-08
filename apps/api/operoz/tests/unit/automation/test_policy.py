import uuid

import pytest

from operoz.automation.domain import DomainEvent
from operoz.automation.executor import execute_graph
from operoz.automation.policy import (
    can_enable_rule,
    get_or_create_board_policy,
    mark_dry_run_verified,
    summarize_graph_diff,
    validate_script_source,
)
from operoz.automation.rule_lifecycle import publish_rule_draft, save_rule_draft
from operoz.db.models import BoardAutomationPublishAudit, BoardAutomationRule


def _webhook_graph(url: str) -> dict:
    return {
        "nodes": [
            {
                "id": "t1",
                "data": {"kind": "trigger", "catalog_key": "issue.created", "config": {}},
            },
            {
                "id": "a1",
                "data": {"kind": "action", "catalog_key": "action.webhook", "config": {"url": url}},
            },
        ],
        "edges": [{"id": "e1", "source": "t1", "target": "a1"}],
    }


@pytest.mark.unit
@pytest.mark.django_db
class TestPolicyEngine:
    def test_webhook_allowlist_blocks_via_executor(self, workspace, workspace_board, create_user):
        board = workspace_board
        policy = get_or_create_board_policy(board)
        policy.webhook_allowlist_enabled = True
        policy.webhook_allowed_domains = ["allowed.example"]
        policy.save()

        event = DomainEvent.create(
            event_type="issue.created",
            workspace_id=str(workspace.id),
            board_id=str(board.id),
            actor_id=str(create_user.id),
            entity_type="issue",
            entity_id=str(uuid.uuid4()),
            project_id=str(uuid.uuid4()),
            payload={},
        )
        result = execute_graph(
            _webhook_graph("https://evil.example/hook"),
            event,
            rule_id="rule-1",
            automation_actor=create_user,
            dry_run=True,
        )
        policy_steps = [s for s in result["steps"] if s.get("kind") == "policy"]
        assert policy_steps
        assert policy_steps[0]["allowed"] is False

    def test_script_validation_blocks_child_process(self, workspace, workspace_board):
        policy = get_or_create_board_policy(workspace_board)
        outcome = validate_script_source(policy, "const cp = require('child_process');")
        assert outcome.allowed is False

    def test_dry_run_required_before_enable(self, workspace, workspace_board, create_user):
        rule = BoardAutomationRule.objects.create(
            workspace=workspace,
            board=workspace_board,
            name="Regra",
            graph=_webhook_graph("https://allowed.example/hook"),
            published_graph=_webhook_graph("https://allowed.example/hook"),
            published_version=1,
            enabled=False,
        )
        policy = get_or_create_board_policy(workspace_board)
        policy.require_dry_run_before_enable = True
        policy.save()

        assert can_enable_rule(rule, policy).allowed is False

        mark_dry_run_verified(
            rule,
            graph=rule.published_graph,
            result={"matched": True, "passed_filters": True, "dry_run": True},
        )
        rule.refresh_from_db()
        assert can_enable_rule(rule, policy).allowed is True

    def test_publish_creates_audit_and_resets_dry_run(self, workspace, workspace_board, create_user):
        graph_v1 = _webhook_graph("https://allowed.example/v1")
        graph_v2 = _webhook_graph("https://allowed.example/v2")
        rule = BoardAutomationRule.objects.create(
            workspace=workspace,
            board=workspace_board,
            name="Audit rule",
            graph=graph_v1,
            dry_run_verified_version=1,
        )
        rule = publish_rule_draft(rule, actor=create_user)
        rule.graph = graph_v2
        rule.save(update_fields=["graph", "updated_at"])
        rule = publish_rule_draft(rule, actor=create_user)

        audits = BoardAutomationPublishAudit.objects.filter(rule=rule)
        assert audits.count() == 2
        assert rule.dry_run_verified_version == 0
        diff = summarize_graph_diff(graph_v1, graph_v2)
        assert diff["changed_nodes"]

    def test_save_rule_draft_blocks_enable_without_dry_run(self, workspace, workspace_board, create_user):
        rule = BoardAutomationRule.objects.create(
            workspace=workspace,
            board=workspace_board,
            name="Enable gate",
            graph=_webhook_graph("https://allowed.example/hook"),
            published_graph=_webhook_graph("https://allowed.example/hook"),
            published_version=1,
            enabled=False,
        )
        policy = get_or_create_board_policy(workspace_board)
        policy.require_dry_run_before_enable = True
        policy.save()

        with pytest.raises(ValueError, match="dry_run_required"):
            save_rule_draft(rule, actor=create_user, enabled=True)
