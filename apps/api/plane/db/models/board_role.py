# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.db import models
from django.db.models import Q

from .base import BaseModel


class BoardRole(BaseModel):
    """Função de acesso num board (sistema ou custom)."""

    board = models.ForeignKey("db.Board", on_delete=models.CASCADE, related_name="board_roles")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="board_roles")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    slug = models.SlugField(max_length=64)
    is_system = models.BooleanField(default=False)
    sort_order = models.FloatField(default=65535)

    class Meta:
        db_table = "board_roles"
        ordering = ("sort_order", "name")
        constraints = [
            models.UniqueConstraint(
                fields=["board", "slug"],
                condition=Q(deleted_at__isnull=True),
                name="board_role_unique_slug_board_when_deleted_at_null",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.board_id})"


class BoardRolePermission(BaseModel):
    """Permissão concedida a uma função do board."""

    role = models.ForeignKey(BoardRole, on_delete=models.CASCADE, related_name="permissions")
    board = models.ForeignKey("db.Board", on_delete=models.CASCADE, related_name="role_permissions")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="role_permissions")
    permission_key = models.CharField(max_length=128, db_index=True)
    granted = models.BooleanField(default=True)

    class Meta:
        db_table = "board_role_permissions"
        constraints = [
            models.UniqueConstraint(
                fields=["role", "permission_key"],
                condition=Q(deleted_at__isnull=True),
                name="board_role_perm_unique_role_key_when_deleted_at_null",
            ),
        ]

    def __str__(self):
        return f"{self.role_id}:{self.permission_key}"


class BoardMemberRole(BaseModel):
    """Atribuição de função(ões) a um utilizador no board."""

    board = models.ForeignKey("db.Board", on_delete=models.CASCADE, related_name="member_roles")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="member_roles")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="board_member_roles")
    role = models.ForeignKey(BoardRole, on_delete=models.CASCADE, related_name="member_assignments")

    class Meta:
        db_table = "board_member_roles"
        constraints = [
            models.UniqueConstraint(
                fields=["board", "user", "role"],
                condition=Q(deleted_at__isnull=True),
                name="board_member_role_unique_board_user_role_when_deleted_at_null",
            ),
        ]

    def __str__(self):
        return f"{self.user_id} @ {self.board_id} = {self.role_id}"
