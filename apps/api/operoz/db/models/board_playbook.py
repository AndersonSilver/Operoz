from django.db import models

from .base import BaseModel


class BoardPlaybook(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="board_playbooks")
    board = models.ForeignKey("db.Board", on_delete=models.CASCADE, related_name="playbooks")
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=128)
    description = models.TextField(blank=True, default="")
    draft_markdown = models.TextField(blank=True, default="")
    published_markdown = models.TextField(blank=True, default="")
    published_version = models.PositiveIntegerField(default=0)
    published_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "board_playbooks"
        ordering = ("sort_order", "-created_at")
        constraints = [
            models.UniqueConstraint(fields=["board", "slug"], name="board_playbook_board_slug_unique"),
        ]
        indexes = [
            models.Index(fields=["board", "is_active"]),
            models.Index(fields=["workspace", "board"]),
        ]

    def __str__(self) -> str:
        return self.title

    @property
    def has_unpublished_changes(self) -> bool:
        return (self.draft_markdown or "") != (self.published_markdown or "")
