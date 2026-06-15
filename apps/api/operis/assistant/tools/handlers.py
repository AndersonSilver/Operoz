from __future__ import annotations

from typing import Any

from django.db.models import Q
from django.utils import timezone

from operis.assistant.page_content import build_page_indexable_text
from operis.assistant.retrieval import hybrid_retrieve, is_rag_enabled
from operis.assistant.security.access import (
    accessible_projects,
    can_access_board,
    can_access_page,
    filter_accessible_issues,
    get_accessible_issue,
    get_board,
    is_project_member,
    truncate_text,
)
from operis.automation.analytics import build_board_automation_analytics
from operis.db.models import BoardAutomationRun, IntakeIssue
from operis.db.models.intake import IntakeIssueStatus
from operis.assistant.tools.registry import register_tool
from operis.assistant.types import AssistantActorContext, ToolResult
from operis.db.models import Page, PageReviewComment, PageReviewSession, ProjectPage
from operis.utils.client_360 import (
    aggregate_issue_stats,
    aggregate_module_counts,
    aggregate_status_reports,
    build_client_row,
    parse_week_period,
)
from operis.utils.client_360_health_settings import (
    load_board_health_config_map,
    load_board_score_alert_threshold_map,
)
from operis.utils.client_360_display import (
    HEALTH_SCORE_RAG_MAPPING,
    LEGACY_HEALTH_DEPRECATION,
    client_360_display_payload,
)
from operis.utils.client_360_finops import (
    apply_finops_enrichment,
    load_finops_profiles,
    load_finops_settings,
    month_start,
)
from operis.utils.client_360_intelligence import build_suggested_actions, retrieve_client_360_history
from operis.utils.client_360_operational import apply_operational_enrichment
from operis.utils.issue_search import search_issues


def _clamp_limit(value: Any, default: int = 10, maximum: int = 20) -> int:
    try:
        n = int(value)
    except (TypeError, ValueError):
        return default
    return max(1, min(n, maximum))


def _first_assignee_name(issue) -> str | None:
    row = issue.issue_assignee.filter(deleted_at__isnull=True).select_related("assignee").first()
    if row and row.assignee:
        return row.assignee.display_name
    return None


def _issue_citation(issue, *, include_assignee: bool = False) -> dict[str, Any]:
    citation: dict[str, Any] = {
        "type": "issue",
        "id": str(issue.id),
        "label": f"{issue.project.identifier}-{issue.sequence_id} {issue.name}",
        "work_item": f"{issue.project.identifier}-{issue.sequence_id}",
        "project_id": str(issue.project_id),
        "state": issue.state.name if issue.state else None,
        "priority": issue.priority,
    }
    if include_assignee:
        assignee_name = _first_assignee_name(issue)
        if assignee_name:
            citation["assignee"] = assignee_name
    return citation


def _issue_payload(issue) -> dict[str, Any]:
    return {
        "id": str(issue.id),
        "name": issue.name,
        "sequence_id": issue.sequence_id,
        "project_id": str(issue.project_id),
        "project_identifier": issue.project.identifier,
        "state": issue.state.name if issue.state else None,
        "priority": issue.priority,
        "target_date": str(issue.target_date) if issue.target_date else None,
        "description": truncate_text(issue.description_stripped or "", 2000),
    }


def handle_search_issues(ctx: AssistantActorContext, args: dict[str, Any]) -> ToolResult:
    query = (args.get("query") or "").strip()
    if not query:
        return ToolResult(ok=False, error="query_required")

    project_id = args.get("project_id")
    limit = _clamp_limit(args.get("limit"))

    qs = filter_accessible_issues(ctx, str(project_id) if project_id else None)
    qs = search_issues(query, qs)[:limit]

    issues = list(qs.select_related("state", "project"))
    citations = [_issue_citation(i) for i in issues]
    return ToolResult(
        ok=True,
        data={"issues": [_issue_payload(i) for i in issues], "count": len(issues)},
        citations=citations,
    )


def handle_get_issue(ctx: AssistantActorContext, args: dict[str, Any]) -> ToolResult:
    issue_id = args.get("issue_id")
    if not issue_id:
        return ToolResult(ok=False, error="issue_id_required")

    issue = get_accessible_issue(ctx, str(issue_id))
    if not issue:
        return ToolResult(ok=False, error="issue_not_found_or_forbidden")

    citation = _issue_citation(issue, include_assignee=True)
    return ToolResult(ok=True, data={"issue": _issue_payload(issue)}, citations=[citation])


