from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Iterable, Literal

from django.db.models import Count, Q
from django.utils import timezone

from operoz.db.models import Board, BoardStatusReport, Module, Project
from operoz.utils.client_360_health_alerts import (
    is_health_score_alert,
    resolve_score_alert_threshold,
)
from operoz.utils.status_report_export import user_consultor_label

CLOSED_STATE_GROUPS = ("completed", "cancelled")
# Legacy: sustentação na Visão 360 usa IntakeIssue (hub). Mantido só para referência em docs/tests legados.
SUPPORT_TYPE_NAME_Q = Q(type__name__icontains="sustent") | Q(type__name__icontains="chamado")

HealthLevel = Literal["ok", "warning", "critical"]
ReportCoverage = Literal["complete", "partial", "missing", "n_a"]
HealthDimension = Literal["report", "overdue", "support"]


@dataclass(frozen=True)
class HealthScoreWeights:
    report: int = 60
    overdue: int = 25
    support: int = 15

    def __post_init__(self) -> None:
        total = self.report + self.overdue + self.support
        if total != 100:
            raise ValueError("Health score weights must sum to 100")


@dataclass(frozen=True)
class HealthScoreThresholds:
    ok_min: int = 70
    warning_min: int = 45


@dataclass(frozen=True)
class HealthScoreBreakdownItem:
    dimension: HealthDimension
    score: int
    weight: int
    detail: str

    def as_dict(self) -> dict:
        return {
            "dimension": self.dimension,
            "score": self.score,
            "weight": self.weight,
            "detail": self.detail,
        }


@dataclass(frozen=True)
class HealthScoreResult:
    score: int
    health: HealthLevel
    breakdown: tuple[HealthScoreBreakdownItem, ...]

    def as_breakdown_list(self) -> list[dict]:
        return [item.as_dict() for item in self.breakdown]


def health_dimensions_from_breakdown(
    breakdown: tuple[HealthScoreBreakdownItem, ...],
    thresholds: HealthScoreThresholds | None = None,
) -> list[dict]:
    """RAG independente por dimensão (report, overdue/entrega, sustentação)."""
    return [
        {
            "dimension": item.dimension,
            "score": item.score,
            "health": health_level_from_score(item.score, thresholds),
        }
        for item in breakdown
    ]


DEFAULT_HEALTH_SCORE_WEIGHTS = HealthScoreWeights()
DEFAULT_HEALTH_SCORE_THRESHOLDS = HealthScoreThresholds()


@dataclass(frozen=True)
class WeekPeriod:
    start: date
    end: date


def current_week_period(today: date | None = None) -> WeekPeriod:
    today = today or timezone.now().date()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    return WeekPeriod(start=week_start, end=week_end)


def parse_week_period(period_start: date | None, period_end: date | None) -> WeekPeriod:
    if period_start and period_end:
        if period_end < period_start:
            raise ValueError("period_end must be on or after period_start")
        return WeekPeriod(start=period_start, end=period_end)
    return current_week_period()


def compute_report_coverage(
    modules_total: int,
    modules_published: int,
    modules_draft_only: int,
    has_project_level_published: bool,
) -> ReportCoverage:
    if modules_total == 0:
        if has_project_level_published:
            return "complete"
        return "n_a"
    if modules_published >= modules_total:
        return "complete"
    if modules_published > 0 or modules_draft_only > 0 or has_project_level_published:
        return "partial"
    return "missing"


def project_lead_payload(project: Project) -> dict | None:
    lead = getattr(project, "project_lead", None)
    if lead is None:
        return None
    return {"id": str(lead.id), "display_name": user_consultor_label(lead)}


def compute_health(
    *,
    report_coverage: ReportCoverage,
    overdue_issues: int,
    support_open: int,
    support_overdue: int,
) -> HealthLevel:
    """Legacy semáforo — prefer :func:`compute_health_score` for API payloads."""
    if report_coverage == "missing" or overdue_issues >= 5 or support_overdue > 0:
        return "critical"
    if overdue_issues > 0 or report_coverage == "partial" or support_open > 0:
        return "warning"
    return "ok"


