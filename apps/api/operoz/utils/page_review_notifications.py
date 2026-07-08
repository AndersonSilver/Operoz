from __future__ import annotations

from operoz.db.models import Notification, PageReviewSession, User
from operoz.utils.host import frontend_base_url

ENTITY_NAME = "page_review_session"
SENDER_LABEL = "Operoz PRD Review"


def build_page_review_workspace_url(session: PageReviewSession) -> str:
    return f"{frontend_base_url()}/{session.workspace.slug}/projects/{session.project_id}/pages/{session.page_id}"


def collect_prd_review_notify_receivers(session: PageReviewSession) -> list[User]:
    candidates: list[User | None] = []
    if session.created_by_id:
        candidates.append(session.created_by)
    page = session.page
    if page and page.owned_by_id:
        candidates.append(page.owned_by)

    receivers: list[User] = []
    seen: set[str] = set()
    for user in candidates:
        if not user or not user.is_active:
            continue
        user_id = str(user.id)
        if user_id in seen:
            continue
        seen.add(user_id)
        receivers.append(user)
    return receivers


def _notification_copy(session: PageReviewSession, *, actor_email: str, status: str) -> tuple[str, str]:
    page_name = (session.page.name if session.page_id else None) or "PRD"
    guest = actor_email or "Cliente"
    if status == PageReviewSession.STATUS_APPROVED:
        title = f"PRD aprovado: {page_name}"
        body = f"{guest} aprovou o PRD «{page_name}» sem solicitar ajustes."
    else:
        title = f"Ajustes solicitados: {page_name}"
        body = f"{guest} enviou feedback com comentários no PRD «{page_name}»."
    return title, body


def create_prd_review_resolved_notifications(
    session: PageReviewSession,
    *,
    actor_email: str,
    status: str,
) -> int:
    receivers = collect_prd_review_notify_receivers(session)
    if not receivers:
        return 0

    title, body = _notification_copy(session, actor_email=actor_email, status=status)
    url = build_page_review_workspace_url(session)
    notifications = [
        Notification(
            workspace=session.workspace,
            project=session.project,
            receiver=receiver,
            sender=SENDER_LABEL,
            entity_name=ENTITY_NAME,
            entity_identifier=session.id,
            title=title,
            message_html=f"<p>{body}</p>",
            message_stripped=body,
            data={"url": url, "session_id": str(session.id), "status": status},
            triggered_by=None,
        )
        for receiver in receivers
    ]
    Notification.objects.bulk_create(notifications, batch_size=50)
    return len(notifications)
