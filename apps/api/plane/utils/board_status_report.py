# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import TYPE_CHECKING

from django.db.models import Count, Q
from django.utils import timezone

from plane.db.models import Issue, Module, Project
from plane.utils.status_report_export import (
    DEFAULT_ETAPAS,
    default_entregas_rows,
    enrich_module_report_sections,
    entrega_date_label,
    project_responsavel_cliente_label,
    user_consultor_label,
)

if TYPE_CHECKING:
    from plane.db.models import Board, User

CLOSED_STATE_GROUPS = ("completed", "cancelled")
CONTENT_SCHEMA_VERSION = 2


def _project_permission_filters(user) -> Q:
    return Q(
        Q(
            project__project_projectmember__role=5,
            project__guest_view_all_features=True,
        )
        | Q(
            project__project_projectmember__role=5,
            project__guest_view_all_features=False,
            created_by=user,
        )
        | Q(project__project_projectmember__role__gt=5),
        project__project_projectmember__member=user,
        project__project_projectmember__is_active=True,
    )


def _board_issues_queryset(workspace_slug: str, board_id: str, user: User):
    return (
        Issue.issue_objects.filter(
            workspace__slug=workspace_slug,
            project__board_id=board_id,
        )
        .filter(_project_permission_filters(user))
        .distinct()
    )


def _project_module_issues_queryset(
    workspace_slug: str, project_id: str, module_id: str, user=None
):
    # Mesmo critério da listagem de issues do módulo (sem filtro extra por autor).
    del user  # compat: callers antigos passavam request.user
    return Issue.issue_objects.filter(
        workspace__slug=workspace_slug,
        project_id=project_id,
        issue_module__module_id=module_id,
        issue_module__deleted_at__isnull=True,
    ).distinct()


def _period_bounds(period_start: date, period_end: date) -> tuple[datetime, datetime]:
    tz = timezone.get_current_timezone()
    start = timezone.make_aware(datetime.combine(period_start, time.min), tz)
    end = timezone.make_aware(datetime.combine(period_end, time.max), tz)
    return start, end


def default_report_title(period_start: date, period_end: date, module_name: str | None = None) -> str:
    if module_name and module_name.strip():
        return module_name.strip()
    return f"Status {period_start.isoformat()} — {period_end.isoformat()}"


def _etapa_sort_index(etapa: str) -> int:
    etapa_norm = (etapa or "").strip().casefold()
    for index, name in enumerate(DEFAULT_ETAPAS):
        if name.casefold() == etapa_norm:
            return index
    return len(DEFAULT_ETAPAS)


def _canonical_etapa_name(raw: str) -> str:
    """Une variações de nome/label à etapa padrão (ex.: «Homologação Externa»)."""
    text = (raw or "").strip()
    if not text:
        return "—"
    norm = text.casefold()
    for default in DEFAULT_ETAPAS:
        if default.casefold() == norm:
            return default
    return text


def _resolve_issue_etapa(issue: Issue) -> str:
    """Etapa do card: título primeiro (evita label Interna em card Externa/Deploy)."""
    name_cf = (issue.name or "").casefold()
    for default in sorted(DEFAULT_ETAPAS, key=len, reverse=True):
        if default.casefold() in name_cf:
            return default

    labels = list(issue.labels.all())
    seen_etapas: set[str] = set()
    for label in labels:
        canon = _canonical_etapa_name(label.name)
        if canon in seen_etapas:
            continue
        seen_etapas.add(canon)
        if _etapa_sort_index(canon) < len(DEFAULT_ETAPAS):
            return canon

    if labels:
        return _canonical_etapa_name(labels[0].name)
    return _canonical_etapa_name(issue.name)


def _merge_entrega_date(current: date | None, incoming: date | None, *, pick_earliest: bool) -> date | None:
    if incoming is None:
        return current
    if current is None:
        return incoming
    return incoming if (incoming < current) == pick_earliest else current


def _children_stats_for_parents(parent_ids: list, project_id) -> dict:
    """Conta sub-itens no projeto inteiro (não só os ligados ao módulo do relatório)."""
    if not parent_ids or not project_id:
        return {}
    return {
        row["parent_id"]: row
        for row in Issue.issue_objects.filter(parent_id__in=parent_ids, project_id=project_id)
        .values("parent_id")
        .annotate(
            total_children=Count("pk", distinct=True),
            completed_children=Count(
                "pk",
                distinct=True,
                filter=Q(state__group="completed"),
            ),
        )
    }