def _clamp_score(value: int) -> int:
    return max(0, min(100, int(value)))


def _dimension_report_score(
    report_coverage: ReportCoverage,
    modules_total: int,
    modules_published: int,
) -> tuple[int, str]:
    if report_coverage == "complete":
        return 100, "Status report completo"
    if report_coverage == "n_a":
        return 90, "Sem módulos configurados"
    if report_coverage == "partial":
        if modules_total > 0:
            ratio_score = _clamp_score(round(100 * modules_published / modules_total))
            return max(ratio_score, 45), f"Report parcial ({modules_published}/{modules_total} módulos)"
        return 55, "Report parcial"
    if modules_total > 0:
        return 0, f"Report em falta ({modules_total} módulos sem publicação)"
    return 25, "Report em falta"


def _dimension_overdue_score(overdue_issues: int) -> tuple[int, str]:
    if overdue_issues <= 0:
        return 100, "Sem itens atrasados"
    if overdue_issues == 1:
        return 80, "1 item atrasado"
    if overdue_issues == 2:
        return 60, "2 itens atrasados"
    if overdue_issues == 3:
        return 40, "3 itens atrasados"
    if overdue_issues == 4:
        return 20, "4 itens atrasados"
    return 0, f"{overdue_issues} itens atrasados"


def _dimension_support_score(support_open: int, support_overdue: int) -> tuple[int, str]:
    if support_overdue > 0:
        score = _clamp_score(25 - support_overdue * 10)
        return score, f"{support_overdue} sustentação atrasada"
    if support_open <= 0:
        return 100, "Sem sustentação aberta"
    if support_open == 1:
        return 70, "1 chamado de sustentação aberto"
    score = _clamp_score(70 - (support_open - 1) * 15)
    return score, f"{support_open} chamados de sustentação abertos"


def health_level_from_score(score: int, thresholds: HealthScoreThresholds | None = None) -> HealthLevel:
    limits = thresholds or DEFAULT_HEALTH_SCORE_THRESHOLDS
    if score >= limits.ok_min:
        return "ok"
    if score >= limits.warning_min:
        return "warning"
    return "critical"


def compute_health_score(
    *,
    report_coverage: ReportCoverage,
    modules_total: int,
    modules_published: int,
    overdue_issues: int,
    support_open: int,
    support_overdue: int,
    weights: HealthScoreWeights | None = None,
    thresholds: HealthScoreThresholds | None = None,
) -> HealthScoreResult:
    """
    Score 0–100 com breakdown por dimensão (report, overdue, sustentação).
    Caps alinhados ao semáforo legado para casos críticos conhecidos.
    """
    w = weights or DEFAULT_HEALTH_SCORE_WEIGHTS
    report_score, report_detail = _dimension_report_score(report_coverage, modules_total, modules_published)
    overdue_score, overdue_detail = _dimension_overdue_score(overdue_issues)
    support_score, support_detail = _dimension_support_score(support_open, support_overdue)

    weighted = round((report_score * w.report + overdue_score * w.overdue + support_score * w.support) / 100)
    score = _clamp_score(weighted)

    if report_coverage == "missing" and modules_total > 0:
        score = min(score, 40)
    if overdue_issues >= 5:
        score = min(score, 35)
    if support_overdue > 0:
        score = min(score, 35)

    breakdown = (
        HealthScoreBreakdownItem("report", report_score, w.report, report_detail),
        HealthScoreBreakdownItem("overdue", overdue_score, w.overdue, overdue_detail),
        HealthScoreBreakdownItem("support", support_score, w.support, support_detail),
    )
    return HealthScoreResult(
        score=score,
        health=health_level_from_score(score, thresholds),
        breakdown=breakdown,
    )


