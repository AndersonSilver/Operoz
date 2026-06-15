import pytest

from operis.utils.client_360 import HealthScoreWeights, compute_health_score
from operis.utils.client_360_health_settings import (
    default_health_settings_payload,
    validate_health_thresholds,
    validate_health_weights,
)


@pytest.mark.unit
class TestHealthSettingsValidation:
    def test_valid_weights(self):
        assert validate_health_weights(60, 25, 15) is None

    def test_invalid_weights_sum(self):
        err = validate_health_weights(50, 25, 15)
        assert err is not None
        assert "100" in err

    def test_invalid_weight_range(self):
        err = validate_health_weights(-1, 50, 51)
        assert err is not None
        assert "report" in err

    def test_valid_thresholds(self):
        assert validate_health_thresholds(70, 45) is None

    def test_invalid_threshold_order(self):
        err = validate_health_thresholds(45, 70)
        assert err is not None
        assert "warning_min" in err


@pytest.mark.unit
class TestHealthSettingsDefaults:
    def test_default_payload_shape(self):
        payload = default_health_settings_payload()
        assert payload["is_custom"] is False
        assert payload["weights"]["report"] == 60
        assert payload["thresholds"]["ok_min"] == 70
        assert payload["score_alert_threshold"] == 40
        assert payload["status_report_reminder_enabled"] is False


@pytest.mark.unit
class TestCustomOverdueWeight:
    def test_overdue_weight_40_changes_score(self):
        default_result = compute_health_score(
            report_coverage="complete",
            modules_total=2,
            modules_published=2,
            overdue_issues=1,
            support_open=0,
            support_overdue=0,
        )
        custom_result = compute_health_score(
            report_coverage="complete",
            modules_total=2,
            modules_published=2,
            overdue_issues=1,
            support_open=0,
            support_overdue=0,
            weights=HealthScoreWeights(report=35, overdue=40, support=25),
        )
        assert custom_result.score != default_result.score
        overdue_item = next(item for item in custom_result.breakdown if item.dimension == "overdue")
        assert overdue_item.weight == 40