def handle_get_client_360_summary(ctx: AssistantActorContext, args: dict[str, Any]) -> ToolResult:
    board_slug = args.get("board_slug") or ctx.board_slug
    if not board_slug:
        return ToolResult(ok=False, error="board_slug_required")

    board = get_board(ctx, str(board_slug))
    if not board:
        return ToolResult(ok=False, error="board_not_found")

    projects = list(accessible_projects(ctx, str(board_slug)))
    project_id = args.get("project_id")

    if project_id:
        projects = [p for p in projects if str(p.id) == str(project_id)]
        if not projects:
            return ToolResult(ok=False, error="project_not_found_or_forbidden")

    today = timezone.now().date()
    period = parse_week_period(None, None)
    project_ids = [p.id for p in projects]

    issues_qs = filter_accessible_issues(ctx).filter(project_id__in=project_ids, project__board_id=board.id)
    issue_stats_map = aggregate_issue_stats(issues_qs, today)
    module_counts = aggregate_module_counts(project_ids)
    report_stats_map = aggregate_status_reports(project_ids, period)
    health_config_map = load_board_health_config_map([board.id])
    alert_threshold_map = load_board_score_alert_threshold_map([board.id])

    rows: list[dict[str, Any]] = []
    citations: list[dict[str, Any]] = []
    for project in projects:
        pid = str(project.id)
        row = build_client_row(
            project,
            period=period,
            modules_total=module_counts.get(pid, 0),
            issue_stats=issue_stats_map.get(pid),
            report_stats=report_stats_map.get(pid),
            health_config=health_config_map.get(str(board.id)),
            score_alert_threshold=alert_threshold_map.get(str(board.id)),
        )
        rows.append(row)
        citations.append({"type": "project", "id": pid, "label": project.name})

    project_board_map = {str(p.id): str(p.board_id) if p.board_id else None for p in projects}
    apply_operational_enrichment(
        rows,
        issue_queryset=issues_qs,
        period=period,
        today=today,
        board_ids=[board.id],
        project_board_map=project_board_map,
    )
    finops_settings = load_finops_settings(ctx.workspace.id)
    finops_profiles = load_finops_profiles(project_ids, month_start(today))
    apply_finops_enrichment(rows, profiles=finops_profiles, settings=finops_settings)
    for row in rows:
        row["suggested_actions"] = build_suggested_actions(row, workspace_slug=ctx.workspace.slug)[:3]

    return ToolResult(
        ok=True,
        data={
            "board_slug": board_slug,
            "board_name": board.name,
            "period": {"start": str(period.start), "end": str(period.end)},
            "display": client_360_display_payload(ctx.workspace),
            "health_fields": {
                "health": "RAG from score (board thresholds)",
                "health_score": "0-100 numeric score",
                "legacy_health": f"deprecated MVP semáforo — removal target {LEGACY_HEALTH_DEPRECATION}",
                "mapping": HEALTH_SCORE_RAG_MAPPING,
            },
            "finops_enabled": True,
            "operational_enabled": True,
            "clients": rows,
            "count": len(rows),
        },
        citations=citations,
    )


def handle_retrieve_client_360_history(ctx: AssistantActorContext, args: dict[str, Any]) -> ToolResult:
    project_id = args.get("project_id") or ctx.project_id
    if not project_id:
        return ToolResult(ok=False, error="project_id_required")

    board_slug = args.get("board_slug") or ctx.board_slug
    if not board_slug:
        return ToolResult(ok=False, error="board_slug_required")

    board = get_board(ctx, str(board_slug))
    if not board:
        return ToolResult(ok=False, error="board_not_found")

    projects = list(accessible_projects(ctx, str(board_slug)))
    if not any(str(p.id) == str(project_id) for p in projects):
        return ToolResult(ok=False, error="project_not_found_or_forbidden")

    weeks = _clamp_limit(args.get("weeks"), default=8, maximum=52)
    payload = retrieve_client_360_history(project_id=project_id, weeks=weeks)
    return ToolResult(
        ok=True,
        data={"project_id": str(project_id), **payload},
        citations=[{"type": "project", "id": str(project_id), "label": "Cliente 360 histórico"}],
    )


