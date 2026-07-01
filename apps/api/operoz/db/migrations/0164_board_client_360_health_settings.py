import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0163_assistant_chat_job_queue_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="BoardClient360HealthSettings",
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
                (
                    "weight_report",
                    models.PositiveSmallIntegerField(default=60),
                ),
                (
                    "weight_overdue",
                    models.PositiveSmallIntegerField(default=25),
                ),
                (
                    "weight_support",
                    models.PositiveSmallIntegerField(default=15),
                ),
                (
                    "threshold_ok_min",
                    models.PositiveSmallIntegerField(default=70),
                ),
                (
                    "threshold_warning_min",
                    models.PositiveSmallIntegerField(default=45),
                ),
                (
                    "board",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="client_360_health_settings",
                        to="db.board",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="board_client_360_health_settings",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "board_client_360_health_settings",
            },
        ),
    ]
