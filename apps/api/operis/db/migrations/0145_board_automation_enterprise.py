# Board automation enterprise: outbox, DLQ, secrets, audit fields

import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0144_board_automation_assets"),
    ]

    operations = [
        migrations.AddField(
            model_name="boardautomationrun",
            name="correlation_id",
            field=models.CharField(blank=True, default="", max_length=128),
        ),
        migrations.AddField(
            model_name="boardautomationrun",
            name="graph_snapshot",
            field=models.JSONField(default=dict),
        ),
        migrations.AddField(
            model_name="boardautomationrun",
            name="graph_version",
            field=models.PositiveSmallIntegerField(default=1),
        ),
        migrations.CreateModel(
            name="BoardAutomationOutbox",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(null=True, blank=True, verbose_name="Deleted At")),
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
                ("event_id", models.CharField(max_length=128)),
                ("event_payload", models.JSONField(default=dict)),
                (
                    "status",
                    models.CharField(
                        choices=[("pending", "Pending"), ("enqueued", "Enqueued"), ("failed", "Failed")],
                        default="pending",
                        max_length=16,
                    ),
                ),
                ("error_message", models.TextField(blank=True, default="")),
                ("enqueued_at", models.DateTimeField(blank=True, null=True)),
                (
                    "board",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="automation_outbox",
                        to="db.board",
                    ),
                ),
                (
                    "rule",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="outbox_entries",
                        to="db.boardautomationrule",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="automation_outbox",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "board_automation_outbox",
                "ordering": ("-created_at",),
            },
        ),
        migrations.CreateModel(
            name="BoardAutomationDeadLetter",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(null=True, blank=True, verbose_name="Deleted At")),
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
                ("event_id", models.CharField(max_length=128)),
                ("event_payload", models.JSONField(default=dict)),
                ("error_message", models.TextField(blank=True, default="")),
                ("traceback_text", models.TextField(blank=True, default="")),
                ("retry_count", models.PositiveSmallIntegerField(default=0)),
                ("celery_task_id", models.CharField(blank=True, default="", max_length=128)),
                (
                    "board",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="automation_dlq",
                        to="db.board",
                    ),
                ),
                (
                    "rule",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="dead_letters",
                        to="db.boardautomationrule",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="automation_dlq",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "board_automation_dead_letters",
                "ordering": ("-created_at",),
            },
        ),
        migrations.CreateModel(
            name="BoardAutomationSecret",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(null=True, blank=True, verbose_name="Deleted At")),
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
                ("key", models.CharField(max_length=128)),
                ("value_encrypted", models.TextField()),
                ("description", models.TextField(blank=True, default="")),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="automation_secrets",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "board_automation_secrets",
                "ordering": ("key",),
            },
        ),
        migrations.AddIndex(
            model_name="boardautomationoutbox",
            index=models.Index(fields=["status", "created_at"], name="board_auto_outbox_status_idx"),
        ),
        migrations.AddIndex(
            model_name="boardautomationoutbox",
            index=models.Index(fields=["board", "event_id"], name="board_auto_outbox_board_evt_idx"),
        ),
        migrations.AddIndex(
            model_name="boardautomationdeadletter",
            index=models.Index(fields=["board", "created_at"], name="board_auto_dlq_board_idx"),
        ),
        migrations.AddIndex(
            model_name="boardautomationdeadletter",
            index=models.Index(fields=["workspace", "created_at"], name="board_auto_dlq_workspace_idx"),
        ),
        migrations.AddConstraint(
            model_name="boardautomationsecret",
            constraint=models.UniqueConstraint(
                fields=("workspace", "key"),
                name="board_automation_secret_workspace_key_unique",
            ),
        ),
    ]
