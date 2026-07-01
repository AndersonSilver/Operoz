# Python imports
import logging

# Third party imports
from celery import shared_task

# Module imports
from operoz.utils.client_360_health_snapshot_job import run_weekly_health_snapshots
from operoz.utils.exception_logger import log_exception

logger = logging.getLogger("operoz.worker")


@shared_task(bind=True, max_retries=2, default_retry_delay=300)
def snapshot_weekly_client360_health(self, project_ids=None):
    """
    Persiste snapshots semanais de health score para projetos Cliente 360.
    Re-run idempotente por (project, period_start). Retries apenas projectos em falha.
    """
    try:
        result = run_weekly_health_snapshots(project_ids=project_ids)
        payload = result.as_dict()

        if result.failed and self.request.retries < self.max_retries:
            logger.warning(
                "client360 health snapshot scheduling retry for %s failed projects",
                result.failed,
            )
            raise self.retry(
                exc=RuntimeError(f"partial snapshot failure: {result.failed} projects"),
                kwargs={"project_ids": list(result.failed_project_ids)},
            )

        return payload
    except self.MaxRetriesExceededError:
        raise
    except RuntimeError:
        raise
    except Exception as exc:
        log_exception(exc)
        raise
