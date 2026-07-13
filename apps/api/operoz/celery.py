# Python imports
import os
import logging

# Third party imports
from celery import Celery
from pythonjsonlogger.jsonlogger import JsonFormatter
from celery.signals import after_setup_logger, after_setup_task_logger
from celery.schedules import crontab

# Module imports
from operoz.settings.redis import redis_instance

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "operoz.settings.production")

ri = redis_instance()

app = Celery("operoz")

# Using a string here means the worker will not have to
# pickle the object when using Windows.
app.config_from_object("django.conf:settings", namespace="CELERY")

app.conf.beat_schedule = {
    # Intra day recurring jobs
    "check-every-five-minutes-to-send-email-notifications": {
        "task": "operoz.bgtasks.email_notification_task.stack_email_notification",
        "schedule": crontab(minute="*/5"),  # Every 5 minutes
    },
    "run-every-6-hours-for-instance-trace": {
        "task": "operoz.license.bgtasks.tracer.instance_traces",
        "schedule": crontab(hour="*/6", minute=0),  # Every 6 hours
    },
    # Occurs once every day
    "check-every-day-to-delete-hard-delete": {
        "task": "operoz.bgtasks.deletion_task.hard_delete",
        "schedule": crontab(hour=0, minute=0),  # UTC 00:00
    },
    "check-every-day-to-archive-and-close": {
        "task": "operoz.bgtasks.issue_automation_task.archive_and_close_old_issues",
        "schedule": crontab(hour=1, minute=0),  # UTC 01:00
    },
    "check-every-day-to-delete_exporter_history": {
        "task": "operoz.bgtasks.exporter_expired_task.delete_old_s3_link",
        "schedule": crontab(hour=1, minute=30),  # UTC 01:30
    },
    "check-every-day-to-delete-file-asset": {
        "task": "operoz.bgtasks.file_asset_task.delete_unuploaded_file_asset",
        "schedule": crontab(hour=2, minute=0),  # UTC 02:00
    },
    "check-every-day-to-delete-api-logs": {
        "task": "operoz.bgtasks.cleanup_task.delete_api_logs",
        "schedule": crontab(hour=2, minute=30),  # UTC 02:30
    },
    "check-every-day-to-delete-email-notification-logs": {
        "task": "operoz.bgtasks.cleanup_task.delete_email_notification_logs",
        "schedule": crontab(hour=2, minute=45),  # UTC 02:45
    },
    "check-every-day-to-delete-page-versions": {
        "task": "operoz.bgtasks.cleanup_task.delete_page_versions",
        "schedule": crontab(hour=3, minute=0),  # UTC 03:00
    },
    "check-every-day-to-delete-issue-description-versions": {
        "task": "operoz.bgtasks.cleanup_task.delete_issue_description_versions",
        "schedule": crontab(hour=3, minute=15),  # UTC 03:15
    },
    "check-every-day-to-delete-webhook-logs": {
        "task": "operoz.bgtasks.cleanup_task.delete_webhook_logs",
        "schedule": crontab(hour=3, minute=30),  # UTC 03:30
    },
    "flush-stale-automation-outbox-every-two-minutes": {
        "task": "operoz.bgtasks.automation_task.flush_stale_automation_outbox",
        "schedule": crontab(minute="*/2"),
    },
    "dispatch-scheduled-automation-rules-every-minute": {
        "task": "operoz.bgtasks.automation_task.dispatch_scheduled_automation_rules",
        "schedule": crontab(minute="*"),
    },
    "check-every-day-to-delete-exporter-history": {
        "task": "operoz.bgtasks.exporter_expired_task.delete_old_s3_link",
        "schedule": crontab(hour=3, minute=45),  # UTC 03:45
    },
    "snapshot-weekly-client360-health": {
        "task": "operoz.bgtasks.client_360_health_snapshot_task.snapshot_weekly_client360_health",
        "schedule": crontab(hour=6, minute=0, day_of_week=1),  # Monday 06:00 UTC
    },
    "monday-client360-weekly-briefing": {
        "task": "operoz.bgtasks.client_360_weekly_briefing_task.generate_weekly_client360_briefings",
        "schedule": crontab(hour=8, minute=0, day_of_week=1),  # Monday 08:00 UTC
    },
    "friday-client360-status-report-reminder": {
        "task": "operoz.bgtasks.client_360_status_report_reminder_task.friday_status_report_reminder",
        "schedule": crontab(hour="*", minute=0, day_of_week=5),  # hourly on Fridays
    },
    "check-due-date-alerts-hourly": {
        "task": "operoz.bgtasks.alert_scan_task.check_due_date_alerts",
        "schedule": crontab(minute=0),  # every hour
    },
    "send-daily-alert-digests": {
        "task": "operoz.bgtasks.alert_digest_task.send_daily_alert_digests",
        "schedule": crontab(hour=7, minute=0),  # UTC 07:00
    },
    "send-weekly-stale-digest": {
        "task": "operoz.bgtasks.alert_digest_task.send_weekly_stale_card_digest",
        "schedule": crontab(hour=9, minute=0, day_of_week=1),  # Monday 09:00 UTC
    },
}


# Setup logging
@after_setup_logger.connect
def setup_loggers(logger, *args, **kwargs):
    formatter = JsonFormatter('"%(levelname)s %(asctime)s %(module)s %(name)s %(message)s')
    handler = logging.StreamHandler()
    handler.setFormatter(fmt=formatter)
    logger.addHandler(handler)


@after_setup_task_logger.connect
def setup_task_loggers(logger, *args, **kwargs):
    formatter = JsonFormatter('"%(levelname)s %(asctime)s %(module)s %(name)s %(message)s')
    handler = logging.StreamHandler()
    handler.setFormatter(fmt=formatter)
    logger.addHandler(handler)


# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

app.conf.beat_scheduler = "django_celery_beat.schedulers.DatabaseScheduler"
