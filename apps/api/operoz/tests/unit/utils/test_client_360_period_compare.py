from __future__ import annotations

import pytest

from operoz.utils.client_360_period_compare import (
    build_client_period_compare,
    compute_summary_delta,
    report_coverage_delta,
)


class TestReportCoverageDelta:
    def test_same_coverage_is_zero(self):
        assert report_coverage_delta("missing", "missing") == 0

    def test_improved_coverage_positive(self):
        assert report_coverage_delta("complete", "missing") == 2


class TestComputeSummaryDelta:
    def test_overdue_improvement(self):
        current = {"total_overdue": 5, "report_missing": 2, "health_critical": 1, "health_warning": 0, "total_support_open": 0, "health_score_alert": 0}
        previous = {"total_overdue": 8, "report_missing": 2, "health_critical": 1, "health_warning": 0, "total_support_open": 0, "health_score_alert": 0}
        delta = compute_summary_delta(current, previous)
        assert delta["total_overdue"] == -3
        assert delta["report_missing"] == 0


class TestBuildClientPeriodCompare:
    def test_overdue_delta(self):
        current = {
            "issues": {"overdue": 5},
            "health_score": 70,
            "status_report": {"coverage": "partial"},
            "support": {"open_count": 1},
        }
        previous = {
            "issues": {"overdue": 8},
            "health_score": 60,
            "status_report": {"coverage": "missing"},
            "support": {"open_count": 2},
        }
        result = build_client_period_compare(current, previous)
        assert result["available"] is True
        assert result["overdue_delta"] == -3
        assert result["health_score_delta"] == 10
        assert result["report_coverage_delta"] == 1

    def test_unavailable_without_previous(self):
        current = {
            "issues": {"overdue": 0},
            "health_score": 80,
            "status_report": {"coverage": "complete"},
            "support": {"open_count": 0},
        }
        assert build_client_period_compare(current, None) == {"available": False}