def handle_search_pages(ctx: AssistantActorContext, args: dict[str, Any]) -> ToolResult:
    query = (args.get("query") or "").strip()
    if not query:
        return ToolResult(ok=False, error="query_required")

    project_id = args.get("project_id")
    limit = _clamp_limit(args.get("limit"))

    pp_qs = ProjectPage.objects.filter(
        project__workspace_id=ctx.workspace.id,
        project__project_projectmember__member=ctx.user,
        project__project_projectmember__is_active=True,
    ).filter(
        Q(page__name__icontains=query)
        | Q(page__description_stripped__icontains=query)
        | Q(page__description_html__icontains=query),
    ).select_related("page", "project")
    if project_id:
        pp_qs = pp_qs.filter(project_id=project_id)
    elif ctx.project_id:
        pp_qs = pp_qs.filter(project_id=ctx.project_id)

    pages_out: list[dict[str, Any]] = []
    citations: list[dict[str, Any]] = []
    seen: set[str] = set()

    for pp in pp_qs[: limit * 2]:
        page = pp.page
        pid = str(pp.project_id)
        key = f"{page.id}:{pid}"
        if key in seen:
            continue
        if not can_access_page(ctx, page, pid):
            continue
        seen.add(key)
        pages_out.append(
            {
                "id": str(page.id),
                "name": page.name,
                "project_id": pid,
                "project_name": pp.project.name,
            }
        )
        citations.append(
            {
                "type": "page",
                "id": str(page.id),
                "label": page.name,
                "project_id": pid,
            }
        )
        if len(pages_out) >= limit:
            break

    return ToolResult(ok=True, data={"pages": pages_out, "count": len(pages_out)}, citations=citations)


def handle_search_documentation(ctx: AssistantActorContext, args: dict[str, Any]) -> ToolResult:
    """Busca semântica em documentação indexada (páginas, cards, comentários)."""
    query = (args.get("query") or "").strip()
    if not query:
        return ToolResult(ok=False, error="query_required")
    if not is_rag_enabled():
        return ToolResult(ok=False, error="rag_disabled")

    limit = _clamp_limit(args.get("limit"), default=5, maximum=10)
    chunks = hybrid_retrieve(ctx, query, top_k=limit)
    if not chunks:
        return ToolResult(
            ok=True,
            data={
                "snippets": [],
                "count": 0,
                "hint": "Nenhum trecho indexado. Peça ao admin para rodar reindex_assistant nas páginas do projeto.",
            },
            citations=[],
        )

    snippets: list[dict[str, Any]] = []
    citations: list[dict[str, Any]] = []
    for chunk in chunks:
        snippets.append(
            {
                "content": chunk.content,
                "entity_type": chunk.entity_type,
                "entity_id": chunk.entity_id,
                "score": round(chunk.combined_score, 4),
                "metadata": chunk.metadata,
            }
        )
        if chunk.citation:
            citations.append(chunk.citation)

    return ToolResult(ok=True, data={"snippets": snippets, "count": len(snippets)}, citations=citations)


def handle_get_page_content(ctx: AssistantActorContext, args: dict[str, Any]) -> ToolResult:
    page_id = args.get("page_id")
    project_id = args.get("project_id")
    if not page_id or not project_id:
        return ToolResult(ok=False, error="page_id_and_project_id_required")

    page = Page.objects.filter(pk=page_id, workspace_id=ctx.workspace.id).first()
    if not page or not can_access_page(ctx, page, str(project_id)):
        return ToolResult(ok=False, error="page_not_found_or_forbidden")

    citation = {
        "type": "page",
        "id": str(page.id),
        "label": page.name,
        "project_id": str(project_id),
    }
    return ToolResult(
        ok=True,
        data={
            "page": {
                "id": str(page.id),
                "name": page.name,
                "project_id": str(project_id),
                "content": truncate_text(build_page_indexable_text(page), 8000),
            }
        },
        citations=[citation],
    )


