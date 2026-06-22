from __future__ import annotations

import logging

from celery import shared_task

from operis.db.models import Workspace
from operis.utils.client_360 import current_week_period
from operis.utils.client_360_intelligence import (
    build_weekly_briefing_facts,
    compute_facts_hash,
    generate_weekly_briefing_md,
    upsert_weekly_briefing,
    validate_briefing_qa,
)
from operis.utils.client_360_health_alerts import build_client360_list_summary

logger = logging.getLogger(__name__)


def _build_workspace_list_payload(workspace_slug: str, period):
    from django.utils import timezone

    from operis.db.models import Issue, Project, Workspace
    from operis.utils.client_360 import (
        aggregate_client360_issue_stats,
        aggregate_module_counts,
        aggregate_status_reports,
        build_client_row,
    )
    from operis.utils.client_360_finops import (
        apply_finops_enrichment,
        load_finops_profiles,
        load_finops_settings,
        month_start,
    )
    from operis.utils.client_360_health_settings import (
        load_board_health_config_map,
        load_board_score_alert_threshold_map,
    )
    from operis.utils.client_360_operational import apply_operational_enrichment, load_board_support_sla_map

    workspace = Workspace.objects.filter(slug=workspace_slug, deleted_at__isnull=True).first()
    if not workspace:
        return None
    projects = list(
        Project.objects.filter(
            workspace=workspace,
            archived_at__isnull=True,
            board_id__isnull=False,
            board__archived_at__isnull=True,
            board__deleted_at__isnull=True,
        ).select_related("board")
    )
    project_ids = [p.id for p in projects]
    today = timezone.now().date()

    issue_qs = Issue.issue_objects.filter(
        workspace=workspace,
        project_id__in=project_ids,
    ).distinct()
    board_ids = list({p.board_id for p in projects if p.board_id})
    project_board_map = {str(p.id): str(p.board_id) if p.board_id else None for p in projects}
    issue_stats_map = aggregate_client360_issue_stats(
        issue_qs,
        today,
        project_ids=project_ids,
        project_board_map=project_board_map,
        sla_map=load_board_support_sla_map(board_ids),
    )
    module_counts = aggregate_module_counts(project_ids)
    report_stats_map = aggregate_status_reports(project_ids, period)
    health_config_map = load_board_health_config_map(board_ids)
    alert_threshold_map = load_board_score_alert_threshold_map(board_ids)
    clients = [
        build_client_row(
            project,
            period=period,
            modules_total=module_counts.get(str(project.id), 0),
            issue_stats=issue_stats_map.get(str(project.id)),
            report_stats=report_stats_map.get(str(project.id)),
            board=project.board,
            health_config=health_config_map.get(str(project.board_id)) if project.board_id else None,
            score_alert_threshold=alert_threshold_map.get(str(project.board_id)) if project.board_id else None,
        )
        for project in projects
    ]
    project_board_map = {str(p.id): str(p.board_id) if p.board_id else None for p in projects}
    apply_operational_enrichment(
        clients,
        issue_queryset=issue_qs,
        period=period,
        today=today,
        board_ids=board_ids,
        project_board_map=project_board_map,
    )
    finops_settings = load_finops_settings(workspace.id)
    finops_profiles = load_finops_profiles(project_ids, month_start(today))
    apply_finops_enrichment(clients, profiles=finops_profiles, settings=finops_settings)
    summary = build_client360_list_summary(clients)
    return {
        "summary": summary,
        "clients": clients,
        "period": {"start": period.start.isoformat(), "end": period.end.isoformat()},
        "workspace_id": workspace.id,
    }


def run_weekly_briefings(*, workspace_slug: str | None = None) -> dict:
    period = current_week_period()
    workspaces = Workspace.objects.filter(deleted_at__isnull=True)
    if workspace_slug:
        workspaces = workspaces.filter(slug=workspace_slug)
    generated = 0
    blocked = 0
    for workspace in workspaces:
        payload = _build_workspace_list_payload(workspace.slug, period)
        if not payload:
            continue
        facts = build_weekly_briefing_facts(
            summary=payload["summary"],
            clients=payload["clients"],
            period=payload["period"],
        )
        content_md = generate_weekly_briefing_md(facts)
        ok, qa_issues = validate_briefing_qa(content_md, facts)
        row = upsert_weekly_briefing(
            workspace_id=payload["workspace_id"],
            period_start=period.start,
            period_end=period.end,
            content_md=content_md,
            facts_hash=compute_facts_hash(facts),
            qa_issues=qa_issues if not ok else [],
        )
        if row.status == row.STATUS_BLOCKED:
            blocked += 1
        else:
            generated += 1
    return {"generated": generated, "blocked": blocked}


@shared_task(bind=True, max_retries=3, default_retry_delay=120)
def generate_weekly_client360_briefings(self, workspace_slug=None):
    try:
        result = run_weekly_briefings(workspace_slug=workspace_slug)
        logger.info("client360 weekly briefing job completed", extra=result)
        return result
    except Exception as exc:
        logger.exception("client360 weekly briefing job failed")
        raise self.retry(exc=exc) from exc
