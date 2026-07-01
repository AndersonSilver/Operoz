import pytest

from operoz.automation.domain import DomainEvent
from operoz.automation.dry_run_event import run_requires_issue


@pytest.mark.unit
class TestTestRunRequiresIssue:
    def test_schedule_cron_event_does_not_require_issue(self):
        event = DomainEvent(
            event_id="schedule:1:2026-06-10T09:00",
            event_type="schedule.cron",
            workspace_id="w1",
            board_id="b1",
            actor_id=None,
            entity_type="schedule",
            entity_id="r1",
            project_id=None,
            payload={},
            occurred_at=__import__("datetime").datetime.utcnow(),
        )
        graph = {"nodes": [], "edges": []}
        assert run_requires_issue(graph, event) is False

    def test_schedule_cron_trigger_does_not_require_issue(self):
        event = DomainEvent(
            event_id="e1",
            event_type="issue.created",
            workspace_id="w1",
            board_id="b1",
            actor_id=None,
            entity_type="issue",
            entity_id="i1",
            project_id="p1",
            payload={},
            occurred_at=__import__("datetime").datetime.utcnow(),
        )
        graph = {
            "nodes": [
                {
                    "id": "t1",
                    "data": {
                        "kind": "trigger",
                        "catalog_key": "schedule.cron",
                        "label": "Agendamento",
                        "config": {"preset": "daily", "time": "09:00", "timezone": "UTC"},
                    },
                }
            ],
            "edges": [],
        }
        assert run_requires_issue(graph, event) is False

    def test_issue_trigger_requires_issue(self):
        event = DomainEvent(
            event_id="e1",
            event_type="issue.created",
            workspace_id="w1",
            board_id="b1",
            actor_id=None,
            entity_type="issue",
            entity_id="i1",
            project_id="p1",
            payload={},
            occurred_at=__import__("datetime").datetime.utcnow(),
        )
        graph = {
            "nodes": [
                {
                    "id": "t1",
                    "data": {
                        "kind": "trigger",
                        "catalog_key": "issue.created",
                        "label": "Card criado",
                        "config": {},
                    },
                }
            ],
            "edges": [],
        }
        assert run_requires_issue(graph, event) is True
