# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.db import models

from .base import BaseModel


class BoardStatusReport(BaseModel):
    board = models.ForeignKey(
        "db.Board",
        on_delete=models.CASCADE,
        related_name="status_reports",
        null=True,
        blank=True,
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="status_reports",
        null=True,
        blank=True,
    )
    module = models.ForeignKey(
        "db.Module",
        on_delete=models.CASCADE,
        related_name="status_reports",
        null=True,
        blank=True,
    )
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="board_status_reports")
    title = models.CharField(max_length=255, blank=True, default="")
    period_start = models.DateField()
    period_end = models.DateField()
    content = models.JSONField(default=dict)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "board_status_reports"
        ordering = ("-period_end", "-created_at")
        indexes = [
            models.Index(fields=["board", "period_end"]),
            models.Index(fields=["workspace", "board"]),
        ]

    def __str__(self):
        return self.title or f"Status report {self.period_start} — {self.period_end}"
