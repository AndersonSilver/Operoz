# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models
from django.db.models import Q

from .base import BaseModel


class BoardIssueType(BaseModel):
    """Catálogo de tipos de card habilitados por board (Tech4Humans BC-1)."""

    board = models.ForeignKey("db.Board", on_delete=models.CASCADE, related_name="board_issue_types")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="board_issue_types")
    issue_type = models.ForeignKey("db.IssueType", on_delete=models.CASCADE, related_name="board_issue_types")
    sort_order = models.FloatField(default=65535)
    is_enabled = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Board Issue Type"
        verbose_name_plural = "Board Issue Types"
        db_table = "board_issue_types"
        ordering = ("sort_order", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["board", "issue_type"],
                condition=Q(deleted_at__isnull=True),
                name="board_issue_type_unique_board_issue_type_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.board} - {self.issue_type}"
