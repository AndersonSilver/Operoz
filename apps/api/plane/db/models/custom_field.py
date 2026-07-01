# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models
from django.db.models import Q

from .base import BaseModel
from .project import ProjectBaseModel


class CustomFieldType(models.TextChoices):
    TEXT = "text", "Text"
    PARAGRAPH = "paragraph", "Paragraph"
    DATE = "date", "Date"
    NUMBER = "number", "Number"
    DATETIME = "datetime", "Date and time"
    CATEGORIES = "categories", "Categories"
    SELECT = "select", "Select"
    CHECKBOX = "checkbox", "Checkbox"
    MEMBER = "member", "Member"
    MULTI_SELECT = "multi_select", "Multi select"
    URL = "url", "URL"

    @classmethod
    def option_field_types(cls):
        return {cls.SELECT.value, cls.MULTI_SELECT.value, cls.CATEGORIES.value}


class WorkspaceCustomField(BaseModel):
    """Catálogo de campos custom do workspace (Tech4Humans BC-2)."""

    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="workspace_custom_fields"
    )
    name = models.CharField(max_length=255)
    key = models.SlugField(max_length=48, db_index=True)
    description = models.TextField(blank=True, default="")
    field_type = models.CharField(max_length=32, choices=CustomFieldType.choices)
    settings = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Workspace Custom Field"
        verbose_name_plural = "Workspace Custom Fields"
        db_table = "workspace_custom_fields"
        ordering = ("name",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "key"],
                condition=Q(deleted_at__isnull=True),
                name="workspace_custom_field_unique_key_when_deleted_at_null",
            ),
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=Q(deleted_at__isnull=True),
                name="workspace_custom_field_unique_name_when_deleted_at_null",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.field_type})"


class ProjectStandardFieldKey(models.TextChoices):
    """Campos nativos do projeto (épico) configuráveis por board."""

    NAME = "name", "Name"
    IDENTIFIER = "identifier", "Identifier"
    DESCRIPTION = "description", "Description"
    PROJECT_LEAD = "project_lead", "Project lead"
    RESPONSIBLE_STAKEHOLDER = "responsible_stakeholder", "Responsible stakeholder"
    DEFAULT_ASSIGNEE = "default_assignee", "Default assignee"
    NETWORK = "network", "Network"
    TIMEZONE = "timezone", "Timezone"


class BoardProjectFieldSection(models.TextChoices):
    DESCRIPTION = "description", "Description"
    CONTEXT = "context", "Context"


class BoardProjectFieldSource(models.TextChoices):
    SYSTEM = "system", "System"
    CUSTOM = "custom", "Custom"


class StandardFieldKey(models.TextChoices):
    """Campos nativos do card (configuráveis por board, não removíveis do workspace)."""

    PRIORITY = "priority", "Priority"
    LABEL_IDS = "label_ids", "Labels"
    START_DATE = "start_date", "Start date"
    TARGET_DATE = "target_date", "Due date"
    CYCLE_ID = "cycle_id", "Cycle"
    MODULE_IDS = "module_ids", "Modules"
    ESTIMATE_POINT = "estimate_point", "Estimate"
    PARENT_ID = "parent_id", "Parent"


class BoardFieldFormSpan(models.TextChoices):
    HALF = "half", "Half width"
    FULL = "full", "Full width"


