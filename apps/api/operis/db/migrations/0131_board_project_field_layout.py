# Tech4Humans: schema do Projeto (layout + valores custom no projeto)

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


PROJECT_FIELD_DEFAULTS = [
    ("name", "description", 1000, True, "full"),
    ("identifier", "description", 2000, True, "half"),
    ("project_lead", "description", 3000, False, "half"),
    ("description", "description", 4000, False, "full"),
    ("network", "context", 5000, False, "half"),
    ("default_assignee", "context", 6000, False, "half"),
    ("timezone", "context", 7000, False, "half"),
]


def seed_board_project_field_layout(apps, schema_editor):
    Board = apps.get_model("db", "Board")
    BoardProjectFieldLayout = apps.get_model("db", "BoardProjectFieldLayout")
    for board in Board.objects.filter(deleted_at__isnull=True):
        for field_key, section, sort_order, is_required, form_span in PROJECT_FIELD_DEFAULTS:
            BoardProjectFieldLayout.objects.get_or_create(
                board_id=board.id,
                field_source="system",
                standard_field_key=field_key,
                defaults={
                    "workspace_id": board.workspace_id,
                    "section": section,
                    "sort_order": sort_order,
                    "is_required": is_required,
                    "form_span": form_span,
                    "is_enabled": True,
                },
            )


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0130_board_standard_field_estimate_point"),
    ]

    operations = [
        migrations.CreateModel(
            name="BoardProjectFieldLayout",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                (
                    "id",
                    models.UUIDField(
                        db_index=True,
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                (
                    "field_source",
                    models.CharField(
                        choices=[("system", "System"), ("custom", "Custom")],
                        max_length=16,
                    ),
                ),
                (
                    "standard_field_key",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("name", "Name"),
                            ("identifier", "Identifier"),
                            ("description", "Description"),
                            ("project_lead", "Project lead"),
                            ("default_assignee", "Default assignee"),
                            ("network", "Network"),
                            ("timezone", "Timezone"),
                        ],
                        max_length=32,
                        null=True,
                    ),
                ),
                (
                    "section",
                    models.CharField(
                        choices=[("description", "Description"), ("context", "Context")],
                        max_length=16,
                    ),
                ),
                ("sort_order", models.FloatField(default=65535)),
                ("is_required", models.BooleanField(default=False)),
                ("is_enabled", models.BooleanField(default=True)),
                (
                    "form_span",
                    models.CharField(
                        choices=[("half", "Half width"), ("full", "Full width")],
                        default="half",
                        max_length=8,
                    ),
                ),
                (
                    "board",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_field_layouts",
                        to="db.board",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "custom_field",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="board_project_layouts",
                        to="db.workspacecustomfield",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_field_layouts",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Board Project Field Layout",
                "verbose_name_plural": "Board Project Field Layouts",
                "db_table": "board_project_field_layouts",
                "ordering": ("sort_order", "standard_field_key"),
            },
        ),
        migrations.CreateModel(
            name="ProjectCustomFieldValue",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                (
                    "id",
                    models.UUIDField(
                        db_index=True,
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                ("value", models.JSONField(blank=True, default=dict)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "custom_field",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_values",
                        to="db.workspacecustomfield",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="custom_field_values",
                        to="db.project",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_custom_field_values",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Project Custom Field Value",
                "verbose_name_plural": "Project Custom Field Values",
                "db_table": "project_custom_field_values",
            },
        ),
        migrations.AddConstraint(
            model_name="boardprojectfieldlayout",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True), ("field_source", "system")),
                fields=("board", "standard_field_key"),
                name="board_project_layout_unique_board_system_key",
            ),
        ),
        migrations.AddConstraint(
            model_name="boardprojectfieldlayout",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True), ("field_source", "custom")),
                fields=("board", "custom_field"),
                name="board_project_layout_unique_board_custom_field",
            ),
        ),
        migrations.AddConstraint(
            model_name="projectcustomfieldvalue",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("project", "custom_field"),
                name="project_custom_field_value_unique_project_field",
            ),
        ),
        migrations.RunPython(seed_board_project_field_layout, migrations.RunPython.noop),
    ]
