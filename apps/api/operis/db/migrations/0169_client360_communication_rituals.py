import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0168_client360_qbr_guest_link"),
    ]

    operations = [
        migrations.AddField(
            model_name="boardclient360healthsettings",
            name="status_report_reminder_email",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="boardclient360healthsettings",
            name="status_report_reminder_enabled",
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name="Client360Narrative",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
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
                ("wins_md", models.TextField(blank=True, default="")),
                ("risks_md", models.TextField(blank=True, default="")),
                ("next_steps_md", models.TextField(blank=True, default="")),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="client_360_narratives",
                        to="db.project",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="client_360_narratives",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "client_360_narratives",
            },
        ),
        migrations.CreateModel(
            name="Client360StatusReportReminderLog",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
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
                ("notified_count", models.PositiveIntegerField(default=0)),
                ("skipped_count", models.PositiveIntegerField(default=0)),
                ("details", models.JSONField(blank=True, default=list)),
                (
                    "board",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="client_360_status_report_reminder_logs",
                        to="db.board",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="client_360_status_report_reminder_logs",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "client_360_status_report_reminder_logs",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddConstraint(
            model_name="client360narrative",
            constraint=models.UniqueConstraint(
                fields=("project", "period_start"),
                name="client360_narrative_project_week_uniq",
            ),
        ),
        migrations.AddIndex(
            model_name="client360statusreportreminderlog",
            index=models.Index(fields=["board", "period_start"], name="client360_sr_rem_log_board_idx"),
        ),
    ]
