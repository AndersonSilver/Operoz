from __future__ import annotations

import re

from operis.db.models import Issue, IssueComment, PageReviewComment, PageReviewEvent, PageReviewSession, ProjectMember
from operis.utils.host import base_host
from operis.utils.page_review_notifications import build_page_review_workspace_url

_SYNC_MARKER_RE = re.compile(r"<!--\s*prd-review-comment:([a-f0-9-]+)\s*-->")


def _sync_marker(comment_id: str) -> str:
    return f"<!-- prd-review-comment:{comment_id} -->"


def already_synced_comment_ids(issue_id: str) -> set[str]:
    bodies = IssueComment.objects.filter(issue_id=issue_id, deleted_at__isnull=True).values_list(
        "comment_html", flat=True
    )
    synced: set[str] = set()
    for body in bodies:
        if not body:
            continue
        synced.update(_SYNC_MARKER_RE.findall(body))
    return synced


def format_review_comment_block(comment: PageReviewComment) -> str:
    label = "Trecho" if comment.comment_type == PageReviewComment.TYPE_INLINE else "Seção"
    lines = [f"<li><strong>[{label}] {comment.section_id}</strong> ({comment.author_email})"]
    if comment.quote:
        lines.append(f"<blockquote><em>{comment.quote}</em></blockquote>")
    lines.append(f"<p>{comment.body}</p>")
    lines.append(f"{_sync_marker(str(comment.id))}</li>")
    return "\n".join(lines)


def build_sync_comment_html(session: PageReviewSession, comments: list[PageReviewComment]) -> str:
    page_name = session.page.name if session.page_id else "PRD"
    url = build_page_review_workspace_url(session)
    items = "".join(format_review_comment_block(c) for c in comments)
    return (
        f"<p><strong>Feedback PRD — {page_name}</strong> "
        f"(<a href=\"{url}\">abrir documento</a>)</p>"
        f"<ul>{items}</ul>"
    )


def sync_review_comments_to_issue(
    session: PageReviewSession,
    issue: Issue,
    *,
    actor,
    request=None,
) -> dict:
    if session.status != PageReviewSession.STATUS_CHANGES_REQUESTED:
        return {"ok": False, "error": "session_not_feedback"}

    comments = list(PageReviewComment.objects.filter(session=session).order_by("created_at"))
    if not comments:
        return {"ok": False, "error": "no_comments"}

    synced_ids = already_synced_comment_ids(str(issue.id))
    pending = [c for c in comments if str(c.id) not in synced_ids]
    if not pending:
        return {"ok": True, "synced_count": 0, "skipped_count": len(comments), "issue_comment_id": None}

    html = build_sync_comment_html(session, pending)
    comment = IssueComment.objects.create(
        workspace=session.workspace,
        project=issue.project,
        issue=issue,
        comment_html=html,
        actor=actor,
        created_by=actor,
        updated_by=actor,
    )

    PageReviewEvent.objects.create(
        session=session,
        event_type=PageReviewEvent.EVENT_FEEDBACK_SUBMITTED,
        actor_email=getattr(actor, "email", "") or "",
        payload={
            "synced_to_issue_id": str(issue.id),
            "synced_comment_ids": [str(c.id) for c in pending],
            "issue_comment_id": str(comment.id),
            "via": "manual_sync",
        },
    )

    try:
        from operis.bgtasks.issue_activities_task import issue_activity
        from operis.bgtasks.webhook_task import model_activity

        current_site = base_host(request=request, is_app=True) if request else ""
        issue_activity.delay(
            type="comment.activity.created",
            requested_data={"comment_id": str(comment.id)},
            actor_id=str(actor.id),
            issue_id=str(issue.id),
            project_id=str(issue.project_id),
            current_instance=current_site,
            epoch=int(comment.created_at.timestamp()),
            notification=True,
            origin=base_host(request=request, is_app=True) if request else "",
        )
        model_activity.delay(
            model_name="issue_comment",
            model_id=str(comment.id),
            requested_data={"issue_id": str(issue.id)},
            actor_id=str(actor.id),
            slug=session.workspace.slug,
            origin=base_host(request=request, is_app=True) if request else "",
        )
    except Exception:
        pass

    return {
        "ok": True,
        "synced_count": len(pending),
        "skipped_count": len(comments) - len(pending),
        "issue_comment_id": str(comment.id),
    }


def user_can_sync_review(user, session: PageReviewSession) -> bool:
    return ProjectMember.objects.filter(
        project_id=session.project_id,
        member=user,
        is_active=True,
        role__gte=15,
    ).exists()
