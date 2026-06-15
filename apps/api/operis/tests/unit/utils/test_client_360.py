import pytest

from operis.utils.client_360 import (
    DEFAULT_HEALTH_SCORE_THRESHOLDS,
    DEFAULT_HEALTH_SCORE_WEIGHTS,
    HealthScoreThresholds,
    HealthScoreWeights,
    compute_health,
    compute_health_score,
    compute_report_coverage,
    health_dimensions_from_breakdown,
    health_level_from_score,
)


@pytest.mark.unit
class TestComputeReportCoverage:
    def test_complete_when_all_modules_published(self):
        assert compute_report_coverage(5, 5, 0, False) == "complete"

    def test_missing_when_no_publications(self):
        assert compute_report_coverage(3, 0, 0, False) == "missing"

    def test_na_without_modules(self):
        assert compute_report_coverage(0, 0, 0, False) == "n_a"


@pytest.mark.unit
class TestComputeHealthScore:
    def test_healthy_project_scores_at_least_85(self):
        result = compute_health_score(
            report_coverage="complete",
            modules_total=4,
            modules_published=4,
            overdue_issues=0,
            support_open=0,
            support_overdue=0,
        )
        assert result.score >= 85
        assert result.health == "ok"

    def test_missing_report_with_modules_capped_at_40(self):
        result = compute_health_score(
            report_coverage="missing",
            modules_total=6,
            modules_published=0,
            overdue_issues=0,
            support_open=0,
            support_overdue=0,
        )
        assert result.score <= 40
        assert result.health in ("warning", "critical")

    def test_default_weights_are_deterministic(self):
        first = compute_health_score(
            report_coverage="partial",
            modules_total=4,
            modules_published=2,
            overdue_issues=1,
            support_open=1,
            support_overdue=0,
        )
        second = compute_health_score(
            report_coverage="partial",
            modules_total=4,
            modules_published=2,
            overdue_issues=1,
            support_open=1,
            support_overdue=0,
        )
        assert first.score == second.score
        assert first.health == second.health
        assert len(first.breakdown) == 3
        assert sum(item.weight for item in first.breakdown) == 100

    def test_breakdown_dimensions(self):
        result = compute_health_score(
            report_coverage="complete",
            modules_total=2,
            modules_published=2,
            overdue_issues=0,
            support_open=0,
            support_overdue=0,
        )
        dimensions = {item.dimension for item in result.breakdown}
        assert dimensions == {"report", "overdue", "support"}

    def test_overdue_five_or_more_caps_score(self):
        result = compute_health_score(
            report_coverage="complete",
            modules_total=2,
            modules_published=2,
            overdue_issues=5,
            support_open=0,
            support_overdue=0,
        )
        assert result.score <= 35
        assert result.health == "critical"

    def test_support_overdue_caps_score(self):
        result = compute_health_score(
            report_coverage="complete",
            modules_total=2,
            modules_published=2,
            overdue_issues=0,
            support_open=2,
            support_overdue=1,
        )
        assert result.score <= 35
        assert result.health == "critical"

    def test_custom_weights_change_score(self):
        baseline = compute_health_score(
            report_coverage="partial",
            modules_total=4,
            modules_published=1,
            overdue_issues=0,
            support_open=0,
            support_overdue=0,
            weights=DEFAULT_HEALTH_SCORE_WEIGHTS,
        )
        report_heavy = compute_health_score(
            report_coverage="partial",
            modules_total=4,
            modules_published=1,
            overdue_issues=0,
            support_open=0,
            support_overdue=0,
            weights=HealthScoreWeights(report=80, overdue=10, support=10),
        )
        assert report_heavy.score != baseline.score

    def test_invalid_weights_raise(self):
        with pytest.raises(ValueError, match="sum to 100"):
            HealthScoreWeights(report=50, overdue=30, support=30)


@pytest.mark.unit
class TestHealthLevelFromScore:
    def test_threshold_mapping(self):
        assert health_level_from_score(85, DEFAULT_HEALTH_SCORE_THRESHOLDS) == "ok"
        assert health_level_from_score(70, DEFAULT_HEALTH_SCORE_THRESHOLDS) == "ok"
        assert health_level_from_score(55, DEFAULT_HEALTH_SCORE_THRESHOLDS) == "warning"
        assert health_level_from_score(45, DEFAULT_HEALTH_SCORE_THRESHOLDS) == "warning"
        assert health_level_from_score(30, DEFAULT_HEALTH_SCORE_THRESHOLDS) == "critical"


@pytest.mark.unit
class TestHealthDimensions:
    def test_report_ok_overdue_critical(self):
        result = compute_health_score(
            report_coverage="complete",
            modules_total=2,
            modules_published=2,
            overdue_issues=5,
            support_open=0,
            support_overdue=0,
        )
        dimensions = health_dimensions_from_breakdown(result.breakdown)
        by_dim = {item["dimension"]: item for item in dimensions}
        assert by_dim["report"]["health"] == "ok"
        assert by_dim["overdue"]["health"] == "critical"
        assert by_dim["support"]["health"] == "ok"
        assert len(dimensions) == 3

    def test_custom_thresholds_change_dimension_rag(self):
        result = compute_health_score(
            report_coverage="complete",
            modules_total=2,
            modules_published=2,
            overdue_issues=1,
            support_open=0,
            support_overdue=0,
        )
        strict = HealthScoreThresholds(ok_min=85, warning_min=70)
        relaxed = HealthScoreThresholds(ok_min=50, warning_min=30)

        strict_dims = health_dimensions_from_breakdown(result.breakdown, strict)
        relaxed_dims = health_dimensions_from_breakdown(result.breakdown, relaxed)
        strict_overdue = next(item for item in strict_dims if item["dimension"] == "overdue")
        relaxed_overdue = next(item for item in relaxed_dims if item["dimension"] == "overdue")

        assert strict_overdue["score"] == 80
        assert strict_overdue["health"] == "warning"
        assert relaxed_overdue["health"] == "ok"


@pytest.mark.unit
class TestLegacyHealthRegression:
    """Old semáforo critical cases should map to low scores."""

    @pytest.mark.parametrize(
        "report_coverage,modules_total,overdue,support_open,support_overdue",
        [
            ("missing", 3, 0, 0, 0),
            ("complete", 2, 5, 0, 0),
            ("complete", 2, 0, 1, 1),
        ],
    )
    def test_legacy_critical_implies_low_score(
        self, report_coverage, modules_total, overdue, support_open, support_overdue
    ):
        legacy = compute_health(
            report_coverage=report_coverage,
            overdue_issues=overdue,
            support_open=support_open,
            support_overdue=support_overdue,
        )
        scored = compute_health_score(
            report_coverage=report_coverage,
            modules_total=modules_total,
            modules_published=modules_total if report_coverage == "complete" else 0,
            overdue_issues=overdue,
            support_open=support_open,
            support_overdue=support_overdue,
        )
        assert legacy == "critical"
        assert scored.score < DEFAULT_HEALTH_SCORE_THRESHOLDS.warning_min
        assert scored.health == "critical"
