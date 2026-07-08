from __future__ import annotations

from datetime import timedelta

from django.utils import timezone

from operoz.utils.host import frontend_base_url

from operoz.db.models import (
    Client360QbrGuestAccessLog,
    Client360QbrGuestLink,
    Issue,
    Project,
)
from operoz.utils.client_360 import WeekPeriod, parse_week_period
from operoz.utils.client_360_qbr_service import build_client_qbr_context, build_workspace_portfolio_qbr_context

DEFAULT_GUEST_LINK_TTL_DAYS = 14
MAX_GUEST_LINK_TTL_DAYS = 90
MIN_GUEST_LINK_TTL_DAYS = 1


def parse_guest_link_ttl_days(raw) -> tuple[int, str | None]:
    if raw is None or raw == "":
        return DEFAULT_GUEST_LINK_TTL_DAYS, None
    try:
        days = int(raw)
    except (TypeError, ValueError):
        return DEFAULT_GUEST_LINK_TTL_DAYS, "expires_in_days must be an integer"
    if days < MIN_GUEST_LINK_TTL_DAYS or days > MAX_GUEST_LINK_TTL_DAYS:
        return (
            DEFAULT_GUEST_LINK_TTL_DAYS,
            f"expires_in_days must be between {MIN_GUEST_LINK_TTL_DAYS} and {MAX_GUEST_LINK_TTL_DAYS}",
        )
    return days, None


def build_guest_link_url(token: str) -> str:
    return f"{frontend_base_url()}/guest/qbr/{token}"


def resolve_guest_link(token: str) -> tuple[Client360QbrGuestLink | None, dict | None, int]:
    link = Client360QbrGuestLink.objects.filter(token=token).select_related("workspace", "project").first()
    if not link:
        return None, {"error": "Link not found"}, 404
    if link.revoked_at:
        return None, {"error": "This guest link was revoked"}, 403
    if link.expires_at <= timezone.now():
        return None, {"error": "This guest link has expired"}, 410
    return link, None, 200


def log_guest_access(link: Client360QbrGuestLink, request) -> None:
    ip = request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip() or request.META.get("REMOTE_ADDR")
    user_agent = (request.META.get("HTTP_USER_AGENT") or "")[:512]
    Client360QbrGuestAccessLog.objects.create(link=link, ip_address=ip or None, user_agent=user_agent)
    Client360QbrGuestLink.objects.filter(pk=link.pk).update(
        access_count=link.access_count + 1,
        last_accessed_at=timezone.now(),
    )


def _issues_queryset_for_link(link: Client360QbrGuestLink, project_ids: list):
    qs = Issue.issue_objects.filter(workspace_id=link.workspace_id, project_id__in=project_ids)
    if link.scope == Client360QbrGuestLink.SCOPE_CLIENT and link.project_id:
        qs = qs.filter(project_id=link.project_id)
    return qs.distinct()


def build_guest_qbr_payload(link: Client360QbrGuestLink) -> dict:
    period = WeekPeriod(start=link.period_start, end=link.period_end)
    workspace = link.workspace
    issue_qs = _issues_queryset_for_link(link, _project_ids_for_link(link))

    if link.scope == Client360QbrGuestLink.SCOPE_CLIENT:
        if not link.project_id:
            raise ValueError("client link missing project")
        payload = build_client_qbr_context(
            workspace=workspace,
            project=link.project,
            period=period,
            weeks=link.weeks,
            issue_queryset=issue_qs.filter(project_id=link.project_id),
            include_compare=link.include_compare,
        )
    else:
        projects = list(
            Project.objects.filter(
                id__in=_project_ids_for_link(link),
                workspace_id=link.workspace_id,
                archived_at__isnull=True,
            ).select_related("board", "project_lead")
        )
        payload = build_workspace_portfolio_qbr_context(
            workspace=workspace,
            projects=projects,
            period=period,
            weeks=link.weeks,
            issue_queryset=issue_qs,
            include_compare=link.include_compare,
        )
    return sanitize_qbr_payload_for_guest(payload)


def _project_ids_for_link(link: Client360QbrGuestLink) -> list:
    if link.scope == Client360QbrGuestLink.SCOPE_CLIENT:
        return [link.project_id] if link.project_id else []
    return [value for value in (link.portfolio_project_ids or []) if value]


