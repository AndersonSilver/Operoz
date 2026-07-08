from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import date

from django.db.models import QuerySet
from django.utils import timezone

from operoz.db.models import Issue, Project
from operoz.utils.client_360 import (
    WeekPeriod,
    aggregate_client360_issue_stats,
    aggregate_module_counts,
    aggregate_status_reports,
    compute_health_score,
    compute_report_coverage,
    current_week_period,
)
from operoz.utils.client_360_health_history import (
    upsert_health_snapshot,
    week_period_before,
)
from operoz.utils.client_360_health_settings import load_board_health_config_map
from operoz.utils.client_360_operational import load_board_support_sla_map

logger = logging.getLogger("operoz.worker")

DEFAULT_SNAPSHOT_BATCH_SIZE = 100


def snapshot_period_for_job(today: date | None = None) -> WeekPeriod:
    """
    Semana a persistir quando o job corre (tipicamente segunda 06:00 UTC).
    Segunda-feira → semana ISO anterior; domingo → semana corrente a fechar.
    """
    today = today or timezone.now().date()
    current = current_week_period(today)
    if today.weekday() == 6:
        return current
    return week_period_before(current)


def client360_snapshot_projects_qs() -> QuerySet[Project]:
    return Project.objects.filter(
        archived_at__isnull=True,
        board_id__isnull=False,
        board__archived_at__isnull=True,
        board__deleted_at__isnull=True,
        workspace__deleted_at__isnull=True,
    ).select_related("workspace", "board")


def compute_project_health_from_aggregates(
    project: Project,
    period: WeekPeriod,
    *,
    issue_stats: dict[str, int] | None,
    modules_total: int,
    report_stats: dict | None,
    health_config,
) -> tuple[int, str]:
    issues = issue_stats or {
        "overdue": 0,
        "support_open": 0,
        "support_overdue": 0,
    }
    rs = report_stats or {}
    modules_published = rs.get("modules_published", 0)
    modules_draft_only = rs.get("modules_draft_only", 0)
    has_project_level_published = rs.get("has_project_level_published", False)

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
        overdue_issues=issues.get("overdue", 0),
        support_open=issues.get("support_open", 0),
        support_overdue=issues.get("support_overdue", 0),
        weights=weights,
        thresholds=thresholds,
    )
    return result.score, result.health


@dataclass(frozen=True)
class WeeklyHealthSnapshotResult:
    period_start: str
    period_end: str
    total: int
    succeeded: int
    failed: int
    failed_project_ids: tuple[str, ...]

    def as_dict(self) -> dict:
        return {
            "period_start": self.period_start,
            "period_end": self.period_end,
            "total": self.total,
            "succeeded": self.succeeded,
            "failed": self.failed,
            "failed_project_ids": list(self.failed_project_ids),
        }


def run_weekly_health_snapshots(
    *,
    period: WeekPeriod | None = None,
    project_ids: list | None = None,
    batch_size: int = DEFAULT_SNAPSHOT_BATCH_SIZE,
    today: date | None = None,
) -> WeeklyHealthSnapshotResult:
    today = today or timezone.now().date()
    target_period = period or snapshot_period_for_job(today)
    reference_date = target_period.end

    projects_qs = client360_snapshot_projects_qs()
    if project_ids:
        projects_qs = projects_qs.filter(id__in=project_ids)
    projects = list(projects_qs)

    board_ids = list({p.board_id for p in projects if p.board_id})
    health_config_map = load_board_health_config_map(board_ids)

    succeeded = 0
    failed: list[str] = []

    for offset in range(0, len(projects), batch_size):
        batch = projects[offset : offset + batch_size]
        batch_ids = [project.id for project in batch]
        project_board_map = {str(project.id): str(project.board_id) if project.board_id else None for project in batch}
        issue_stats_map = aggregate_client360_issue_stats(
            Issue.issue_objects.filter(project_id__in=batch_ids),
            reference_date,
            project_ids=batch_ids,
            project_board_map=project_board_map,
            sla_map=load_board_support_sla_map(board_ids),
        )
        module_counts = aggregate_module_counts(batch_ids)
        report_stats_map = aggregate_status_reports(batch_ids, target_period)

        for project in batch:
            pid = str(project.id)
            try:
                health_config = health_config_map.get(str(project.board_id)) if project.board_id else None
                score, health = compute_project_health_from_aggregates(
                    project,
                    target_period,
                    issue_stats=issue_stats_map.get(pid),
                    modules_total=module_counts.get(pid, 0),
                    report_stats=report_stats_map.get(pid),
                    health_config=health_config,
                )
                snapshot = upsert_health_snapshot(
                    project=project,
                    period=target_period,
                    health_score=score,
                    health=health,
                )
                try:
                    from operoz.utils.client_360_intelligence_rag import index_health_snapshot_for_rag

                    index_health_snapshot_for_rag(str(snapshot.id))
                except Exception:
                    logger.exception("client360 snapshot RAG index failed for project %s", pid)
                succeeded += 1
            except Exception:
                logger.exception("client360 health snapshot failed for project %s", pid)
                failed.append(pid)

    result = WeeklyHealthSnapshotResult(
        period_start=target_period.start.isoformat(),
        period_end=target_period.end.isoformat(),
        total=len(projects),
        succeeded=succeeded,
        failed=len(failed),
        failed_project_ids=tuple(failed),
    )

    if failed:
        logger.warning(
            "client360 weekly health snapshot completed with failures",
            extra=result.as_dict(),
        )
    else:
        logger.info(
            "client360 weekly health snapshot completed",
            extra=result.as_dict(),
        )

    return result