def handle_get_prd_review_summary(ctx: AssistantActorContext, args: dict[str, Any]) -> ToolResult:
    session_id = (args.get("session_id") or "").strip()
    page_id = (args.get("page_id") or "").strip()
    project_id = (args.get("project_id") or ctx.project_id or "").strip()

    qs = PageReviewSession.objects.filter(workspace_id=ctx.workspace.id).select_related("page", "project")
    if session_id:
        qs = qs.filter(pk=session_id)
    elif page_id and project_id:
        if not is_project_member(ctx, project_id):
            return ToolResult(ok=False, error="project_not_found_or_forbidden")
        qs = qs.filter(page_id=page_id, project_id=project_id).order_by("-created_at")
    else:
        return ToolResult(ok=False, error="session_id_or_page_project_required")

    session = qs.order_by("-created_at").first() if not session_id else qs.first()
    if not session:
        return ToolResult(ok=False, error="review_session_not_found")

    pid = str(session.project_id)
    if not is_project_member(ctx, pid):
        return ToolResult(ok=False, error="review_session_not_found")

    page = session.page
    if page and not can_access_page(ctx, page, pid):
        return ToolResult(ok=False, error="review_session_not_found")

    comments = list(
        PageReviewComment.objects.filter(session=session).order_by("created_at")
    )
    summary_items: list[dict[str, Any]] = []
    citations: list[dict[str, Any]] = []
    for comment in comments:
        item = {
            "type": comment.comment_type,
            "section_id": comment.section_id,
            "quote": truncate_text(comment.quote, 500) if comment.quote else "",
            "body": comment.body,
            "author_email": comment.author_email,
        }
        summary_items.append(item)
        citations.append(
            {
                "type": "prd_review_comment",
                "id": str(comment.id),
                "label": f"{comment.section_id}: {truncate_text(comment.body, 80)}",
                "session_id": str(session.id),
                "page_id": str(session.page_id),
                "project_id": pid,
            }
        )

    page_name = page.name if page else "PRD"
    return ToolResult(
        ok=True,
        data={
            "session_id": str(session.id),
            "page_id": str(session.page_id),
            "page_name": page_name,
            "project_id": pid,
            "status": session.status,
            "resolved_at": session.resolved_at.isoformat() if session.resolved_at else None,
            "comment_count": len(comments),
            "comments": summary_items,
            "summary": (
                f"PRD «{page_name}» — status {session.status} com {len(comments)} comentário(s) do cliente."
                if comments
                else f"PRD «{page_name}» — status {session.status}, sem comentários."
            ),
        },
        citations=citations,
    )


def _automation_run_citation(run: BoardAutomationRun, board_slug: str) -> dict[str, Any]:
    return {
        "type": "automation_run",
        "id": str(run.id),
        "label": f"{run.rule.name if run.rule_id else 'Regra'} — {run.status}",
        "run_id": str(run.id),
        "board_slug": board_slug,
        "rule_id": str(run.rule_id) if run.rule_id else None,
    }


def handle_get_automation_metrics(ctx: AssistantActorContext, args: dict[str, Any]) -> ToolResult:
    board_slug = args.get("board_slug") or ctx.board_slug
    if not board_slug:
        return ToolResult(ok=False, error="board_slug_required")
    if not can_access_board(ctx, str(board_slug)):
        return ToolResult(ok=False, error="board_not_found_or_forbidden")

    board = get_board(ctx, str(board_slug))
    if not board:
        return ToolResult(ok=False, error="board_not_found")

    days = _clamp_limit(args.get("days"), default=7, maximum=30)
    analytics = build_board_automation_analytics(board, days=days)
    citations = [
        _automation_run_citation(run, board_slug)
        for run in BoardAutomationRun.objects.filter(
            board=board,
            deleted_at__isnull=True,
            dry_run=False,
            status=BoardAutomationRun.STATUS_FAILED,
        ).select_related("rule")[:5]
    ]
    return ToolResult(
        ok=True,
        data={
            "board_slug": board_slug,
            "board_name": board.name,
            "analytics": analytics,
        },
        citations=citations,
    )


def handle_get_automation_run(ctx: AssistantActorContext, args: dict[str, Any]) -> ToolResult:
    run_id = args.get("run_id")
    board_slug = args.get("board_slug") or ctx.board_slug
    if not run_id:
        return ToolResult(ok=False, error="run_id_required")
    if not board_slug:
        return ToolResult(ok=False, error="board_slug_required")
    if not can_access_board(ctx, str(board_slug)):
        return ToolResult(ok=False, error="board_not_found_or_forbidden")

    run = (
        BoardAutomationRun.objects.filter(
            pk=run_id,
            board__workspace_id=ctx.workspace.id,
            board__slug=board_slug,
            deleted_at__isnull=True,
        )
        .select_related("rule", "board")
        .first()
    )
    if not run:
        return ToolResult(ok=False, error="run_not_found")

    citation = _automation_run_citation(run, board_slug)
    return ToolResult(
        ok=True,
        data={
            "run": {
                "id": str(run.id),
                "rule_id": str(run.rule_id),
                "rule_name": run.rule.name if run.rule_id else None,
                "board_slug": board_slug,
                "event_type": run.event_type,
                "status": run.status,
                "dry_run": run.dry_run,
                "step_logs": run.step_logs,
                "error_message": run.error_message,
                "started_at": run.started_at.isoformat() if run.started_at else None,
                "finished_at": run.finished_at.isoformat() if run.finished_at else None,
                "created_at": run.created_at.isoformat() if run.created_at else None,
            }
        },
        citations=[citation],
    )


