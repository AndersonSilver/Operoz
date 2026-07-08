from __future__ import annotations

import logging
import zoneinfo
from dataclasses import dataclass

from django.utils import timezone

from operoz.db.models import (
    BoardClient360HealthSettings,
    Client360StatusReportReminderLog,
    Notification,
    Project,
)
from operoz.utils.client_360 import (
    WeekPeriod,
    aggregate_module_counts,
    aggregate_status_reports,
    build_client_row,
    parse_week_period,
)
from operoz.utils.client_360_health_settings import load_board_health_config_map, load_board_score_alert_threshold_map

logger = logging.getLogger(__name__)

REMINDER_HOUR = 14
REMINDER_WEEKDAY = 4  # Friday
ENTITY_NAME = "client_360_status_report_reminder"


@dataclass
class ReminderJobResult:
    boards_processed: int = 0
    boards_skipped: int = 0
    notifications_sent: int = 0
    failures: int = 0


def _current_week_period(today) -> WeekPeriod:
    return parse_week_period(today, today)


def _should_run_for_workspace(now, workspace_timezone: str) -> bool:
    try:
        tz = zoneinfo.ZoneInfo(workspace_timezone or "UTC")
    except Exception:
        tz = zoneinfo.ZoneInfo("UTC")
    local = now.astimezone(tz)
    return local.weekday() == REMINDER_WEEKDAY and local.hour == REMINDER_HOUR


def _find_leads(project: Project):
    if project.project_lead_id and project.project_lead and project.project_lead.is_active:
        yield project.project_lead
    for member in project.project_projectmember.filter(is_active=True, role__gte=15).select_related("member"):
        if member.member_id and member.member.is_active:
            yield member.member


def _create_notification(*, workspace, project, receiver, title: str, body: str, url: str):
    Notification.objects.create(
        workspace=workspace,
        project=project,
        receiver=receiver,
        sender="Operoz Visão 360",
        entity_name=ENTITY_NAME,
        title=title,
        message_html=f"<p>{body}</p>",
        message_stripped=body,
        data={"url": url},
        triggered_by=None,
    )


def run_friday_status_report_reminders(*, force: bool = False, board_ids: list | None = None) -> ReminderJobResult:
    now = timezone.now()
    today = now.date()
    period = _current_week_period(today)
    result = ReminderJobResult()

    settings_qs = BoardClient360HealthSettings.objects.filter(
        status_report_reminder_enabled=True,
        deleted_at__isnull=True,
        board__archived_at__isnull=True,
        board__deleted_at__isnull=True,
    ).select_related("board", "workspace")
    if board_ids:
        settings_qs = settings_qs.filter(board_id__in=board_ids)

    for settings in settings_qs:
        board = settings.board
        workspace = settings.workspace
        if not force and not _should_run_for_workspace(now, workspace.timezone):
            result.boards_skipped += 1
            continue

        if Client360StatusReportReminderLog.objects.filter(
            board=board,
            period_start=period.start,
            period_end=period.end,
        ).exists():
            result.boards_skipped += 1
            continue

        projects = list(
            Project.objects.filter(
                board_id=board.id,
                workspace_id=workspace.id,
                archived_at__isnull=True,
            ).select_related("project_lead", "board")
        )
        if not projects:
            result.boards_skipped += 1
            continue

        project_ids = [project.id for project in projects]
        module_counts = aggregate_module_counts(project_ids)
        report_stats = aggregate_status_reports(project_ids, period)
        health_config_map = load_board_health_config_map([board.id])
        alert_threshold_map = load_board_score_alert_threshold_map([board.id])

        notified = 0
        skipped = 0
        details: list[dict] = []

        for project in projects:
            pid = str(project.id)
            row = build_client_row(
                project,
                period=period,
                modules_total=module_counts.get(pid, 0),
                issue_stats=None,
                report_stats=report_stats.get(pid),
                board=board,
                health_config=health_config_map.get(str(board.id)),
                score_alert_threshold=alert_threshold_map.get(str(board.id)),
            )
            coverage = row.get("status_report", {}).get("coverage")
            if coverage in {"complete", "n_a"}:
                skipped += 1
                continue

            url = f"/{workspace.slug}/projects/{project.id}/status-report"
            title = f"Status report pendente — {project.name}"
            body = (
                f"O status report da semana {period.start.isoformat()} ainda está "
                f"{'parcial' if coverage == 'partial' else 'em falta'}. "
                f"Complete antes do fecho da semana."
            )
            receivers = {user.id: user for user in _find_leads(project) if user and user.is_active}
            if not receivers:
                skipped += 1
                details.append({"project_id": pid, "status": "no_lead"})
                continue

            for user in receivers.values():
                _create_notification(
                    workspace=workspace,
                    project=project,
                    receiver=user,
                    title=title,
                    body=body,
                    url=url,
                )
                notified += 1

            details.append({"project_id": pid, "status": "notified", "coverage": coverage})

        Client360StatusReportReminderLog.objects.create(
            workspace=workspace,
            board=board,
            period_start=period.start,
            period_end=period.end,
            notified_count=notified,
            skipped_count=skipped,
            details=details,
        )
        result.boards_processed += 1
        result.notifications_sent += notified

    return result