class BoardStandardField(BaseModel):
    """Campos padrão do card activos num board (toggle por board)."""

    board = models.ForeignKey("db.Board", on_delete=models.CASCADE, related_name="board_standard_fields")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="board_standard_fields")
    field_key = models.CharField(max_length=32, choices=StandardFieldKey.choices)
    sort_order = models.FloatField(default=65535)
    is_enabled = models.BooleanField(default=True)
    form_span = models.CharField(
        max_length=8,
        choices=BoardFieldFormSpan.choices,
        default=BoardFieldFormSpan.HALF,
    )

    class Meta:
        verbose_name = "Board Standard Field"
        verbose_name_plural = "Board Standard Fields"
        db_table = "board_standard_fields"
        ordering = ("sort_order", "field_key")
        constraints = [
            models.UniqueConstraint(
                fields=["board", "field_key"],
                condition=Q(deleted_at__isnull=True),
                name="board_standard_field_unique_board_key_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.board} - {self.field_key}"


class BoardCustomField(BaseModel):
    """Campos custom activos num board."""

    board = models.ForeignKey("db.Board", on_delete=models.CASCADE, related_name="board_custom_fields")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="board_custom_fields")
    custom_field = models.ForeignKey(
        WorkspaceCustomField, on_delete=models.CASCADE, related_name="board_custom_fields"
    )
    sort_order = models.FloatField(default=65535)
    is_enabled = models.BooleanField(default=True)
    form_span = models.CharField(
        max_length=8,
        choices=BoardFieldFormSpan.choices,
        default=BoardFieldFormSpan.HALF,
    )

    class Meta:
        verbose_name = "Board Custom Field"
        verbose_name_plural = "Board Custom Fields"
        db_table = "board_custom_fields"
        ordering = ("sort_order", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["board", "custom_field"],
                condition=Q(deleted_at__isnull=True),
                name="board_custom_field_unique_board_field_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.board} - {self.custom_field}"


class ProjectCustomField(ProjectBaseModel):
    """Campos custom disponíveis num projeto (sincronizados do board)."""

    custom_field = models.ForeignKey(
        WorkspaceCustomField, on_delete=models.CASCADE, related_name="project_custom_fields"
    )
    sort_order = models.FloatField(default=65535)

    class Meta:
        verbose_name = "Project Custom Field"
        verbose_name_plural = "Project Custom Fields"
        db_table = "project_custom_fields"
        ordering = ("sort_order", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["project", "custom_field"],
                condition=Q(deleted_at__isnull=True),
                name="project_custom_field_unique_project_field_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.project} - {self.custom_field}"


class BoardProjectFieldLayout(BaseModel):
    """Layout do formulário de Projeto (épico) por board — ordem, secção, obrigatoriedade."""

    board = models.ForeignKey(
        "db.Board", on_delete=models.CASCADE, related_name="project_field_layouts"
    )
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="project_field_layouts"
    )
    field_source = models.CharField(max_length=16, choices=BoardProjectFieldSource.choices)
    standard_field_key = models.CharField(
        max_length=32, choices=ProjectStandardFieldKey.choices, null=True, blank=True
    )
    custom_field = models.ForeignKey(
        WorkspaceCustomField,
        on_delete=models.CASCADE,
        related_name="board_project_layouts",
        null=True,
        blank=True,
    )
    section = models.CharField(max_length=16, choices=BoardProjectFieldSection.choices)
    sort_order = models.FloatField(default=65535)
    is_required = models.BooleanField(default=False)
    is_enabled = models.BooleanField(default=True)
    form_span = models.CharField(
        max_length=8,
        choices=BoardFieldFormSpan.choices,
        default=BoardFieldFormSpan.HALF,
    )

    class Meta:
        verbose_name = "Board Project Field Layout"
        verbose_name_plural = "Board Project Field Layouts"
        db_table = "board_project_field_layouts"
        ordering = ("sort_order", "standard_field_key")
        constraints = [
            models.UniqueConstraint(
                fields=["board", "standard_field_key"],
                condition=Q(deleted_at__isnull=True, field_source="system"),
                name="board_project_layout_unique_board_system_key",
            ),
            models.UniqueConstraint(
                fields=["board", "custom_field"],
                condition=Q(deleted_at__isnull=True, field_source="custom"),
                name="board_project_layout_unique_board_custom_field",
            ),
        ]

    def __str__(self):
        if self.field_source == BoardProjectFieldSource.SYSTEM:
            return f"{self.board} - {self.standard_field_key}"
        return f"{self.board} - custom:{self.custom_field_id}"


class ProjectCustomFieldValue(ProjectBaseModel):
    """Valor de um campo custom num projeto (épico)."""

    custom_field = models.ForeignKey(
        WorkspaceCustomField, on_delete=models.CASCADE, related_name="project_values"
    )
    value = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Project Custom Field Value"
        verbose_name_plural = "Project Custom Field Values"
        db_table = "project_custom_field_values"
        constraints = [
            models.UniqueConstraint(
                fields=["project", "custom_field"],
                condition=Q(deleted_at__isnull=True),
                name="project_custom_field_value_unique_project_field",
            )
        ]

    def __str__(self):
        return f"{self.project_id} - {self.custom_field_id}"


class IssueCustomFieldValue(ProjectBaseModel):
    """Valor de um campo custom num card."""

    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="custom_field_values")
    custom_field = models.ForeignKey(
        WorkspaceCustomField, on_delete=models.CASCADE, related_name="issue_values"
    )
    value = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Issue Custom Field Value"
        verbose_name_plural = "Issue Custom Field Values"
        db_table = "issue_custom_field_values"
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "custom_field"],
                condition=Q(deleted_at__isnull=True),
                name="issue_custom_field_value_unique_issue_field_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.issue_id} - {self.custom_field_id}"
