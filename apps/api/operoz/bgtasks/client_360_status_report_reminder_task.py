import logging

from celery import shared_task

from operoz.utils.client_360_status_report_reminder_job import run_friday_status_report_reminders

logger = logging.getLogger(__name__)


@shared_task
def friday_status_report_reminder(board_ids=None, force=False):
    try:
        result = run_friday_status_report_reminders(
            board_ids=board_ids,
            force=bool(force),
        )
        logger.info(
            "client360 status report reminder completed",
            extra={
                "boards_processed": result.boards_processed,
                "boards_skipped": result.boards_skipped,
                "notifications_sent": result.notifications_sent,
                "failures": result.failures,
            },
        )
        return {
            "boards_processed": result.boards_processed,
            "boards_skipped": result.boards_skipped,
            "notifications_sent": result.notifications_sent,
            "failures": result.failures,
        }
    except Exception:
        logger.exception("client360 status report reminder task failed")
        raise