def handle_list_intake_pending(ctx: AssistantActorContext, args: dict[str, Any]) -> ToolResult:
    board_slug = args.get("board_slug") or ctx.board_slug
    project_id = args.get("project_id")
    limit = _clamp_limit(args.get("limit"), default=10, maximum=20)

    project_ids = list(accessible_projects(ctx, str(board_slug) if board_slug else None).values_list("id", flat=True))
    if project_id:
        if str(project_id) not in {str(pid) for pid in project_ids}:
            return ToolResult(ok=False, error="project_not_found_or_forbidden")
        project_ids = [project_id]

    if not project_ids:
        return ToolResult(ok=True, data={"items": [], "count": 0}, citations=[])

    rows = (
        IntakeIssue.objects.filter(
            project_id__in=project_ids,
            status=IntakeIssueStatus.PENDING,
            deleted_at__isnull=True,
        )
        .select_related("issue", "intake", "project")
        .order_by("-created_at")[:limit]
    )

    items: list[dict[str, Any]] = []
    citations: list[dict[str, Any]] = []
    for row in rows:
        issue = row.issue
        items.append(
            {
                "intake_issue_id": str(row.id),
                "intake_name": row.intake.name if row.intake_id else None,
                "project_id": str(row.project_id),
                "project_name": row.project.name,
                "issue_id": str(issue.id),
                "issue_name": issue.name,
                "source": row.source,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
        )
        citations.append(
            {
                "type": "issue",
                "id": str(issue.id),
                "label": f"{row.project.identifier}-{issue.sequence_id} {issue.name}",
                "work_item": f"{row.project.identifier}-{issue.sequence_id}",
                "project_id": str(row.project_id),
            }
        )

    return ToolResult(ok=True, data={"items": items, "count": len(items)}, citations=citations)


def handle_get_project_stats(ctx: AssistantActorContext, args: dict[str, Any]) -> ToolResult:
    board_slug = args.get("board_slug") or ctx.board_slug
    project_id = args.get("project_id")

    projects = accessible_projects(ctx, str(board_slug) if board_slug else None)
    if project_id:
        projects = projects.filter(id=project_id)
        if not projects.exists():
            return ToolResult(ok=False, error="project_not_found_or_forbidden")

    stats: list[dict[str, Any]] = []
    citations: list[dict[str, Any]] = []
    for project in projects:
        pid = str(project.id)
        issues_qs = filter_accessible_issues(ctx, pid)
        total_issues = issues_qs.count()
        completed_issues = issues_qs.filter(state__group__in=["completed", "cancelled"]).count()
        stats.append(
            {
                "project_id": pid,
                "name": project.name,
                "identifier": project.identifier,
                "total_issues": total_issues,
                "completed_issues": completed_issues,
                "open_issues": max(0, total_issues - completed_issues),
            }
        )
        citations.append({"type": "project", "id": pid, "label": project.name})

    return ToolResult(ok=True, data={"projects": stats, "count": len(stats)}, citations=citations)


def handle_list_board_projects(ctx: AssistantActorContext, args: dict[str, Any]) -> ToolResult:
    board_slug = args.get("board_slug") or ctx.board_slug
    if not board_slug:
        return ToolResult(ok=False, error="board_slug_required")
    if not can_access_board(ctx, str(board_slug)):
        return ToolResult(ok=False, error="board_not_found_or_forbidden")

    board = get_board(ctx, str(board_slug))
    if not board:
        return ToolResult(ok=False, error="board_not_found")

    limit = _clamp_limit(args.get("limit"), default=20, maximum=50)
    projects = list(accessible_projects(ctx, str(board_slug))[:limit])
    payload = [
        {
            "id": str(p.id),
            "name": p.name,
            "identifier": p.identifier,
            "board_slug": board_slug,
        }
        for p in projects
    ]
    citations = [{"type": "project", "id": str(p.id), "label": p.name} for p in projects]
    return ToolResult(
        ok=True,
        data={"board_slug": board_slug, "board_name": board.name, "projects": payload, "count": len(payload)},
        citations=citations,
    )


def register_all_tools() -> None:
    register_tool(
        "search_issues",
        description="Busca cards/issues no workspace com base em texto ou número.",
        parameters={
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Texto de busca"},
                "project_id": {"type": "string", "description": "UUID do projeto (opcional)"},
                "limit": {"type": "integer", "description": "Máximo de resultados (1-20)"},
            },
            "required": ["query"],
        },
        handler=handle_search_issues,
    )
    register_tool(
        "get_issue",
        description="Obtém detalhes de um card/issue por UUID.",
        parameters={
            "type": "object",
            "properties": {
                "issue_id": {"type": "string", "description": "UUID do issue"},
            },
            "required": ["issue_id"],
        },
        handler=handle_get_issue,
    )
    register_tool(
        "get_client_360_summary",
        description="Resumo Cliente 360 do board: saúde, atrasados, sustentação, status reports.",
        parameters={
            "type": "object",
            "properties": {
                "board_slug": {"type": "string", "description": "Slug do board"},
                "project_id": {"type": "string", "description": "UUID do cliente/projeto (opcional)"},
            },
            "required": [],
        },
        handler=handle_get_client_360_summary,
    )
    register_tool(
        "retrieve_client_360_history",
        description="Histórico semanal de saúde Cliente 360 (snapshots) para um projeto.",
        parameters={
            "type": "object",
            "properties": {
                "board_slug": {"type": "string", "description": "Slug do board"},
                "project_id": {"type": "string", "description": "UUID do cliente/projeto"},
                "weeks": {"type": "integer", "description": "Semanas de histórico (1-52)"},
            },
            "required": ["project_id"],
        },
        handler=handle_retrieve_client_360_history,
    )
    register_tool(
        "search_pages",
        description="Busca páginas de documentação por título ou conteúdo (texto).",
        parameters={
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "project_id": {"type": "string"},
                "limit": {"type": "integer"},
            },
            "required": ["query"],
        },
        handler=handle_search_pages,
    )
    register_tool(
        "search_documentation",
        description=(
            "Busca semântica em documentação indexada do workspace (páginas, cards, comentários). "
            "Use para perguntas sobre processos, APIs, regras de negócio e conteúdo de páginas do projeto."
        ),
        parameters={
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Pergunta ou termos de busca"},
                "limit": {"type": "integer", "description": "Máximo de trechos (1-10)"},
            },
            "required": ["query"],
        },
        handler=handle_search_documentation,
    )
    register_tool(
        "get_page_content",
        description="Conteúdo textual de uma página de documentação.",
        parameters={
            "type": "object",
            "properties": {
                "page_id": {"type": "string"},
                "project_id": {"type": "string"},
            },
            "required": ["page_id", "project_id"],
        },
        handler=handle_get_page_content,
    )
    register_tool(
        "get_prd_review_summary",
        description="Resumo do feedback do cliente numa sessão PRD Review (comentários por seção/trecho).",
        parameters={
            "type": "object",
            "properties": {
                "session_id": {"type": "string", "description": "UUID da sessão de review"},
                "page_id": {"type": "string", "description": "UUID da página (usa última sessão)"},
                "project_id": {"type": "string", "description": "UUID do projeto (com page_id)"},
            },
            "required": [],
        },
        handler=handle_get_prd_review_summary,
    )
    register_tool(
        "get_automation_metrics",
        description="Métricas e analytics de automação do board (sucesso, falhas, timeline).",
        parameters={
            "type": "object",
            "properties": {
                "board_slug": {"type": "string"},
                "days": {"type": "integer", "description": "Período em dias (1-30)"},
            },
            "required": [],
        },
        handler=handle_get_automation_metrics,
    )
    register_tool(
        "get_automation_run",
        description="Detalhe de uma execução de automação com step_logs JSON.",
        parameters={
            "type": "object",
            "properties": {
                "run_id": {"type": "string"},
                "board_slug": {"type": "string"},
            },
            "required": ["run_id"],
        },
        handler=handle_get_automation_run,
    )
    register_tool(
        "list_intake_pending",
        description="Lista itens pendentes na recepção/intake do workspace ou board.",
        parameters={
            "type": "object",
            "properties": {
                "board_slug": {"type": "string"},
                "project_id": {"type": "string"},
                "limit": {"type": "integer"},
            },
            "required": [],
        },
        handler=handle_list_intake_pending,
    )
    register_tool(
        "get_project_stats",
        description="Estatísticas de issues por projeto (total, concluídos, abertos).",
        parameters={
            "type": "object",
            "properties": {
                "board_slug": {"type": "string"},
                "project_id": {"type": "string"},
            },
            "required": [],
        },
        handler=handle_get_project_stats,
    )
    register_tool(
        "list_board_projects",
        description="Lista projetos/clientes de um board para navegação assistida.",
        parameters={
            "type": "object",
            "properties": {
                "board_slug": {"type": "string"},
                "limit": {"type": "integer"},
            },
            "required": [],
        },
        handler=handle_list_board_projects,
    )
    register_tool(
        "propose_automation_rule",
        description="Gera um grafo de automação a partir de linguagem natural; valida e opcionalmente faz dry-run.",
        parameters={
            "type": "object",
            "properties": {
                "description": {"type": "string", "description": "O que a regra deve fazer"},
                "board_slug": {"type": "string"},
                "dry_run": {"type": "boolean", "default": True},
            },
            "required": ["description"],
        },
        handler=handle_propose_automation_rule,
    )
    register_tool(
        "explain_automation_run",
        description="Explica em linguagem natural os passos de uma execução de automação.",
        parameters={
            "type": "object",
            "properties": {
                "run_id": {"type": "string", "description": "UUID do run (opcional se rule_name informado)"},
                "rule_name": {"type": "string", "description": "Nome parcial da regra para localizar o run mais recente"},
                "board_slug": {"type": "string"},
            },
            "required": [],
        },
        handler=handle_explain_automation_run,
    )
    register_tool(
        "list_automation_packs",
        description="Lista packs oficiais de automação disponíveis e os já instalados no board.",
        parameters={
            "type": "object",
            "properties": {
                "board_slug": {"type": "string"},
            },
            "required": [],
        },
        handler=handle_list_automation_packs,
    )
    register_tool(
        "propose_automation_pack_install",
        description="Propõe instalação de um pack no board; o usuário confirma no chat.",
        parameters={
            "type": "object",
            "properties": {
                "pack_name": {"type": "string"},
                "board_slug": {"type": "string"},
            },
            "required": ["pack_name"],
        },
        handler=handle_propose_automation_pack_install,
    )
    register_tool(
        "propose_issue_comment",
        description="Propõe adicionar comentário em um card; o usuário confirma no chat antes de publicar.",
        parameters={
            "type": "object",
            "properties": {
                "issue_id": {"type": "string"},
                "comment": {"type": "string"},
            },
            "required": ["issue_id", "comment"],
        },
        handler=handle_propose_issue_comment,
    )
    register_tool(
        "propose_issue_state_change",
        description="Propõe mudança de estado de um card; o usuário confirma no chat.",
        parameters={
            "type": "object",
            "properties": {
                "issue_id": {"type": "string"},
                "state_id": {"type": "string"},
            },
            "required": ["issue_id", "state_id"],
        },
        handler=handle_propose_issue_state_change,
    )


