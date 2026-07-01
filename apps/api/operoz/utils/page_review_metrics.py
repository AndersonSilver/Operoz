from __future__ import annotations

from datetime import timedelta

from django.db.models import Avg, Count, DurationField, ExpressionWrapper, F, Q
from django.utils import timezone

from operoz.db.models import PageReviewSession, ProjectMember


def accessible_review_sessions_qs(workspace, user):
    project_ids = ProjectMember.objects.filter(
        workspace=workspace,
        member=user,
        is_active=True,
        project__archived_at__isnull=True,
    ).values_list("project_id", flat=True)
    return PageReviewSession.objects.filter(workspace=workspace, project_id__in=project_ids)


def compute_prd_review_metrics(workspace, user) -> dict:
    qs = accessible_review_sessions_qs(workspace, user)
    by_status = {
        row["status"]: row["count"]
        for row in qs.values("status").annotate(count=Count("id")).order_by("status")
    }

    sent_or_resolved = qs.filter(
        status__in=[
            PageReviewSession.STATUS_SENT,
            PageReviewSession.STATUS_APPROVED,
            PageReviewSession.STATUS_CHANGES_REQUESTED,
        ]
    )
    approved = by_status.get(PageReviewSession.STATUS_APPROVED, 0)
    changes = by_status.get(PageReviewSession.STATUS_CHANGES_REQUESTED, 0)
    resolved_total = approved + changes

    approval_rate = round(approved / resolved_total, 4) if resolved_total else None

    duration_expr = ExpressionWrapper(F("resolved_at") - F("sent_at"), output_field=DurationField())
    avg_duration = (
        qs.filter(
            sent_at__isnull=False,
            resolved_at__isnull=False,
            status__in=[PageReviewSession.STATUS_APPROVED, PageReviewSession.STATUS_CHANGES_REQUESTED],
        )
        .aggregate(avg=Avg(duration_expr))
        .get("avg")
    )
    avg_hours_to_resolve = round(avg_duration.total_seconds() / 3600, 2) if avg_duration else None

    since_30d = timezone.now() - timedelta(days=30)
    recent = qs.filter(created_at__gte=since_30d)
    recent_resolved = recent.filter(
        status__in=[PageReviewSession.STATUS_APPROVED, PageReviewSession.STATUS_CHANGES_REQUESTED]
    )
    recent_approved = recent_resolved.filter(status=PageReviewSession.STATUS_APPROVED).count()
    recent_total = recent_resolved.count()
    recent_approval_rate = round(recent_approved / recent_total, 4) if recent_total else None

    pending_feedback = by_status.get(PageReviewSession.STATUS_SENT, 0) + by_status.get(PageReviewSession.STATUS_DRAFT, 0)

    return {
        "total_sessions": qs.count(),
        "by_status": by_status,
        "pending_feedback": pending_feedback,
        "approval_rate": approval_rate,
        "recent_30d_approval_rate": recent_approval_rate,
        "avg_hours_to_resolve": avg_hours_to_resolve,
        "rounds_avg": round(qs.values("page_id").annotate(c=Count("id")).aggregate(avg=Avg("c")).get("avg") or 0, 2),
    }


def list_prd_review_inbox(
    workspace,
    user,
    *,
    status: str | None = None,
    project_id: str | None = None,
    limit: int = 50,
) -> list[dict]:
    from operoz.utils.page_review_guest import serialize_review_session

    qs = (
        accessible_review_sessions_qs(workspace, user)
        .select_related("page", "project", "page_version", "project__board")
        .order_by("-created_at")
    )
    if status:
        qs = qs.filter(status=status)
    if project_id:
        qs = qs.filter(project_id=project_id)
    else:
        qs = qs.filter(
            Q(status=PageReviewSession.STATUS_SENT)
            | Q(status=PageReviewSession.STATUS_CHANGES_REQUESTED)
            | Q(status=PageReviewSession.STATUS_APPROVED)
        )

    items: list[dict] = []
    for session in qs[:limit]:
        payload = serialize_review_session(session)
        payload["page_name"] = session.page.name if session.page_id else ""
        payload["project_name"] = session.project.name if session.project_id else ""
        payload["project_identifier"] = session.project.identifier if session.project_id else ""
        payload["board_slug"] = session.project.board.slug if session.project.board_id else None
        if session.page_version_id:
            payload["page_version"] = {
                "id": str(session.page_version_id),
                "last_saved_at": session.page_version.last_saved_at.isoformat()
                if session.page_version.last_saved_at
                else None,
            }
        else:
            payload["page_version"] = None
        items.append(payload)
    return items
