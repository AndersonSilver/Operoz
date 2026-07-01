import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0155_board_automation_pack_install"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AssistantActionAudit",
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
                ("tool_name", models.CharField(blank=True, default="", max_length=128)),
                ("action_type", models.CharField(blank=True, default="", max_length=64)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("ok", "Ok"),
                            ("denied", "Denied"),
                            ("proposed", "Proposed"),
                            ("failed", "Failed"),
                        ],
                        default="ok",
                        max_length=16,
                    ),
                ),
                ("payload", models.JSONField(blank=True, default=dict)),
                ("error_code", models.CharField(blank=True, default="", max_length=64)),
                (
                    "session",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="action_audits",
                        to="db.assistantsession",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="assistant_action_audits",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="assistant_action_audits",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "assistant_action_audits",
                "ordering": ("-created_at",),
            },
        ),
        migrations.CreateModel(
            name="AssistantUsageDaily",
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
                ("usage_date", models.DateField()),
                ("prompt_tokens", models.PositiveBigIntegerField(default=0)),
                ("completion_tokens", models.PositiveBigIntegerField(default=0)),
                ("request_count", models.PositiveIntegerField(default=0)),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="assistant_usage_daily",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "assistant_usage_daily",
                "ordering": ("-usage_date",),
            },
        ),
        migrations.AddIndex(
            model_name="assistantactionaudit",
            index=models.Index(fields=["workspace", "-created_at"], name="asst_audit_ws_idx"),
        ),
        migrations.AddIndex(
            model_name="assistantactionaudit",
            index=models.Index(fields=["user", "-created_at"], name="asst_audit_user_idx"),
        ),
        migrations.AddConstraint(
            model_name="assistantusagedaily",
            constraint=models.UniqueConstraint(
                fields=("workspace", "usage_date"),
                name="assistant_usage_ws_date_unique",
            ),
        ),
    ]
