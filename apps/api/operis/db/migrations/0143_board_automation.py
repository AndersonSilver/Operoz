# Board automation rules and runs

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0142_board_gantt_row_logo_props"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="BoardAutomationRule",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                ("id", models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True, default="")),
                ("enabled", models.BooleanField(default=False)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("graph", models.JSONField(default=dict)),
                ("graph_version", models.PositiveSmallIntegerField(default=1)),
                ("board", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="automation_rules", to="db.board")),
                ("created_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_created_by", to=settings.AUTH_USER_MODEL, verbose_name="Created By")),
                ("updated_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_updated_by", to=settings.AUTH_USER_MODEL, verbose_name="Last Modified By")),
                ("workspace", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="board_automation_rules", to="db.workspace")),
            ],
            options={
                "db_table": "board_automation_rules",
                "ordering": ("sort_order", "-created_at"),
            },
        ),
        migrations.CreateModel(
            name="BoardAutomationRun",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                ("id", models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ("event_id", models.CharField(max_length=128)),
                ("event_type", models.CharField(max_length=64)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("running", "Running"), ("success", "Success"), ("failed", "Failed"), ("skipped", "Skipped")], default="pending", max_length=16)),
                ("dry_run", models.BooleanField(default=False)),
                ("context_snapshot", models.JSONField(default=dict)),
                ("step_logs", models.JSONField(default=list)),
                ("error_message", models.TextField(blank=True, default="")),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("finished_at", models.DateTimeField(blank=True, null=True)),
                ("board", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="automation_runs", to="db.board")),
                ("created_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_created_by", to=settings.AUTH_USER_MODEL, verbose_name="Created By")),
                ("rule", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="runs", to="db.boardautomationrule")),
                ("updated_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_updated_by", to=settings.AUTH_USER_MODEL, verbose_name="Last Modified By")),
            ],
            options={
                "db_table": "board_automation_runs",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddIndex(
            model_name="boardautomationrule",
            index=models.Index(fields=["board", "enabled"], name="board_auto_rule_board_en_idx"),
        ),
        migrations.AddIndex(
            model_name="boardautomationrule",
            index=models.Index(fields=["workspace", "board"], name="board_auto_rule_ws_board_idx"),
        ),
        migrations.AddIndex(
            model_name="boardautomationrun",
            index=models.Index(fields=["board", "status"], name="board_auto_run_board_st_idx"),
        ),
        migrations.AddIndex(
            model_name="boardautomationrun",
            index=models.Index(fields=["rule", "created_at"], name="board_auto_run_rule_cr_idx"),
        ),
        migrations.AddConstraint(
            model_name="boardautomationrun",
            constraint=models.UniqueConstraint(condition=models.Q(("dry_run", False)), fields=("rule", "event_id"), name="board_automation_run_rule_event_unique"),
        ),
    ]
