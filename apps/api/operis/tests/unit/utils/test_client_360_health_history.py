import pytest
from datetime import date, timedelta

from operis.db.models import Client360HealthSnapshot
from operis.utils.client_360 import WeekPeriod, current_week_period
from operis.utils.client_360_health_history import (
    HEALTH_HISTORY_SCHEMA_VERSION,
    parse_health_history_weeks,
    recent_week_periods,
    snapshot_to_history_item,
    upsert_health_snapshot,
)


@pytest.mark.unit
class TestParseHealthHistoryWeeks:
    def test_default_when_missing(self):
        weeks, err = parse_health_history_weeks(None)
        assert weeks == 8
        assert err is None

    def test_invalid_returns_error(self):
        weeks, err = parse_health_history_weeks("abc")
        assert weeks == 8
        assert err is not None

    def test_out_of_range(self):
        weeks, err = parse_health_history_weeks("99")
        assert weeks == 8
        assert "52" in err


@pytest.mark.unit
class TestRecentWeekPeriods:
    def test_returns_ordered_ascending(self):
        today = date(2026, 6, 12)  # Friday
        periods = recent_week_periods(3, today)
        assert len(periods) == 3
        assert periods[0].start < periods[1].start < periods[2].start
        assert periods[-1] == current_week_period(today)


@pytest.mark.unit
class TestSnapshotSerialization:
    def test_snapshot_item_shape(self):
        class FakeSnapshot:
            period_start = date(2026, 6, 9)
            period_end = date(2026, 6, 15)
            health_score = 82
            health = "ok"

        item = snapshot_to_history_item(FakeSnapshot())
        assert item == {
            "period_start": "2026-06-09",
            "period_end": "2026-06-15",
            "health_score": 82,
            "health": "ok",
            "source": "snapshot",
        }


@pytest.mark.django_db
class TestUpsertHealthSnapshot:
    def test_idempotent_by_project_week(self, workspace, create_user):
        from operis.db.models import Project, ProjectMember

        project = Project.objects.create(
            name="Cliente A",
            identifier="CLA",
            workspace=workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        period = WeekPeriod(start=date(2026, 6, 9), end=date(2026, 6, 15))
        upsert_health_snapshot(
            project=project,
            period=period,
            health_score=70,
            health=Client360HealthSnapshot.HEALTH_WARNING,
        )
        upsert_health_snapshot(
            project=project,
            period=period,
            health_score=85,
            health=Client360HealthSnapshot.HEALTH_OK,
        )

        rows = Client360HealthSnapshot.objects.filter(project=project)
        assert rows.count() == 1
        assert rows.first().health_score == 85