def handle_propose_automation_rule(ctx: AssistantActorContext, args: dict[str, Any]) -> ToolResult:
    from operis.assistant.automation_intelligence import propose_automation_rule_from_nl

    board_slug = args.get("board_slug") or ctx.board_slug
    description = str(args.get("description") or "").strip()
    if not description:
        return ToolResult(ok=False, error="description_required")
    if not board_slug:
        return ToolResult(ok=False, error="board_slug_required")
    if not can_access_board(ctx, str(board_slug)):
        return ToolResult(ok=False, error="board_not_found_or_forbidden")

    board = get_board(ctx, str(board_slug))
    if not board:
        return ToolResult(ok=False, error="board_not_found")

    payload = propose_automation_rule_from_nl(
        board=board,
        description=description,
        actor=ctx.user,
        run_dry_run=bool(args.get("dry_run", True)),
    )
    if not payload.get("ok", True) and payload.get("error"):
        return ToolResult(ok=False, error=str(payload["error"]), data=payload)

    return ToolResult(
        ok=bool(payload.get("validation", {}).get("valid", payload.get("ok", False))),
        data={
            **payload,
            "automation_proposal": {
                "name": payload.get("name"),
                "description": payload.get("description"),
                "graph": payload.get("graph"),
                "board_slug": board_slug,
                "validation": payload.get("validation"),
                "dry_run": payload.get("dry_run"),
            },
        },
    )