def _issue_work_item_counts(
    issue: Issue, children_stats: dict
) -> tuple[int, int]:
    """Retorna (concluídos, total) de itens de trabalho para um card de cronograma."""
    stats = children_stats.get(issue.id, {})
    total_children = stats.get("total_children") or 0
    completed_children = stats.get("completed_children") or 0
    if total_children > 0:
        return completed_children, total_children

    state_group = issue.state.group if issue.state_id and issue.state else None
    if state_group == "completed":
        return 1, 1
    return 0, 1


def _pct_from_counts(completed: int, total: int) -> int:
    if total <= 0:
        return 0
    return round(completed / total * 100)


def build_entregas_from_module_issues(issue_qs) -> list[dict]:
    """Monta linhas de entregas a partir dos cards de cronograma do módulo."""
    scoped_qs = issue_qs.select_related("state").prefetch_related("labels")
    source_qs = scoped_qs.filter(parent__isnull=True).order_by("sort_order", "created_at")
    if not source_qs.exists():
        source_qs = scoped_qs.order_by("sort_order", "created_at")

    project_id = scoped_qs.values_list("project_id", flat=True).first()
    parent_ids = list(source_qs.values_list("id", flat=True))
    children_stats = _children_stats_for_parents(parent_ids, project_id)

    merged: dict[str, dict] = {}
    for issue in source_qs:
        completed, total = _issue_work_item_counts(issue, children_stats)
        etapa = _resolve_issue_etapa(issue)
        bucket = merged.get(etapa)
        if bucket is None:
            merged[etapa] = {
                "etapa": etapa,
                "completed": completed,
                "total": total,
                "start_date": issue.start_date,
                "target_date": issue.target_date,
            }
            continue

        bucket["completed"] += completed
        bucket["total"] += total
        bucket["start_date"] = _merge_entrega_date(bucket["start_date"], issue.start_date, pick_earliest=True)
        bucket["target_date"] = _merge_entrega_date(bucket["target_date"], issue.target_date, pick_earliest=False)

    rows: list[dict] = []
    for bucket in merged.values():
        pct = _pct_from_counts(bucket["completed"], bucket["total"])
        rows.append(
            {
                "etapa": bucket["etapa"],
                "pct": str(pct),
                "mostrar_pct": True,
                "data_inicio": entrega_date_label(bucket["start_date"]),
                "data_entrega": entrega_date_label(bucket["target_date"]),
            }
        )

    rows.sort(key=lambda row: (_etapa_sort_index(row["etapa"]), row["etapa"].casefold()))
    return rows


def progress_pct_from_entregas(entregas: list[dict]) -> int:
    """Evolução global = média do avanço das etapas do cronograma (0–100)."""
    pcts: list[int] = []
    for row in entregas:
        if row.get("mostrar_pct") is False:
            continue
        try:
            pcts.append(min(100, max(0, int(row.get("pct") or 0))))
        except (TypeError, ValueError):
            pcts.append(0)
    if not pcts:
        return 0
    return round(sum(pcts) / len(pcts))


def apply_live_entregas_from_module(report, content: dict, user: User) -> dict:
    """Atualiza entregas no conteúdo do relatório com dados atuais do módulo."""
    if not report.module_id:
        return content

    workspace_slug = report.workspace.slug if report.workspace_id else None
    if not workspace_slug or not report.project_id:
        return content

    issue_qs = _project_module_issues_queryset(
        workspace_slug,
        str(report.project_id),
        str(report.module_id),
    )
    entregas = build_entregas_from_module_issues(issue_qs)
    sections = content.setdefault("sections", {})
    sections["entregas"] = entregas
    progress = sections.setdefault("progress", {"pct": 0, "omitir_global": False})
    progress["pct"] = progress_pct_from_entregas(entregas)
    return content