def aggregate_issue_stats(issue_queryset, today: date) -> dict[str, dict[str, int]]:
    """project_id (str) -> {total, pending, overdue}. Sustentação: aggregate_client360_issue_stats."""
    pending_filter = ~Q(state__group__in=CLOSED_STATE_GROUPS)
    overdue_filter = pending_filter & Q(target_date__lt=today, target_date__isnull=False)

    rows = issue_queryset.values("project_id").annotate(
        total=Count("pk", distinct=True),
        pending=Count("pk", filter=pending_filter, distinct=True),
        overdue=Count("pk", filter=overdue_filter, distinct=True),
    )
    return {
        str(row["project_id"]): {
            "total": row["total"],
            "pending": row["pending"],
            "overdue": row["overdue"],
        }
        for row in rows
    }


def merge_support_hub_stats(
    issue_stats_map: dict[str, dict[str, int]],
    support_stats_map: dict[str, dict[str, int]],
) -> dict[str, dict[str, int]]:
    merged: dict[str, dict[str, int]] = {}
    for pid in set(issue_stats_map) | set(support_stats_map):
        base = issue_stats_map.get(
            pid,
            {"total": 0, "pending": 0, "overdue": 0},
        )
        support = support_stats_map.get(
            pid,
            {"support_open": 0, "support_overdue": 0},
        )
        merged[pid] = {**base, **support}
    return merged


def aggregate_client360_issue_stats(
    issue_queryset,
    today: date,
    *,
    project_ids: Iterable,
    project_board_map: dict[str, str | None] | None = None,
    sla_map: dict[str, int] | None = None,
) -> dict[str, dict[str, int]]:
    """Agrega cards do board + sustentação do hub (aba Sustentação)."""
    from operoz.utils.client_360_support_hub import aggregate_support_hub_stats

    issue_stats = aggregate_issue_stats(issue_queryset, today)
    support_stats = aggregate_support_hub_stats(
        project_ids,
        today,
        project_board_map=project_board_map,
        sla_map=sla_map,
    )
    return merge_support_hub_stats(issue_stats, support_stats)


def aggregate_module_counts(project_ids: list) -> dict[str, int]:
    if not project_ids:
        return {}
    rows = (
        Module.objects.filter(project_id__in=project_ids, archived_at__isnull=True)
        .values("project_id")
        .annotate(modules_total=Count("pk", distinct=True))
    )
    return {str(row["project_id"]): row["modules_total"] for row in rows}


def aggregate_status_reports(
    project_ids: list,
    period: WeekPeriod,
) -> dict[str, dict]:
    """
    project_id -> {
        modules_published, modules_draft_only, has_project_level_published,
        latest_published_at, latest_report_id
    }
    """
    if not project_ids:
        return {}

    reports = BoardStatusReport.objects.filter(
        project_id__in=project_ids,
        period_start=period.start,
        period_end=period.end,
        deleted_at__isnull=True,
    ).values("id", "project_id", "module_id", "published_at")

    by_project: dict[str, dict] = {}
    for row in reports:
        pid = str(row["project_id"])
        bucket = by_project.setdefault(
            pid,
            {
                "published_module_ids": set(),
                "draft_module_ids": set(),
                "has_project_level_published": False,
                "latest_published_at": None,
                "latest_report_id": None,
            },
        )
        is_published = row["published_at"] is not None
        module_id = row["module_id"]

        if is_published:
            published_at = row["published_at"]
            if bucket["latest_published_at"] is None or published_at > bucket["latest_published_at"]:
                bucket["latest_published_at"] = published_at
                bucket["latest_report_id"] = str(row["id"])
            if module_id:
                bucket["published_module_ids"].add(str(module_id))
            else:
                bucket["has_project_level_published"] = True
        elif module_id:
            mid = str(module_id)
            if mid not in bucket["published_module_ids"]:
                bucket["draft_module_ids"].add(mid)

    result: dict[str, dict] = {}
    for pid, bucket in by_project.items():
        published = bucket["published_module_ids"]
        draft_only = bucket["draft_module_ids"] - published
        result[pid] = {
            "modules_published": len(published),
            "modules_draft_only": len(draft_only),
            "has_project_level_published": bucket["has_project_level_published"],
            "latest_published_at": bucket["latest_published_at"],
            "latest_report_id": bucket["latest_report_id"],
        }
    return result


