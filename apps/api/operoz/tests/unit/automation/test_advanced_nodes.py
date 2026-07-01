from __future__ import annotations

import time
import uuid
from unittest.mock import patch

import pytest

from operoz.automation.domain import DomainEvent
from operoz.automation.executor import execute_graph


def _issue_event(workspace_id: str, board_id: str) -> DomainEvent:
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


def _fan_out_graph(*, slow: bool = False) -> dict:
    delay = 0.15 if slow else 0
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
                "id": "p1",
                "data": {
                    "kind": "parallel",
                    "catalog_key": "parallel.fan_out",
                    "config": {"join_policy": "all", "branches": [{"id": "b1", "label": "A"}, {"id": "b2", "label": "B"}]},
                },
            },
            {
                "id": "a1",
                "data": {"kind": "action", "catalog_key": "action.webhook", "config": {"url": "https://a.example/hook", "_delay": delay}},
            },
            {
                "id": "a2",
                "data": {"kind": "action", "catalog_key": "action.webhook", "config": {"url": "https://b.example/hook", "_delay": delay}},
            },
        ],
        "edges": [
            {"id": "e0", "source": "t1", "target": "p1"},
            {"id": "e1", "source": "p1", "target": "a1", "sourceHandle": "b1"},
            {"id": "e2", "source": "p1", "target": "a2", "sourceHandle": "b2"},
        ],
    }


def _retry_graph(fail_times: int = 2) -> dict:
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
                "id": "r1",
                "data": {
                    "kind": "action",
                    "catalog_key": "action.retry_until",
                    "config": {"max_iterations": 4, "backoff_seconds": 0},
                },
            },
            {
                "id": "a1",
                "data": {"kind": "action", "catalog_key": "action.webhook", "config": {"url": "https://retry.example/hook"}},
            },
        ],
        "edges": [
            {"id": "e0", "source": "t1", "target": "r1"},
            {"id": "e1", "source": "r1", "target": "a1"},
        ],
    }


@pytest.mark.django_db
class TestAdvancedAutomationNodes:
    def test_fan_out_executes_all_branches(self, workspace, workspace_board):
        event = _issue_event(str(workspace.id), str(workspace_board.id))
        result = execute_graph(_fan_out_graph(), event, rule_id="rule-1", automation_actor=None, dry_run=True)
        parallel_steps = [s for s in result["steps"] if s.get("kind") == "parallel"]
        action_steps = [s for s in result["steps"] if s.get("kind") == "action"]
        assert parallel_steps
        assert parallel_steps[0]["ok"] is True
        assert len(action_steps) == 2

    @patch("requests.post")
    def test_fan_out_parallel_faster_than_sequential(self, mock_post, workspace, workspace_board):
        mock_post.return_value.status_code = 200

        def slow_post(*_args, **_kwargs):
            time.sleep(0.12)
            response = mock_post.return_value
            return response

        mock_post.side_effect = slow_post

        event = _issue_event(str(workspace.id), str(workspace_board.id))
        started = time.perf_counter()
        execute_graph(_fan_out_graph(slow=True), event, rule_id="rule-1", automation_actor=None, dry_run=False)
        elapsed = time.perf_counter() - started
        assert elapsed < 0.22

    def test_retry_until_records_iterations(self, workspace, workspace_board):
        from operoz.automation.catalog import ensure_catalog

        event = _issue_event(str(workspace.id), str(workspace_board.id))
        calls = {"count": 0}
        catalog = ensure_catalog()
        webhook_entry = catalog.get("action.webhook")
        assert webhook_entry is not None
        original_handler = webhook_entry.handler

        def flaky_webhook(event, config, context, *, dry_run):
            calls["count"] += 1
            if calls["count"] < 3:
                return {"ok": False, "message": "falha simulada"}
            return {"ok": True, "message": "ok"}

        webhook_entry.handler = flaky_webhook
        try:
            result = execute_graph(_retry_graph(), event, rule_id="rule-1", automation_actor=None, dry_run=False)
        finally:
            webhook_entry.handler = original_handler

        retry_steps = [s for s in result["steps"] if s.get("key") == "action.retry_until"]
        assert len(retry_steps) == 3
        assert retry_steps[-1]["ok"] is True
        assert any(s.get("retry_iteration") == 1 for s in result["steps"])
