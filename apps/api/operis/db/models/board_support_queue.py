from django.db import models
from django.utils.text import slugify

from .base import BaseModel


class BoardSupportQueue(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="board_support_queues")
    board = models.ForeignKey("db.Board", on_delete=models.CASCADE, related_name="support_queues")
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100)
    color = models.CharField(max_length=32, default="#6366F1")
    sort_order = models.PositiveIntegerField(default=0)
    is_default = models.BooleanField(default=False)
    description = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "BoardSupportQueue"
        verbose_name_plural = "BoardSupportQueues"
        db_table = "board_support_queues"
        ordering = ("sort_order", "name")
        constraints = [
            models.UniqueConstraint(
                fields=["board", "slug"],
                condition=models.Q(deleted_at__isnull=True),
                name="board_support_queue_unique_slug_board_when_deleted_at_null",
            ),
        ]
        indexes = [
            models.Index(fields=["board", "sort_order"]),
            models.Index(fields=["workspace", "board"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} <board={self.board_id}>"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)[:100] or "fila"
        super().save(*args, **kwargs)
