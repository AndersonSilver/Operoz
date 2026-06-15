from __future__ import annotations

from unittest.mock import patch

import pytest

from operis.automation.domain import DomainEvent
from operis.automation.llm_decision import DEFAULT_CONFIDENCE_THRESHOLD, evaluate_llm_decision
from operis.automation.subagents import parallel_triage_classifiers


@pytest.mark.unit
class TestLlmDecision:
    def _event(self) -> DomainEvent:
        return DomainEvent.create(
            event_type="issue.created",
            workspace_id="ws-1",
            board_id="board-1",
            actor_id="u1",
            entity_type="issue",
            entity_id="i1",
            project_id="p1",
            payload={},
        )

    def test_dry_run_returns_first_branch(self):
        config = {
            "branches": [{"id": "urgent", "label": "Urgente"}],
            "human_branch_id": "human",
        }
        branch = evaluate_llm_decision(self._event(), config, {"dry_run": True}, dry_run=True)
        assert branch == "urgent"

    @patch("operis.automation.llm_decision.llm_json_completion")
    def test_low_confidence_routes_human(self, mock_llm):
        mock_llm.return_value = {"ok": True, "branch_id": "urgent", "confidence": 50}
        config = {
            "branches": [{"id": "urgent", "label": "Urgente"}],
            "human_branch_id": "human",
            "confidence_threshold": DEFAULT_CONFIDENCE_THRESHOLD,
        }
        branch = evaluate_llm_decision(self._event(), config, {})
        assert branch == "human"

    @patch("operis.automation.llm_decision.llm_json_completion")
    def test_high_confidence_routes_branch(self, mock_llm):
        mock_llm.return_value = {"ok": True, "branch_id": "urgent", "confidence": 95}
        config = {
            "branches": [{"id": "urgent", "label": "Urgente"}],
            "human_branch_id": "human",
            "confidence_threshold": 80,
        }
        branch = evaluate_llm_decision(self._event(), config, {})
        assert branch == "urgent"


@pytest.mark.unit
class TestParallelTriage:
    @patch("operis.automation.subagents.llm_json_completion")
    def test_merge_votes(self, mock_llm):
        mock_llm.side_effect = [
            {"ok": True, "label": "critical", "confidence": 90},
            {"ok": True, "label": "critical", "confidence": 85},
            {"ok": True, "label": "normal", "confidence": 70},
        ]
        result = parallel_triage_classifiers(
            prompt="Classifique severidade",
            classifiers=[
                {"label": "critical"},
                {"label": "critical"},
                {"label": "normal"},
            ],
            context={"issue": {"name": "Bug"}},
        )
        assert result["ok"] is True
        assert result["label"] == "critical"
        assert result["votes"]["critical"] == 2
