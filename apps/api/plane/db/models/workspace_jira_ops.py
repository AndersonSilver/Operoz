# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models

from plane.db.models import BaseModel


class WorkspaceJiraOpsConfig(BaseModel):
    """Credenciais e parâmetros Jira OPS por workspace."""

    workspace = models.OneToOneField(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="jira_ops_config",
    )
    oauth_app_client_id = models.CharField(max_length=255, blank=True, default="")
    oauth_app_client_secret_encrypted = models.TextField(blank=True, default="")
    cloud_id = models.CharField(max_length=64, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    api_token_encrypted = models.TextField(blank=True, default="")
    oauth_access_token_encrypted = models.TextField(blank=True, default="")
    oauth_refresh_token_encrypted = models.TextField(blank=True, default="")
    oauth_expires_at = models.DateTimeField(null=True, blank=True)
    jira_site_name = models.CharField(max_length=255, blank=True, default="")
    project_key = models.CharField(max_length=32, default="OPS")
    board_slug = models.CharField(max_length=48, default="squad-as-a-services")
    last_sync_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "workspace_jira_ops_configs"
        verbose_name = "Workspace Jira OPS Config"
        verbose_name_plural = "Workspace Jira OPS Configs"

    def __str__(self) -> str:
        return f"Jira OPS — {self.workspace.slug}"
