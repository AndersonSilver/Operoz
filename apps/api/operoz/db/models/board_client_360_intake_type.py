from django.db import models

from .base import BaseModel


class BoardClient360IntakeType(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="board_client_360_intake_types",
    )
    board = models.ForeignKey(
        "db.Board",
        on_delete=models.CASCADE,
        related_name="client_360_intake_types",
    )
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=80)
    type_name_pattern = models.CharField(
        max_length=120,
        blank=True,
        default="",
        help_text="Case-insensitive substring match on issue type name; empty matches intake/entrada defaults.",
    )
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "board_client_360_intake_types"
        ordering = ("sort_order", "name")
        constraints = [
            models.UniqueConstraint(
                fields=["board", "slug"],
                condition=models.Q(deleted_at__isnull=True),
                name="board_client360_intake_type_unique_slug",
            )
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.board_id})"