def sanitize_qbr_payload_for_guest(payload: dict) -> dict:
    sanitized = {**payload}
    sanitized["clients"] = [_sanitize_client_row(client) for client in payload.get("clients") or []]
    if payload.get("client_detail"):
        sanitized["client_detail"] = _sanitize_client_detail(payload["client_detail"])
    return sanitized


def _sanitize_client_row(client: dict) -> dict:
    return {
        "name": client.get("name"),
        "identifier": client.get("identifier"),
        "health": client.get("health"),
        "health_score": client.get("health_score"),
        "status_report": client.get("status_report"),
        "issues": client.get("issues"),
        "support": client.get("support"),
        "board": ({"name": client.get("board", {}).get("name")} if client.get("board") else None),
    }


def _sanitize_client_detail(detail: dict) -> dict:
    row = _sanitize_client_row(detail)
    row["modules"] = [
        {
            "module_name": module.get("module_name"),
            "status": module.get("status"),
        }
        for module in detail.get("modules") or []
    ]
    row["overdue_issues"] = [_sanitize_issue(issue) for issue in detail.get("overdue_issues") or []]
    row["support_issues"] = [_sanitize_issue(issue) for issue in detail.get("support_issues") or []]
    return row


def _sanitize_issue(issue: dict) -> dict:
    return {
        "name": issue.get("name"),
        "sequence_id": issue.get("sequence_id"),
        "target_date": issue.get("target_date"),
        "priority": issue.get("priority"),
        "state__name": issue.get("state__name"),
        "type__name": issue.get("type__name"),
    }


def build_guest_portal_payload(link: Client360QbrGuestLink) -> dict:
    """Multi-client guest portal: sanitized client rows + SSO hints."""
    from operoz.utils.client_360_enterprise import load_enterprise_settings

    qbr = build_guest_qbr_payload(link)
    enterprise = load_enterprise_settings(link.workspace_id)
    return {
        "workspace_name": qbr.get("workspace_name"),
        "scope": link.scope,
        "period_start": link.period_start.isoformat(),
        "period_end": link.period_end.isoformat(),
        "expires_at": link.expires_at.isoformat(),
        "clients": qbr.get("clients") or [],
        "auth": {
            "sso_enabled": enterprise.get("guest_sso_enabled", False),
            "magic_link_fallback": enterprise.get("guest_magic_link_fallback", True),
            "sso_provider": (enterprise.get("guest_sso_config") or {}).get("provider"),
        },
    }


def serialize_guest_link(link: Client360QbrGuestLink) -> dict:
    return {
        "id": str(link.id),
        "scope": link.scope,
        "token": link.token,
        "url": build_guest_link_url(link.token),
        "expires_at": link.expires_at.isoformat(),
        "revoked_at": link.revoked_at.isoformat() if link.revoked_at else None,
        "period_start": link.period_start.isoformat(),
        "period_end": link.period_end.isoformat(),
        "weeks": link.weeks,
        "include_compare": link.include_compare,
        "project_id": str(link.project_id) if link.project_id else None,
        "access_count": link.access_count,
        "last_accessed_at": link.last_accessed_at.isoformat() if link.last_accessed_at else None,
        "created_at": link.created_at.isoformat() if link.created_at else None,
    }


def create_guest_link(
    *,
    workspace,
    user,
    scope: str,
    period: WeekPeriod,
    weeks: int,
    include_compare: bool,
    expires_in_days: int,
    project: Project | None = None,
    accessible_projects: list[Project] | None = None,
) -> Client360QbrGuestLink:
    portfolio_ids: list[str] = []
    if scope == Client360QbrGuestLink.SCOPE_PORTFOLIO:
        portfolio_ids = [str(project.id) for project in (accessible_projects or [])]
    elif not project:
        raise ValueError("project required for client scope")

    return Client360QbrGuestLink.objects.create(
        workspace=workspace,
        project=project,
        scope=scope,
        period_start=period.start,
        period_end=period.end,
        weeks=weeks,
        include_compare=include_compare,
        expires_at=timezone.now() + timedelta(days=expires_in_days),
        portfolio_project_ids=portfolio_ids,
        created_by=user,
    )


def parse_guest_link_period(raw_start, raw_end) -> tuple[WeekPeriod | None, str | None]:
    from django.utils.dateparse import parse_date

    period_start = parse_date(raw_start or "")
    period_end = parse_date(raw_end or "")
    try:
        return parse_week_period(period_start, period_end), None
    except ValueError as exc:
        return None, str(exc)