def build_status_report_content(
    *,
    board: Board,
    user: User,
    workspace_slug: str,
    period_start: date,
    period_end: date,
) -> dict:
    issue_qs = _board_issues_queryset(workspace_slug, str(board.id), user)
    period_start_dt, period_end_dt = _period_bounds(period_start, period_end)

    projects = (
        Project.objects.filter(
            workspace__slug=workspace_slug,
            board_id=board.id,
            archived_at__isnull=True,
            project_projectmember__member=user,
            project_projectmember__is_active=True,
        )
        .distinct()
        .order_by("name")
    )

    by_project = []
    highlights = []
    total_completed_in_period = 0

    for project in projects:
        project_issues = issue_qs.filter(project_id=project.id)
        total = project_issues.count()
        pending = project_issues.filter(~Q(state__group__in=CLOSED_STATE_GROUPS)).count()
        completed_in_period = project_issues.filter(
            completed_at__gte=period_start_dt,
            completed_at__lte=period_end_dt,
        ).count()
        total_completed_in_period += completed_in_period
        pct = round((completed_in_period / total * 100), 1) if total else 0.0
        by_project.append(
            {
                "project_id": str(project.id),
                "name": project.name,
                "identifier": project.identifier,
                "total_issues": total,
                "pending_issues": pending,
                "completed_in_period": completed_in_period,
                "completion_pct_in_period": pct,
            }
        )

    highlight_issues = (
        issue_qs.filter(
            completed_at__gte=period_start_dt,
            completed_at__lte=period_end_dt,
        )
        .select_related("project", "state")
        .order_by("-completed_at")[:50]
    )
    for issue in highlight_issues:
        highlights.append(
            {
                "id": str(issue.id),
                "name": issue.name,
                "project_id": str(issue.project_id),
                "project_name": issue.project.name if issue.project else "",
                "sequence_id": issue.sequence_id,
                "completed_at": issue.completed_at.isoformat() if issue.completed_at else None,
                "state_name": issue.state.name if issue.state else None,
            }
        )

    today = timezone.now().date()
    pending_qs = issue_qs.filter(~Q(state__group__in=CLOSED_STATE_GROUPS))
    risks = {
        "overdue_count": pending_qs.filter(target_date__lt=today, target_date__isnull=False).count(),
        "without_target_date_count": pending_qs.filter(target_date__isnull=True).count(),
        "blocked_count": 0,
    }

    state_distribution = [
        {"state_group": row["state__group"], "count": row["count"]}
        for row in issue_qs.values("state__group")
        .annotate(count=Count("pk", distinct=True))
        .order_by("state__group")
    ]

    metrics = {
        "total_issues": issue_qs.count(),
        "pending_issues": pending_qs.count(),
        "completed_in_period": total_completed_in_period,
        "overdue_issues": risks["overdue_count"],
        "projects_count": projects.count(),
    }

    prev_start = period_start - (period_end - period_start) - timedelta(days=1)
    prev_end = period_start - timedelta(days=1)
    prev_start_dt, prev_end_dt = _period_bounds(prev_start, prev_end)
    prev_completed = issue_qs.filter(
        completed_at__gte=prev_start_dt,
        completed_at__lte=prev_end_dt,
    ).count()
    metrics["previous_period"] = {
        "period_start": prev_start.isoformat(),
        "period_end": prev_end.isoformat(),
        "completed_in_period": prev_completed,
        "delta_completed": total_completed_in_period - prev_completed,
    }

    return {
        "schema_version": CONTENT_SCHEMA_VERSION,
        "sections": {
            "executive_summary": {"html": ""},
            "metrics": metrics,
            "by_project": by_project,
            "highlights": highlights,
            "risks": risks,
            "state_distribution": state_distribution,
        },
    }


def build_project_module_status_report_content(
    *,
    project: Project,
    module: Module,
    user: User,
    workspace_slug: str,
    period_start: date,
    period_end: date,
) -> dict:
    issue_qs = _project_module_issues_queryset(workspace_slug, str(project.id), str(module.id))
    period_start_dt, period_end_dt = _period_bounds(period_start, period_end)

    total = issue_qs.count()
    pending_qs = issue_qs.filter(~Q(state__group__in=CLOSED_STATE_GROUPS))
    pending = pending_qs.count()
    completed_in_period = issue_qs.filter(
        completed_at__gte=period_start_dt,
        completed_at__lte=period_end_dt,
    ).count()
    pct = round((completed_in_period / total * 100), 1) if total else 0.0

    by_project = [
        {
            "project_id": str(project.id),
            "name": project.name,
            "identifier": project.identifier,
            "total_issues": total,
            "pending_issues": pending,
            "completed_in_period": completed_in_period,
            "completion_pct_in_period": pct,
        }
    ]

    highlights = []
    highlight_issues = (
        issue_qs.filter(
            completed_at__gte=period_start_dt,
            completed_at__lte=period_end_dt,
        )
        .select_related("project", "state")
        .order_by("-completed_at")[:50]
    )
    for issue in highlight_issues:
        highlights.append(
            {
                "id": str(issue.id),
                "name": issue.name,
                "project_id": str(issue.project_id),
                "project_name": project.name,
                "sequence_id": issue.sequence_id,
                "completed_at": issue.completed_at.isoformat() if issue.completed_at else None,
                "state_name": issue.state.name if issue.state else None,
            }
        )

    today = timezone.now().date()
    risks = {
        "overdue_count": pending_qs.filter(target_date__lt=today, target_date__isnull=False).count(),
        "without_target_date_count": pending_qs.filter(target_date__isnull=True).count(),
        "blocked_count": 0,
    }

    state_distribution = [
        {"state_group": row["state__group"], "count": row["count"]}
        for row in issue_qs.values("state__group")
        .annotate(count=Count("pk", distinct=True))
        .order_by("state__group")
    ]

    metrics = {
        "total_issues": total,
        "pending_issues": pending,
        "completed_in_period": completed_in_period,
        "overdue_issues": risks["overdue_count"],
        "projects_count": 1,
    }

    prev_start = period_start - (period_end - period_start) - timedelta(days=1)
    prev_end = period_start - timedelta(days=1)
    prev_start_dt, prev_end_dt = _period_bounds(prev_start, prev_end)
    prev_completed = issue_qs.filter(
        completed_at__gte=prev_start_dt,
        completed_at__lte=prev_end_dt,
    ).count()
    metrics["previous_period"] = {
        "period_start": prev_start.isoformat(),
        "period_end": prev_end.isoformat(),
        "completed_in_period": prev_completed,
        "delta_completed": completed_in_period - prev_completed,
    }

    consultor_name = user_consultor_label(user)
    responsavel_cliente = project_responsavel_cliente_label(project)
    entregas = build_entregas_from_module_issues(issue_qs)
    if not entregas:
        entregas = default_entregas_rows()

    sections = {
        "module": {
            "id": str(module.id),
            "name": module.name,
            "start_date": module.start_date.isoformat() if module.start_date else None,
            "target_date": module.target_date.isoformat() if module.target_date else None,
        },
        "executive_summary": {"html": ""},
        "metrics": metrics,
        "by_project": by_project,
        "highlights": highlights,
        "risks": risks,
        "state_distribution": state_distribution,
        "entregas": entregas,
    }
    enrich_module_report_sections(
        sections=sections,
        module_name=module.name,
        project_name=project.name,
        module_start=module.start_date,
        module_target=module.target_date,
        consultor_name=consultor_name,
        responsavel_cliente=responsavel_cliente,
        metrics=metrics,
    )

    return {"schema_version": CONTENT_SCHEMA_VERSION, "sections": sections}


