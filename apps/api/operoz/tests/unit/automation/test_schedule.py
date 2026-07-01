from datetime import datetime
from zoneinfo import ZoneInfo

import pytest

from operoz.automation.schedule import (
    cron_from_config,
    default_schedule_config,
    is_slot_due,
    validate_schedule_config,
)


@pytest.mark.unit
class TestScheduleCron:
    def test_default_config_valid(self):
        assert not validate_schedule_config(default_schedule_config())

    def test_daily_cron_expression(self):
        expr = cron_from_config({"preset": "daily", "time": "09:30", "timezone": "UTC"})
        assert expr == "30 9 * * *"

    def test_weekly_cron_expression(self):
        expr = cron_from_config(
            {
                "preset": "weekly",
                "time": "08:00",
                "weekdays": [0, 2, 4],
                "timezone": "UTC",
            }
        )
        assert expr == "0 8 * * 1,3,5"

    def test_monthly_cron_expression(self):
        expr = cron_from_config(
            {"preset": "monthly", "time": "12:15", "day_of_month": 15, "timezone": "UTC"}
        )
        assert expr == "15 12 15 * *"

    def test_custom_cron(self):
        expr = cron_from_config({"preset": "custom", "cron": "*/15 * * * *", "timezone": "UTC"})
        assert expr == "*/15 * * * *"

    def test_invalid_timezone(self):
        errors = validate_schedule_config({"preset": "daily", "time": "09:00", "timezone": "Invalid/Zone"})
        assert any("Fuso horário" in e for e in errors)

    def test_is_slot_due_daily(self):
        config = {
            "preset": "daily",
            "time": "09:00",
            "timezone": "UTC",
        }
        now = datetime(2026, 6, 9, 9, 0, tzinfo=ZoneInfo("UTC"))
        assert is_slot_due(now, config) == "2026-06-09T09:00"

        off = datetime(2026, 6, 9, 9, 6, tzinfo=ZoneInfo("UTC"))
        assert is_slot_due(off, config, grace_minutes=5) is None

    def test_is_slot_due_grace_catches_missed_minute(self):
        config = {
            "preset": "daily",
            "time": "01:51",
            "timezone": "America/Sao_Paulo",
        }
        # 3 minutos depois do horário — ainda dentro da janela de recuperação
        now = datetime(2026, 6, 10, 4, 54, tzinfo=ZoneInfo("UTC"))
        assert is_slot_due(now, config) == "2026-06-10T01:51"

        # 10 minutos depois — ainda dentro da janela padrão (15 min)
        late = datetime(2026, 6, 10, 5, 1, tzinfo=ZoneInfo("UTC"))
        assert is_slot_due(late, config) == "2026-06-10T01:51"

        # já processado
        assert (
            is_slot_due(now, config, last_slot="2026-06-10T01:51") is None
        )
