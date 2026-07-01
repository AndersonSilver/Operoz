from __future__ import annotations

from datetime import date

import pytest

from operoz.utils.client_360_intelligence import (
    build_health_explainer,
    build_suggested_actions,
    build_weekly_briefing_facts,
    detect_scenarios,
    generate_qbr_draft_md,
    generate_weekly_briefing_md,
    validate_briefing_qa,
)


def _sample_client(**overrides):
    row = {
        "project_id": "p1",
        "name": "Acme",
        "health": "critical",
        "health_score": 45,
        "health_score_alert": True,
        "issues": {"overdue": 3, "pending": 5, "total": 8},
        "support": {"open_count": 2, "overdue_count": 1},
        "status_report": {"coverage": "missing"},
        "health_breakdown": [
            {"dimension": "overdue", "score": 20, "weight": 0.3, "detail": "3 cards atrasados"},
        ],
        "operational": {"support_sla": {"breached": True}, "blockers": {"count": 1}},
        "finops": {"variance_alert": True},
    }
    row.update(overrides)
    return row


@pytest.mark.unit
class TestClient360IntelligenceUtils:
    def test_weekly_briefing_mentions_critical(self):
        facts = build_weekly_briefing_facts(
            summary={"total_clients": 1},
            clients=[_sample_client()],
            period={"start": "2026-06-09", "end": "2026-06-15"},
        )
        md = generate_weekly_briefing_md(facts)
        assert "Acme" in md
        ok, issues = validate_briefing_qa(md, facts)
        assert ok is True
        assert issues == []

    def test_health_explainer_mentions_overdue(self):
        payload = build_health_explainer(_sample_client())
        assert "45" in payload["explanation_md"]
        assert "atrasados" in payload["explanation_md"].lower() or "overdue" in payload["explanation_md"].lower()

    def test_suggested_actions_report_missing(self):
        actions = build_suggested_actions(_sample_client(), workspace_slug="ws")
        keys = {a["key"] for a in actions}
        assert "publish_status_report" in keys

    def test_detect_scenarios(self):
        scenarios = detect_scenarios(_sample_client())
        assert "report_missing" in scenarios
        assert "health_critical" in scenarios

    def test_qbr_draft_sections(self):
        md = generate_qbr_draft_md(
            {
                "quarter_key": "2026-Q2",
                "client": _sample_client(),
                "narrative": {"wins_md": "Win A", "risks_md": "Risk B"},
                "finops": {"margin_pct": 18},
                "health_history": {"weeks": [{"period_start": "2026-05-26", "health_score": 50, "health": "warning"}]},
            }
        )
        assert "## Wins" in md
        assert "Win A" in md
        assert "Risk B" in md
        assert "18" in md
