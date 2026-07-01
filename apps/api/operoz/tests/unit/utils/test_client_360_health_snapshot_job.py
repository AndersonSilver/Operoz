from datetime import date

import pytest

from operoz.db.models import Board, Client360HealthSnapshot, Project
from operoz.utils.client_360 import WeekPeriod, current_week_period
from operoz.utils.client_360_health_history import upsert_health_snapshot, week_period_before
from operoz.utils.client_360_health_snapshot_job import (
    run_weekly_health_snapshots,
    snapshot_period_for_job,
)


@pytest.mark.unit
class TestSnapshotPeriodForJob:
    def test_monday_targets_previous_week(self):
        monday = date(2026, 6, 15)  # Monday
        period = snapshot_period_for_job(monday)
        expected = week_period_before(current_week_period(monday))
        assert period == expected

    def test_sunday_targets_current_week(self):
        sunday = date(2026, 6, 14)  # Sunday
        period = snapshot_period_for_job(sunday)
        assert period == current_week_period(sunday)


@pytest.mark.django_db
class TestRunWeeklyHealthSnapshots:
    def test_upsert_is_idempotent(self, workspace, create_user):
        board = Board.objects.create(name="Snap Board", slug="snap-board", workspace=workspace)
        project = Project.objects.create(
            name="Snap Client",
            identifier="SNAP",
            workspace=workspace,
            board=board,
            created_by=create_user,
        )
        period = WeekPeriod(start=date(2026, 6, 9), end=date(2026, 6, 15))

        first = run_weekly_health_snapshots(period=period, project_ids=[project.id])
        second = run_weekly_health_snapshots(period=period, project_ids=[project.id])

        assert first.succeeded == 1
        assert second.succeeded == 1
        assert Client360HealthSnapshot.objects.filter(project=project).count() == 1

    def test_creates_snapshot_row(self, workspace, create_user):
        board = Board.objects.create(name="Snap Board 2", slug="snap-board-2", workspace=workspace)
        project = Project.objects.create(
            name="Snap Client 2",
            identifier="SNAP2",
            workspace=workspace,
            board=board,
            created_by=create_user,
        )
        period = WeekPeriod(start=date(2026, 6, 2), end=date(2026, 6, 8))

        result = run_weekly_health_snapshots(period=period, project_ids=[project.id])

        assert result.failed == 0
        snapshot = Client360HealthSnapshot.objects.get(project=project, period_start=period.start)
        assert 0 <= snapshot.health_score <= 100
        assert snapshot.health in {"ok", "warning", "critical"}

    def test_manual_upsert_then_job_updates_same_row(self, workspace, create_user):
        board = Board.objects.create(name="Snap Board 3", slug="snap-board-3", workspace=workspace)
        project = Project.objects.create(
            name="Snap Client 3",
            identifier="SNAP3",
            workspace=workspace,
            board=board,
            created_by=create_user,
        )
        period = WeekPeriod(start=date(2026, 5, 26), end=date(2026, 6, 1))

        upsert_health_snapshot(
            project=project,
            period=period,
            health_score=55,
            health=Client360HealthSnapshot.HEALTH_WARNING,
        )
        run_weekly_health_snapshots(period=period, project_ids=[project.id])

        rows = Client360HealthSnapshot.objects.filter(project=project, period_start=period.start)
        assert rows.count() == 1
