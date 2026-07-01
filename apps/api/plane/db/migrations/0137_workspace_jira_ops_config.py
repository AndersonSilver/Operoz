# Generated manually for Operis Jira OPS per-workspace config

import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0136_board_status_report_permissions"),
    ]

    operations = [
        migrations.CreateModel(
            name="WorkspaceJiraOpsConfig",
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
                    "deleted_at",
                    models.DateTimeField(blank=True, null=True, verbose_name="Deleted At"),
                ),
                ("cloud_id", models.CharField(blank=True, default="", max_length=64)),
                ("email", models.EmailField(blank=True, default="", max_length=254)),
                ("api_token_encrypted", models.TextField(blank=True, default="")),
                ("project_key", models.CharField(default="OPS", max_length=32)),
                (
                    "board_slug",
                    models.CharField(default="squad-as-a-services", max_length=48),
                ),
                ("last_sync_at", models.DateTimeField(blank=True, null=True)),
                (
                    "workspace",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="jira_ops_config",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Workspace Jira OPS Config",
                "verbose_name_plural": "Workspace Jira OPS Configs",
                "db_table": "workspace_jira_ops_configs",
            },
        ),
    ]
