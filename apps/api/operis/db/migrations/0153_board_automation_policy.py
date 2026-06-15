import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0152_board_automation_hook"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="boardautomationrule",
            name="dry_run_verified_version",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.CreateModel(
            name="BoardAutomationPolicy",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
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
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                (
                    "id",
                    models.UUIDField(
                        db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True
                    ),
                ),
                ("webhook_allowlist_enabled", models.BooleanField(default=False)),
                ("webhook_allowed_domains", models.JSONField(blank=True, default=list)),
                ("script_timeout_seconds", models.PositiveIntegerField(default=10)),
                ("script_max_memory_mb", models.PositiveIntegerField(default=128)),
                ("script_block_dangerous_imports", models.BooleanField(default=True)),
                ("require_dry_run_before_enable", models.BooleanField(default=False)),
                (
                    "board",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="automation_policy",
                        to="db.board",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="board_automation_policies",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "board_automation_policies",
            },
        ),
        migrations.CreateModel(
            name="BoardAutomationPublishAudit",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
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
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                (
                    "id",
                    models.UUIDField(
                        db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True
                    ),
                ),
                ("published_version", models.PositiveIntegerField()),
                ("graph_diff", models.JSONField(blank=True, default=dict)),
                ("published_at", models.DateTimeField()),
                (
                    "board",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="automation_publish_audits",
                        to="db.board",
                    ),
                ),
                (
                    "published_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="automation_publish_audits",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "rule",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="publish_audits",
                        to="db.boardautomationrule",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="automation_publish_audits",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "board_automation_publish_audits",
                "ordering": ("-published_at",),
            },
        ),
        migrations.AddIndex(
            model_name="boardautomationpublishaudit",
            index=models.Index(fields=["board", "published_at"], name="board_auto_pub_board_dt_idx"),
        ),
        migrations.AddIndex(
            model_name="boardautomationpublishaudit",
            index=models.Index(fields=["rule", "published_at"], name="board_auto_pub_rule_dt_idx"),
        ),
    ]
