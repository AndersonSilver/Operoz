from django.conf import settings
from django.db import models
from django.db.models import Q

from .base import BaseModel


class BoardCircle(BaseModel):
    """Grupo de time (círculo) num board — organiza membros e, opcionalmente, concede uma função."""

    board = models.ForeignKey("db.Board", on_delete=models.CASCADE, related_name="circles")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="board_circles")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    color = models.CharField(max_length=16, blank=True, default="")
    role = models.ForeignKey(
        "db.BoardRole",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="circles",
    )
    sort_order = models.FloatField(default=65535)

    class Meta:
        db_table = "board_circles"
        ordering = ("sort_order", "name")
        constraints = [
            models.UniqueConstraint(
                fields=["board", "name"],
                condition=Q(deleted_at__isnull=True),
                name="board_circle_unique_name_board_when_deleted_at_null",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.board_id})"


class BoardCircleMember(BaseModel):
    """Pertencimento de um utilizador a um círculo do board."""

    circle = models.ForeignKey(BoardCircle, on_delete=models.CASCADE, related_name="members")
    board = models.ForeignKey("db.Board", on_delete=models.CASCADE, related_name="circle_members")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="board_circle_members")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="board_circle_memberships",
    )

    class Meta:
        db_table = "board_circle_members"
        constraints = [
            models.UniqueConstraint(
                fields=["circle", "user"],
                condition=Q(deleted_at__isnull=True),
                name="board_circle_member_unique_circle_user_when_deleted_at_null",
            ),
        ]

    def __str__(self):
        return f"{self.user_id} @ {self.circle_id}"
