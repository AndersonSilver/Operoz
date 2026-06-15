from __future__ import annotations

from operis.automation.dispatcher import dispatch_domain_event
from operis.automation.domain import DomainEvent
from operis.db.models import PageReviewSession


def emit_prd_review_feedback_submitted(session: PageReviewSession, *, actor_email: str) -> None:
    project = session.project
    board_id = getattr(project, "board_id", None)
    if not board_id:
        return

    event = DomainEvent.create(
        event_type="prd_review.feedback_submitted",
        workspace_id=str(session.workspace_id),
        board_id=str(board_id),
        actor_id=None,
        entity_type="page_review_session",
        entity_id=str(session.id),
        project_id=str(session.project_id),
        payload={
            "session_id": str(session.id),
            "page_id": str(session.page_id),
            "page_name": session.page.name if session.page_id else "",
            "actor_email": actor_email,
            "status": session.status,
            "comment_count": session.comments.count() if hasattr(session, "comments") else 0,
        },
    )
    dispatch_domain_event(event)
