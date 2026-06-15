from __future__ import annotations

import statistics
import time
import uuid
from unittest.mock import patch

import pytest
from operis.automation.domain import DomainEvent
from operis.automation.governance import check_dispatch_allowed
from operis.automation.outbox import schedule_automation_jobs
from operis.db.models import BoardAutomationRule


@pytest.mark.unit
class TestAutomationDispatchBenchmark:
    @pytest.mark.parametrize("rule_count", [300])
    def test_benchmark_300_rules_same_minute(self, workspace, workspace_board, rule_count):
        """Simula 300 dispatches no mesmo minuto; mede P95 do path de outbox (mock Celery)."""
        graph = {"nodes": [], "edges": []}
        rules = [
            BoardAutomationRule.objects.create(
                workspace=workspace,
                board=workspace_board,
                name=f"bench-rule-{i}",
                graph=graph,
                published_graph=graph,
                published_version=1,
                enabled=True,
            )
            for i in range(rule_count)
        ]

        event = DomainEvent.create(
            event_type="issue.created",
            workspace_id=str(workspace.id),
            board_id=str(workspace_board.id),
            actor_id="bench",
            entity_type="issue",
            entity_id=str(uuid.uuid4()),
            project_id=str(uuid.uuid4()),
            payload={},
        )

        latencies_ms: list[float] = []
        with patch("operis.bgtasks.automation_task.enqueue_automation_outbox.delay"):
            for rule in rules:
                allowed, _reason = check_dispatch_allowed(rule, event)
                assert allowed is True
                start = time.perf_counter()
                schedule_automation_jobs(event, [rule])
                latencies_ms.append((time.perf_counter() - start) * 1000)

        p95 = statistics.quantiles(latencies_ms, n=20)[18] if len(latencies_ms) >= 20 else max(latencies_ms)
        assert p95 < 50, f"P95 dispatch {p95:.2f}ms excede 50ms (n={rule_count})"
