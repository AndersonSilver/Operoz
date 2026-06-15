from __future__ import annotations

from datetime import datetime, timezone as dt_timezone
from unittest.mock import patch

import pytest
from django.utils import timezone

from operis.db.models import BoardClient360HealthSettings, Module, Notification, Project, ProjectMember
from operis.utils.client_360_status_report_reminder_job import REMINDER_HOUR, run_friday_status_report_reminders


@pytest.fixture
def reminder_board_setup(db, workspace, workspace_board, create_user):
    project = Project.objects.create(
        name="Cliente Lembrete",
        identifier="CLEM",
        workspace=workspace,
        board=workspace_board,
        project_lead=create_user,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    Module.objects.create(
        name="Módulo Lembrete",
        project=project,
        workspace=workspace,
        created_by=create_user,
    )
    BoardClient360HealthSettings.objects.create(
        workspace=workspace,
        board=workspace_board,
        status_report_reminder_enabled=True,
    )
    return project, workspace_board


@pytest.mark.unit
@pytest.mark.django_db
class TestFridayStatusReportReminderJob:
    def test_skips_when_not_friday_hour(self, reminder_board_setup, workspace):
        _, board = reminder_board_setup
        now = datetime(2026, 6, 11, REMINDER_HOUR, 0, tzinfo=dt_timezone.utc)
        with patch.object(timezone, "now", return_value=now):
            result = run_friday_status_report_reminders(force=False, board_ids=[board.id])
        assert result.boards_skipped >= 1
        assert result.notifications_sent == 0

    def test_notifies_missing_report_on_friday(self, reminder_board_setup, workspace, create_user):
        project, board = reminder_board_setup
        friday = datetime(2026, 6, 12, REMINDER_HOUR, 0, tzinfo=dt_timezone.utc)
        with patch.object(timezone, "now", return_value=friday):
            result = run_friday_status_report_reminders(force=True, board_ids=[board.id])
        assert result.boards_processed == 1
        assert result.notifications_sent >= 1
        assert Notification.objects.filter(
            receiver=create_user,
            entity_name="client_360_status_report_reminder",
            project=project,
        ).exists()

    def test_skips_when_reminder_disabled(self, db, workspace, workspace_board, create_user):
        project = Project.objects.create(
            name="Sem lembrete",
            identifier="CSL",
            workspace=workspace,
            board=workspace_board,
            project_lead=create_user,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        result = run_friday_status_report_reminders(force=True, board_ids=[workspace_board.id])
        assert result.boards_processed == 0

    def test_idempotent_same_week(self, reminder_board_setup, workspace):
        _, board = reminder_board_setup
        result1 = run_friday_status_report_reminders(force=True, board_ids=[board.id])
        result2 = run_friday_status_report_reminders(force=True, board_ids=[board.id])
        assert result1.boards_processed == 1
        assert result2.boards_skipped >= 1
