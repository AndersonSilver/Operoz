from __future__ import annotations

from datetime import date, timedelta

from django.db.models import QuerySet
from django.utils import timezone

from operis.db.models import Client360HealthSnapshot, Project
from operis.utils.client_360 import (
    HealthScoreThresholds,
    HealthScoreWeights,
    WeekPeriod,
    aggregate_issue_stats,
    aggregate_module_counts,
    aggregate_status_reports,
    compute_health_score,
    compute_report_coverage,
    current_week_period,
)
from operis.utils.client_360_health_settings import load_board_health_config_map

HEALTH_HISTORY_SCHEMA_VERSION = 1
DEFAULT_HEALTH_HISTORY_WEEKS = 8
MAX_HEALTH_HISTORY_WEEKS = 52

LIVE_BACKFILL_LIMITATION = (
    "Histórico semanal completo depende do job agendado (CRON SNAPSHOT SEMANAL HEALTH). "
    "Sem snapshots persistidos, apenas a semana corrente pode incluir score calculado em tempo real."
)


def parse_health_history_weeks(raw: str | None, *, default: int = DEFAULT_HEALTH_HISTORY_WEEKS) -> tuple[int, str | None]:
    if raw is None or raw == "":
        return default, None
    try:
        weeks = int(raw)
    except (TypeError, ValueError):
        return default, "weeks must be an integer between 1 and 52"
    if weeks < 1 or weeks > MAX_HEALTH_HISTORY_WEEKS:
        return default, f"weeks must be between 1 and {MAX_HEALTH_HISTORY_WEEKS}"
    return weeks, None


def week_period_before(reference: WeekPeriod) -> WeekPeriod:
    prev_start = reference.start - timedelta(days=7)
    prev_end = prev_start + timedelta(days=6)
    return WeekPeriod(start=prev_start, end=prev_end)


def recent_week_periods(count: int, today: date | None = None) -> list[WeekPeriod]:
    current = current_week_period(today)
    periods = [current]
    cursor = current
    for _ in range(count - 1):
        cursor = week_period_before(cursor)
        periods.append(cursor)
    periods.reverse()
    return periods


def snapshot_to_history_item(snapshot: Client360HealthSnapshot) -> dict:
    return {
        "period_start": snapshot.period_start.isoformat(),
        "period_end": snapshot.period_end.isoformat(),
        "health_score": snapshot.health_score,
        "health": snapshot.health,
        "source": "snapshot",
    }


def compute_live_health_history_item(
    project: Project,
    *,
    period: WeekPeriod,
    issue_queryset: QuerySet,
    reference_date: date,
    health_config: tuple[HealthScoreWeights, HealthScoreThresholds] | None = None,
) -> dict:
    pid = str(project.id)
    modules_total = aggregate_module_counts([project.id]).get(pid, 0)
    issue_stats = aggregate_issue_stats(
        issue_queryset.filter(project_id=project.id),
        reference_date,
    ).get(pid, {"overdue": 0, "support_open": 0, "support_overdue": 0})
    report_stats = aggregate_status_reports([project.id], period).get(pid, {})

    modules_published = report_stats.get("modules_published", 0)
    modules_draft_only = report_stats.get("modules_draft_only", 0)
    has_project_level_published = report_stats.get("has_project_level_published", False)

    report_coverage = compute_report_coverage(
        modules_total,
        modules_published,
        modules_draft_only,
        has_project_level_published,
    )

    weights = health_config[0] if health_config else None
    thresholds = health_config[1] if health_config else None
    result = compute_health_score(
        report_coverage=report_coverage,
        modules_total=modules_total,
        modules_published=modules_published,
        overdue_issues=issue_stats["overdue"],
        support_open=issue_stats["support_open"],
        support_overdue=issue_stats["support_overdue"],
        weights=weights,
        thresholds=thresholds,
    )

    return {
        "period_start": period.start.isoformat(),
        "period_end": period.end.isoformat(),
        "health_score": result.score,
        "health": result.health,
        "source": "live",
    }


def upsert_health_snapshot(
    *,
    project: Project,
    period: WeekPeriod,
    health_score: int,
    health: str,
) -> Client360HealthSnapshot:
    snapshot, _ = Client360HealthSnapshot.objects.update_or_create(
        project=project,
        period_start=period.start,
        defaults={
            "workspace": project.workspace,
            "period_end": period.end,
            "health_score": health_score,
            "health": health,
        },
    )
    return snapshot


def build_health_history_payload(
    project: Project,
    *,
    weeks: int,
    issue_queryset: QuerySet,
    today: date | None = None,
) -> dict:
    today = today or timezone.now().date()
    target_periods = recent_week_periods(weeks, today)
    if not target_periods:
        return _empty_history_payload(project, weeks)

    earliest = target_periods[0].start
    snapshots = Client360HealthSnapshot.objects.filter(
        project=project,
        deleted_at__isnull=True,
        period_start__gte=earliest,
    ).order_by("period_start")
    snapshot_by_start = {row.period_start: row for row in snapshots}

    health_config = None
    if project.board_id:
        health_config = load_board_health_config_map([project.board_id]).get(str(project.board_id))

    history: list[dict] = []
    includes_live = False
    for period in target_periods:
        stored = snapshot_by_start.get(period.start)
        if stored is not None:
            history.append(snapshot_to_history_item(stored))
            continue

        if period.start == target_periods[-1].start:
            history.append(
                compute_live_health_history_item(
                    project,
                    period=period,
                    issue_queryset=issue_queryset,
                    reference_date=today,
                    health_config=health_config,
                )
            )
            includes_live = True

    has_gaps = len(history) < len(target_periods)
    source = "snapshots_with_live" if includes_live else "snapshots"
    limitation = LIVE_BACKFILL_LIMITATION if has_gaps or includes_live else None

    return {
        "schema_version": HEALTH_HISTORY_SCHEMA_VERSION,
        "project_id": str(project.id),
        "weeks_requested": weeks,
        "source": source,
        "limitation": limitation,
        "history": history,
    }


def _empty_history_payload(project: Project, weeks: int) -> dict:
    return {
        "schema_version": HEALTH_HISTORY_SCHEMA_VERSION,
        "project_id": str(project.id),
        "weeks_requested": weeks,
        "source": "snapshots",
        "limitation": LIVE_BACKFILL_LIMITATION,
        "history": [],
    }
