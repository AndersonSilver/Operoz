import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0151_search_embedding_pgvector"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="BoardAutomationHook",
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
                ("name", models.CharField(max_length=255)),
                ("enabled", models.BooleanField(default=True)),
                (
                    "event",
                    models.CharField(
                        choices=[
                            ("pre_dispatch", "Pre dispatch"),
                            ("pre_action", "Pre action"),
                            ("post_action", "Post action"),
                            ("on_failure", "On failure"),
                            ("on_complete", "On complete"),
                        ],
                        max_length=32,
                    ),
                ),
                ("matcher", models.CharField(blank=True, default="", max_length=128)),
                (
                    "handler_type",
                    models.CharField(
                        choices=[
                            ("block_catalog_key", "Block catalog key"),
                            ("webhook_domain_allowlist", "Webhook domain allowlist"),
                            ("record_metric", "Record metric"),
                        ],
                        max_length=64,
                    ),
                ),
                ("config", models.JSONField(blank=True, default=dict)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                (
                    "board",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="automation_hooks",
                        to="db.board",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="board_automation_hooks",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "board_automation_hooks",
                "ordering": ("sort_order", "-created_at"),
            },
        ),
        migrations.AddIndex(
            model_name="boardautomationhook",
            index=models.Index(fields=["board", "event", "enabled"], name="board_auto_hook_board_evt_idx"),
        ),
        migrations.AddIndex(
            model_name="boardautomationhook",
            index=models.Index(fields=["workspace", "board"], name="board_auto_hook_ws_board_idx"),
        ),
    ]
