import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0149_board_automation_schedule_slot"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AssistantSession",
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
                ("created_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_created_by", to=settings.AUTH_USER_MODEL, verbose_name="Created By")),
                ("updated_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_updated_by", to=settings.AUTH_USER_MODEL, verbose_name="Last Modified By")),
                ("title", models.CharField(blank=True, default="", max_length=255)),
                ("context", models.JSONField(blank=True, default=dict)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="assistant_sessions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="assistant_sessions",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "assistant_sessions",
                "ordering": ("-created_at",),
            },
        ),
        migrations.CreateModel(
            name="AssistantMessage",
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
                ("created_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_created_by", to=settings.AUTH_USER_MODEL, verbose_name="Created By")),
                ("updated_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_updated_by", to=settings.AUTH_USER_MODEL, verbose_name="Last Modified By")),
                ("role", models.CharField(choices=[("user", "User"), ("assistant", "Assistant"), ("tool", "Tool"), ("system", "System")], max_length=16)),
                ("content", models.TextField(blank=True, default="")),
                ("tool_calls", models.JSONField(blank=True, default=list)),
                ("tool_call_id", models.CharField(blank=True, default="", max_length=128)),
                ("citations", models.JSONField(blank=True, default=list)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                (
                    "session",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="messages",
                        to="db.assistantsession",
                    ),
                ),
            ],
            options={
                "db_table": "assistant_messages",
                "ordering": ("created_at",),
            },
        ),
        migrations.AddIndex(
            model_name="assistantsession",
            index=models.Index(fields=["workspace", "user", "-created_at"], name="asst_sess_ws_user_idx"),
        ),
        migrations.AddIndex(
            model_name="assistantmessage",
            index=models.Index(fields=["session", "created_at"], name="asst_msg_session_idx"),
        ),
    ]
