import pytest

from operoz.utils.client_360 import DEFAULT_HEALTH_SCORE_THRESHOLDS, DEFAULT_HEALTH_SCORE_WEIGHTS, HealthScoreWeights
from operoz.utils.client_360_health_simulation import (
    recompute_health_from_breakdown,
    simulate_board_health_scores,
    simulate_client_health_row,
)


@pytest.mark.unit
class TestRecomputeHealthFromBreakdown:
    def test_higher_overdue_weight_lowers_score(self):
        breakdown = [
            {"dimension": "report", "score": 100, "weight": 60, "detail": ""},
            {"dimension": "overdue", "score": 40, "weight": 25, "detail": ""},
            {"dimension": "support", "score": 100, "weight": 15, "detail": ""},
        ]
        baseline_weights = HealthScoreWeights(report=60, overdue=25, support=15)
        heavier_overdue = HealthScoreWeights(report=35, overdue=40, support=25)

        baseline_score, _ = recompute_health_from_breakdown(
            breakdown,
            baseline_weights,
            DEFAULT_HEALTH_SCORE_THRESHOLDS,
            report_coverage="complete",
            modules_total=2,
            overdue_issues=3,
            support_overdue=0,
        )
        simulated_score, _ = recompute_health_from_breakdown(
            breakdown,
            heavier_overdue,
            DEFAULT_HEALTH_SCORE_THRESHOLDS,
            report_coverage="complete",
            modules_total=2,
            overdue_issues=3,
            support_overdue=0,
        )
        assert simulated_score < baseline_score

    def test_caps_still_apply(self):
        breakdown = [
            {"dimension": "report", "score": 100, "weight": 60, "detail": ""},
            {"dimension": "overdue", "score": 100, "weight": 25, "detail": ""},
            {"dimension": "support", "score": 100, "weight": 15, "detail": ""},
        ]
        score, health = recompute_health_from_breakdown(
            breakdown,
            DEFAULT_HEALTH_SCORE_WEIGHTS,
            DEFAULT_HEALTH_SCORE_THRESHOLDS,
            report_coverage="missing",
            modules_total=4,
            overdue_issues=0,
            support_overdue=0,
        )
        assert score <= 40
        assert health in {"warning", "critical"}


@pytest.mark.unit
class TestSimulateBoardHealthScores:
    def test_returns_sorted_deltas(self):
        clients = [
            {
                "project_id": "a",
                "name": "Alpha",
                "identifier": "A",
                "health_score": 80,
                "health": "ok",
                "health_breakdown": [
                    {"dimension": "report", "score": 100, "weight": 60, "detail": ""},
                    {"dimension": "overdue", "score": 40, "weight": 25, "detail": ""},
                    {"dimension": "support", "score": 100, "weight": 15, "detail": ""},
                ],
                "status_report": {"coverage": "complete", "modules_total": 2},
                "issues": {"overdue": 3},
                "support": {"overdue_count": 0},
            },
            {
                "project_id": "b",
                "name": "Beta",
                "identifier": "B",
                "health_score": 90,
                "health": "ok",
                "health_breakdown": [
                    {"dimension": "report", "score": 100, "weight": 60, "detail": ""},
                    {"dimension": "overdue", "score": 100, "weight": 25, "detail": ""},
                    {"dimension": "support", "score": 100, "weight": 15, "detail": ""},
                ],
                "status_report": {"coverage": "complete", "modules_total": 2},
                "issues": {"overdue": 0},
                "support": {"overdue_count": 0},
            },
        ]
        rows = simulate_board_health_scores(
            clients,
            weights=HealthScoreWeights(report=35, overdue=40, support=25),
        )
        assert len(rows) == 2
        assert rows[0]["project_id"] == "b"
        assert rows[0]["delta"] == 10
        assert rows[1]["project_id"] == "a"
        assert rows[1]["delta"] != 0

    def test_simulate_client_row_shape(self):
        row = simulate_client_health_row(
            {
                "project_id": "x",
                "name": "Client X",
                "identifier": "X",
                "health_score": 70,
                "health": "ok",
                "health_breakdown": [
                    {"dimension": "report", "score": 80, "weight": 60, "detail": ""},
                    {"dimension": "overdue", "score": 80, "weight": 25, "detail": ""},
                    {"dimension": "support", "score": 80, "weight": 15, "detail": ""},
                ],
                "status_report": {"coverage": "complete", "modules_total": 1},
                "issues": {"overdue": 0},
                "support": {"overdue_count": 0},
            },
            DEFAULT_HEALTH_SCORE_WEIGHTS,
            DEFAULT_HEALTH_SCORE_THRESHOLDS,
        )
        assert row["current_score"] == 70
        assert "simulated_score" in row
        assert "delta" in row
