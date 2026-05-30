# Tech4Humans: Status Report do board (Fase 10a / MV3)

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0132_board_roles"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="BoardStatusReport",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
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
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                ("title", models.CharField(blank=True, default="", max_length=255)),
                ("period_start", models.DateField()),
                ("period_end", models.DateField()),
                ("content", models.JSONField(default=dict)),
                ("published_at", models.DateTimeField(blank=True, null=True)),
                (
                    "board",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="status_reports",
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
                        related_name="board_status_reports",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "board_status_reports",
                "ordering": ("-period_end", "-created_at"),
            },
        ),
        migrations.AddIndex(
            model_name="boardstatusreport",
            index=models.Index(fields=["board", "period_end"], name="board_sr_board_period_idx"),
        ),
        migrations.AddIndex(
            model_name="boardstatusreport",
            index=models.Index(fields=["workspace", "board"], name="board_sr_ws_board_idx"),
        ),
    ]