def handle_explain_automation_run(ctx: AssistantActorContext, args: dict[str, Any]) -> ToolResult:
    from operis.assistant.automation_intelligence import (
        explain_automation_run_steps,
        find_automation_run_for_explanation,
    )

    run_id = args.get("run_id")
    rule_name = args.get("rule_name")
    board_slug = args.get("board_slug") or ctx.board_slug
    if not run_id and not rule_name:
        return ToolResult(ok=False, error="run_id_or_rule_name_required")
    if not board_slug:
        return ToolResult(ok=False, error="board_slug_required")
    if not can_access_board(ctx, str(board_slug)):
        return ToolResult(ok=False, error="board_not_found_or_forbidden")

    board = get_board(ctx, str(board_slug))
    if not board:
        return ToolResult(ok=False, error="board_not_found")

    run = find_automation_run_for_explanation(
        board=board,
        run_id=str(run_id) if run_id else None,
        rule_name=str(rule_name) if rule_name else None,
    )
    if not run:
        return ToolResult(ok=False, error="run_not_found")

    explained = explain_automation_run_steps(run=run)
    if not explained.get("ok"):
        return ToolResult(ok=False, error=str(explained.get("error", "explain_failed")))

    citation = _automation_run_citation(run, board_slug)
    return ToolResult(
        ok=True,
        data={
            **explained,
            "rule_name": run.rule.name if run.rule_id else None,
        },
        citations=[citation],
    )


