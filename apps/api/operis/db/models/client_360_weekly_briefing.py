from django.db import models

from .base import BaseModel


class WorkspaceClient360WeeklyBriefing(BaseModel):
    STATUS_DRAFT = "draft"
    STATUS_PUBLISHED = "published"
    STATUS_BLOCKED = "blocked"
    STATUS_CHOICES = (
        (STATUS_DRAFT, "Draft"),
        (STATUS_PUBLISHED, "Published"),
        (STATUS_BLOCKED, "Blocked"),
    )

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="client_360_weekly_briefings",
    )
    period_start = models.DateField()
    period_end = models.DateField()
    content_md = models.TextField(blank=True, default="")
    facts_hash = models.CharField(max_length=64, blank=True, default="")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    requires_review = models.BooleanField(default=True)
    qa_issues = models.JSONField(default=list, blank=True)
    prompt_version = models.CharField(max_length=32, default="v1")
    generated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "client_360_weekly_briefings"
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "period_start"],
                condition=models.Q(deleted_at__isnull=True),
                name="client360_weekly_briefing_ws_week_uniq",
            ),
        ]

    def __str__(self) -> str:
        return f"WeeklyBriefing ws={self.workspace_id} week={self.period_start}"