def build_client_row(
    project: Project,
    *,
    period: WeekPeriod,
    modules_total: int,
    issue_stats: dict[str, int] | None,
    report_stats: dict | None,
    board: Board | None = None,
    health_config: tuple[HealthScoreWeights, HealthScoreThresholds] | None = None,
    score_alert_threshold: int | None = None,
) -> dict:
    pid = str(project.id)
    issues = issue_stats or {
        "total": 0,
        "pending": 0,
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
    score_weights = health_config[0] if health_config else None
    score_thresholds = health_config[1] if health_config else None
    effective_alert_threshold = resolve_score_alert_threshold(score_alert_threshold)
    health_result = compute_health_score(
        report_coverage=report_coverage,
        modules_total=modules_total,
        modules_published=modules_published,
        overdue_issues=issues["overdue"],
        support_open=issues["support_open"],
        support_overdue=issues["support_overdue"],
        weights=score_weights,
        thresholds=score_thresholds,
    )

    row = {
        "project_id": pid,
        "name": project.name,
        "identifier": project.identifier,
        "logo_props": project.logo_props,
        "responsible_stakeholder": (project.responsible_stakeholder or "").strip(),
        "project_lead": project_lead_payload(project),
        "issues": {
            "total": issues["total"],
            "pending": issues["pending"],
            "overdue": issues["overdue"],
        },
        "support": {
            "open_count": issues["support_open"],
            "overdue_count": issues["support_overdue"],
        },
        "status_report": {
            "period_start": period.start.isoformat(),
            "period_end": period.end.isoformat(),
            "coverage": report_coverage,
            "modules_total": modules_total,
            "modules_published": modules_published,
            "modules_draft": modules_draft_only,
            "latest_report_id": rs.get("latest_report_id"),
            "latest_published_at": (rs["latest_published_at"].isoformat() if rs.get("latest_published_at") else None),
        },
        "health": health_result.health,
        "health_score": health_result.score,
        "legacy_health": compute_health(
            report_coverage=report_coverage,
            overdue_issues=issues["overdue"],
            support_open=issues["support_open"],
            support_overdue=issues["support_overdue"],
        ),
        "health_breakdown": health_result.as_breakdown_list(),
        "health_dimensions": health_dimensions_from_breakdown(
            health_result.breakdown,
            score_thresholds,
        ),
        "score_alert_threshold": effective_alert_threshold,
        "health_score_alert": is_health_score_alert(
            health_result.score,
            effective_alert_threshold,
        ),
    }
    if board is not None:
        row["board"] = {
            "id": str(board.id),
            "slug": board.slug,
            "name": board.name,
        }
    return row


def build_module_report_rows(
    project_id: str,
    period: WeekPeriod,
    modules: list[Module],
    reports_by_module: dict[str | None, BoardStatusReport],
) -> list[dict]:
    rows = []
    for module in modules:
        report = reports_by_module.get(str(module.id))
        if report:
            status = "published" if report.published_at else "draft"
            report_id = str(report.id)
            published_at = report.published_at.isoformat() if report.published_at else None
        else:
            status = "missing"
            report_id = None
            published_at = None
        rows.append(
            {
                "module_id": str(module.id),
                "module_name": module.name,
                "status": status,
                "report_id": report_id,
                "published_at": published_at,
            }
        )
    project_report = reports_by_module.get(None)
    if project_report:
        rows.insert(
            0,
            {
                "module_id": None,
                "module_name": None,
                "status": "published" if project_report.published_at else "draft",
                "report_id": str(project_report.id),
                "published_at": (project_report.published_at.isoformat() if project_report.published_at else None),
            },
        )
    return rows
