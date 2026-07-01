from django.conf import settings
from django.db import models

from .base import BaseModel


class AssistantQualityDaily(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="assistant_quality_daily",
    )
    quality_date = models.DateField()
    response_count = models.PositiveIntegerField(default=0)
    tool_response_count = models.PositiveIntegerField(default=0)
    feedback_up = models.PositiveIntegerField(default=0)
    feedback_down = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "assistant_quality_daily"
        ordering = ("-quality_date",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "quality_date"],
                name="assistant_quality_ws_date_unique",
            ),
        ]


class AssistantQualityReview(BaseModel):
    VERDICT_OK = "ok"
    VERDICT_HALLUCINATION = "hallucination"
    VERDICT_INCOMPLETE = "incomplete"
    VERDICT_UNSAFE = "unsafe"
    VERDICT_CHOICES = (
        (VERDICT_OK, "Ok"),
        (VERDICT_HALLUCINATION, "Hallucination"),
        (VERDICT_INCOMPLETE, "Incomplete"),
        (VERDICT_UNSAFE, "Unsafe"),
    )

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="assistant_quality_reviews",
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assistant_quality_reviews",
    )
    message = models.ForeignKey(
        "db.AssistantMessage",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quality_reviews",
    )
    verdict = models.CharField(max_length=32, choices=VERDICT_CHOICES)
    notes = models.TextField(blank=True, default="")

    class Meta:
        db_table = "assistant_quality_reviews"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["workspace", "-created_at"], name="asst_qreview_ws_idx"),
        ]