def handle_list_automation_packs(ctx: AssistantActorContext, args: dict[str, Any]) -> ToolResult:
    from operis.automation.packs_registry import list_automation_packs
    from operis.db.models import BoardAutomationPackInstall

    board_slug = args.get("board_slug") or ctx.board_slug
    if not board_slug:
        return ToolResult(ok=False, error="board_slug_required")
    if not can_access_board(ctx, str(board_slug)):
        return ToolResult(ok=False, error="board_not_found_or_forbidden")

    board = get_board(ctx, str(board_slug))
    if not board:
        return ToolResult(ok=False, error="board_not_found")

    installed = list(
        BoardAutomationPackInstall.objects.filter(board=board, deleted_at__isnull=True).values_list(
            "pack_name", flat=True
        )
    )
    return ToolResult(
        ok=True,
        data={
            "board_slug": board_slug,
            "packs": list_automation_packs(),
            "installed": installed,
        },
    )


def handle_propose_automation_pack_install(ctx: AssistantActorContext, args: dict[str, Any]) -> ToolResult:
    from operis.automation.packs_registry import get_automation_pack
    from operis.db.models import BoardAutomationPackInstall

    pack_name = str(args.get("pack_name") or "").strip()
    board_slug = args.get("board_slug") or ctx.board_slug
    if not pack_name:
        return ToolResult(ok=False, error="pack_name_required")
    if not board_slug:
        return ToolResult(ok=False, error="board_slug_required")
    if not can_access_board(ctx, str(board_slug)):
        return ToolResult(ok=False, error="board_not_found_or_forbidden")

    board = get_board(ctx, str(board_slug))
    if not board:
        return ToolResult(ok=False, error="board_not_found")

    bundle = get_automation_pack(pack_name)
    if not bundle:
        return ToolResult(ok=False, error="pack_not_found")

    if BoardAutomationPackInstall.objects.filter(
        board=board,
        pack_name=pack_name,
        deleted_at__isnull=True,
    ).exists():
        return ToolResult(ok=False, error="pack_already_installed")

    summary = {
        "name": bundle.name,
        "version": str(bundle.manifest["version"]),
        "description": str(bundle.manifest["description"]),
        "rules_count": len(bundle.rules()),
        "has_hooks": bundle.hooks_path() is not None,
    }
    return ToolResult(
        ok=True,
        data={
            "pack_install_proposal": {
                **summary,
                "pack_name": pack_name,
                "board_slug": board_slug,
            },
        },
    )


def handle_propose_issue_comment(ctx: AssistantActorContext, args: dict[str, Any]) -> ToolResult:
    from operis.assistant.confirmed_actions import build_issue_comment_proposal

    issue_id = str(args.get("issue_id") or "").strip()
    comment = str(args.get("comment") or "").strip()
    if not issue_id:
        return ToolResult(ok=False, error="issue_id_required")
    if not comment:
        return ToolResult(ok=False, error="comment_required")

    payload = build_issue_comment_proposal(ctx=ctx, issue_id=issue_id, comment=comment)
    if not payload.get("ok"):
        return ToolResult(ok=False, error=str(payload.get("error", "proposal_failed")), data=payload)
    return ToolResult(ok=True, data=payload)


def handle_propose_issue_state_change(ctx: AssistantActorContext, args: dict[str, Any]) -> ToolResult:
    from operis.assistant.confirmed_actions import build_issue_state_change_proposal

    issue_id = str(args.get("issue_id") or "").strip()
    state_id = str(args.get("state_id") or "").strip()
    if not issue_id or not state_id:
        return ToolResult(ok=False, error="issue_id_and_state_id_required")

    payload = build_issue_state_change_proposal(ctx=ctx, issue_id=issue_id, state_id=state_id)
    if not payload.get("ok"):
        return ToolResult(ok=False, error=str(payload.get("error", "proposal_failed")), data=payload)
    return ToolResult(ok=True, data=payload)


register_all_tools()
