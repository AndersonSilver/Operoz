from __future__ import annotations

from decimal import Decimal

import pytest

from operoz.utils.client_360_finops import (
    compute_forecast,
    compute_margin_pct,
    compute_utilization_pct,
    compute_variance_pct,
)


@pytest.mark.unit
class TestFinopsCalculations:
    def test_utilization_80_percent(self):
        assert compute_utilization_pct(160, 200) == 80.0

    def test_variance_positive(self):
        assert compute_variance_pct(100, 120) == 20.0

    def test_margin_thirty_percent(self):
        assert compute_margin_pct(50000, 35000) == 30.0

    def test_forecast_five_weeks(self):
        result = compute_forecast(50, 10)
        assert result["status"] == "ok"
        assert result["weeks"] == 5.0

    def test_forecast_indeterminate_when_no_burn(self):
        result = compute_forecast(50, 0)
        assert result["status"] == "indeterminate"
