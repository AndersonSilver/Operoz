import logging

from celery import shared_task

from operoz.db.models import PageReviewSession
from operoz.utils.exception_logger import log_exception
from operoz.utils.page_review_notifications import create_prd_review_resolved_notifications

logger = logging.getLogger(__name__)


@shared_task
def prd_review_submit_notify(session_id: str, actor_email: str, status: str) -> None:
    try:
        session = (
            PageReviewSession.objects.filter(pk=session_id)
            .select_related("workspace", "project", "page", "page__owned_by", "created_by")
            .first()
        )
        if not session:
            return
        count = create_prd_review_resolved_notifications(
            session,
            actor_email=actor_email,
            status=status,
        )
        logger.info(
            "prd_review_submit_notify session=%s status=%s notifications=%s",
            session_id,
            status,
            count,
        )
    except Exception as exc:
        log_exception(exc)
        logger.exception("prd_review_submit_notify failed session_id=%s", session_id)
