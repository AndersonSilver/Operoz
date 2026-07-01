import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0164_board_client_360_health_settings"),
    ]

    operations = [
        migrations.CreateModel(
            name="Client360HealthSnapshot",
            fields=[
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="Created At"),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True, verbose_name="Last Modified At"),
                ),
                (
                    "deleted_at",
                    models.DateTimeField(blank=True, null=True, verbose_name="Deleted At"),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to="db.user",
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to="db.user",
                        verbose_name="Last Modified By",
                    ),
                ),
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
                ("period_start", models.DateField()),
                ("period_end", models.DateField()),
                ("health_score", models.PositiveSmallIntegerField()),
                (
                    "health",
                    models.CharField(
                        choices=[
                            ("ok", "Ok"),
                            ("warning", "Warning"),
                            ("critical", "Critical"),
                        ],
                        max_length=16,
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="client_360_health_snapshots",
                        to="db.project",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="client_360_health_snapshots",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "client_360_health_snapshots",
                "ordering": ("period_start",),
                "indexes": [
                    models.Index(fields=["project", "period_start"], name="client360_hs_proj_week_idx"),
                    models.Index(fields=["workspace", "period_start"], name="client360_hs_ws_week_idx"),
                ],
            },
        ),
        migrations.AddConstraint(
            model_name="client360healthsnapshot",
            constraint=models.UniqueConstraint(
                fields=("project", "period_start"),
                name="client360_health_snapshot_project_week_uniq",
            ),
        ),
    ]
