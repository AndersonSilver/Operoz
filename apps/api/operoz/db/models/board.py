from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from .base import BaseModel
from .workspace import slug_validator


class Board(BaseModel):
    name = models.CharField(max_length=255, verbose_name="Board Name")
    slug = models.SlugField(max_length=48, db_index=True, validators=[slug_validator])
    identifier = models.CharField(max_length=12, blank=True, default="", db_index=True, verbose_name="Space Key")
    category = models.CharField(max_length=128, blank=True, default="", verbose_name="Category")
    space_type = models.CharField(max_length=64, default="team_managed", verbose_name="Space Type")
    gantt_project_logo_props = models.JSONField(default=dict, blank=True)
    gantt_module_logo_props = models.JSONField(default=dict, blank=True)
    description = models.TextField(blank=True, default="")
    logo_props = models.JSONField(default=dict)
    sort_order = models.FloatField(default=65535)
    archived_at = models.DateTimeField(null=True, blank=True)
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="boards")
    board_lead = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="board_lead_boards",
        null=True,
        blank=True,
    )
    default_assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="board_default_assignee_boards",
        null=True,
        blank=True,
    )

    def save(self, *args, **kwargs):
        if self.identifier:
            self.identifier = self.identifier.strip().upper()[:12]
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} <{self.workspace.name}>"

    class Meta:
        verbose_name = "Board"
        verbose_name_plural = "Boards"
        db_table = "boards"
        ordering = ("sort_order", "-created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "slug"],
                condition=models.Q(deleted_at__isnull=True),
                name="board_unique_slug_workspace_when_deleted_at_null",
            ),
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="board_unique_name_workspace_when_deleted_at_null",
            ),
            models.UniqueConstraint(
                fields=["workspace", "identifier"],
                condition=models.Q(deleted_at__isnull=True) & ~models.Q(identifier=""),
                name="board_unique_identifier_workspace_when_deleted_at_null",
            ),
        ]
