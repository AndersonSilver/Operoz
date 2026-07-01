from __future__ import annotations

from typing import Iterable

from django.utils import timezone

from operoz.db.models import Project
from operoz.utils.client_360 import (
    ReportCoverage,
    aggregate_module_counts,
    aggregate_status_reports,
    compute_report_coverage,
    current_week_period,
)
from operoz.utils.client_360_support_hub import aggregate_support_hub_stats


def enrich_discord_project_stats(
    stats: list[dict[str, object]],
    projects: Iterable[Project],
) -> list[dict[str, object]]:
    """Anexa sustentação (hub) e cobertura de status report da semana corrente."""
    if not stats:
        return stats

    project_ids = [str(project.id) for project in projects]
    today = timezone.now().date()
    period = current_week_period(today)
    support_map = aggregate_support_hub_stats(project_ids, today)
    module_counts = aggregate_module_counts(project_ids)
    report_map = aggregate_status_reports(project_ids, period)

    enriched: list[dict[str, object]] = []
    for row in stats:
        pid = str(row.get("project_id") or "")
        support_open = int(support_map.get(pid, {}).get("support_open", 0))
        modules_total = int(module_counts.get(pid, 0))
        report_row = report_map.get(pid, {})
        report_coverage: ReportCoverage = compute_report_coverage(
            modules_total,
            int(report_row.get("modules_published", 0)),
            int(report_row.get("modules_draft_only", 0)),
            bool(report_row.get("has_project_level_published", False)),
        )
        enriched.append(
            {
                **row,
                "support_open": support_open,
                "status_report_coverage": report_coverage,
                "status_report_published": report_coverage == "complete",
            }
        )
    return enriched
