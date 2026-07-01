from django.db import models
from django.db.models import Q
from django.template.defaultfilters import slugify

from .base import BaseModel


class BoardModuleStage(BaseModel):
    """Catálogo de etapas de módulo configuráveis por board."""

    board = models.ForeignKey("db.Board", on_delete=models.CASCADE, related_name="module_stages")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="module_stages")
    name = models.CharField(max_length=64)
    slug = models.SlugField(max_length=64, blank=True)
    color = models.CharField(max_length=7, default="#00b8a9")
    sort_order = models.FloatField(default=65535)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Board Module Stage"
        verbose_name_plural = "Board Module Stages"
        db_table = "board_module_stages"
        ordering = ("sort_order", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["board", "slug"],
                condition=Q(deleted_at__isnull=True),
                name="board_module_stage_unique_board_slug_when_deleted_at_null",
            )
        ]

    def save(self, *args, **kwargs):
        if not self.slug and self.name:
            base_slug = slugify(self.name)[:60] or "stage"
            slug = base_slug
            counter = 1
            while (
                BoardModuleStage.objects.filter(board_id=self.board_id, slug=slug, deleted_at__isnull=True)
                .exclude(pk=self.pk)
                .exists()
            ):
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.board_id} — {self.name}"
