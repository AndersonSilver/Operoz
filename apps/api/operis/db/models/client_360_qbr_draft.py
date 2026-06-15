from django.db import models

from .base import BaseModel


class Client360QbrDraft(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="client_360_qbr_drafts",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="client_360_qbr_drafts",
    )
    quarter_key = models.CharField(max_length=16)
    content_md = models.TextField(blank=True, default="")
    human_edited_md = models.TextField(blank=True, default="")
    source_facts_hash = models.CharField(max_length=64, blank=True, default="")
    status = models.CharField(max_length=16, default="draft")
    generated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "client_360_qbr_drafts"
        constraints = [
            models.UniqueConstraint(
                fields=["project", "quarter_key"],
                condition=models.Q(deleted_at__isnull=True),
                name="client360_qbr_draft_project_quarter_uniq",
            ),
        ]

    def __str__(self) -> str:
        return f"QbrDraft project={self.project_id} {self.quarter_key}"
