from django.conf import settings
from django.db import models
from django.db.models import Q

from .base import BaseModel


class AssistantChatJob(BaseModel):
    STATUS_QUEUED = "queued"
    STATUS_RUNNING = "running"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = (
        (STATUS_QUEUED, "Queued"),
        (STATUS_RUNNING, "Running"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_FAILED, "Failed"),
    )

    session = models.ForeignKey(
        "db.AssistantSession",
        on_delete=models.CASCADE,
        related_name="chat_jobs",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assistant_chat_jobs",
    )
    message = models.TextField()
    client_message_id = models.CharField(max_length=128, blank=True, default="")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_QUEUED)
    error_code = models.CharField(max_length=64, blank=True, default="")
    error_message = models.TextField(blank=True, default="")
    celery_task_id = models.CharField(max_length=255, blank=True, default="")
    retry_count = models.PositiveIntegerField(default=0)
    queue_position = models.PositiveIntegerField(default=0)
    estimated_wait_seconds = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "assistant_chat_jobs"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["session", "-created_at"], name="asst_chat_job_sess_idx"),
            models.Index(fields=["status", "-created_at"], name="asst_chat_job_status_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["session", "client_message_id"],
                condition=~Q(client_message_id=""),
                name="asst_chat_job_client_msg_uniq",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.id}:{self.status}"