def content_to_markdown(
    *,
    board_name: str | None = None,
    project_name: str | None = None,
    module_name: str | None = None,
    title: str,
    period_start: date,
    period_end: date,
    content: dict,
) -> str:
    sections = content.get("sections") or {}
    metrics = sections.get("metrics") or {}
    lines = [f"# {title}", ""]
    if project_name:
        lines.append(f"**Projeto:** {project_name}")
    if module_name:
        lines.append(f"**Módulo:** {module_name}")
    if board_name:
        lines.append(f"**Board:** {board_name}")
    lines.extend([f"**Período:** {period_start.isoformat()} — {period_end.isoformat()}", ""])

    summary = (sections.get("executive_summary") or {}).get("html") or ""
    if summary.strip():
        lines.extend(["## Resumo executivo", "", summary.strip(), ""])

    lines.extend(
        [
            "## Métricas",
            "",
            f"- Total de cards: {metrics.get('total_issues', 0)}",
            f"- Em aberto: {metrics.get('pending_issues', 0)}",
            f"- Concluídos no período: {metrics.get('completed_in_period', 0)}",
            f"- Atrasados: {metrics.get('overdue_issues', 0)}",
            f"- Projetos: {metrics.get('projects_count', 0)}",
            "",
        ]
    )

    prev = metrics.get("previous_period") or {}
    if prev:
        lines.append(
            f"- Vs período anterior ({prev.get('period_start')} — {prev.get('period_end')}): "
            f"{prev.get('delta_completed', 0):+d} concluídos"
        )
        lines.append("")

    by_project = sections.get("by_project") or []
    if by_project:
        lines.extend(["## Por projeto", ""])
        for row in by_project:
            lines.append(
                f"- **{row.get('name')}** ({row.get('identifier', '')}): "
                f"{row.get('completed_in_period', 0)} concluídos / {row.get('total_issues', 0)} total "
                f"({row.get('completion_pct_in_period', 0)}%)"
            )
        lines.append("")

    highlights = sections.get("highlights") or []
    if highlights:
        lines.extend(["## Destaques / entregas", ""])
        for item in highlights[:30]:
            lines.append(f"- {item.get('name')} ({item.get('project_name', '')})")
        lines.append("")

    risks = sections.get("risks") or {}
    lines.extend(
        [
            "## Riscos e bloqueios",
            "",
            f"- Atrasados: {risks.get('overdue_count', 0)}",
            f"- Sem data alvo: {risks.get('without_target_date_count', 0)}",
            "",
        ]
    )

    dist = sections.get("state_distribution") or []
    if dist:
        lines.extend(["## Distribuição por estado", ""])
        for row in dist:
            lines.append(f"- {row.get('state_group')}: {row.get('count', 0)}")
        lines.append("")

    return "\n".join(lines).strip() + "\n"
