import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0154_board_playbook"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="BoardAutomationPackInstall",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
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
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("pack_name", models.CharField(max_length=128)),
                ("pack_version", models.CharField(max_length=32)),
                ("config", models.JSONField(blank=True, default=dict)),
                ("catalog_overlay", models.JSONField(blank=True, default=list)),
                ("hook_ids", models.JSONField(blank=True, default=list)),
                ("rule_ids", models.JSONField(blank=True, default=list)),
                ("installed_at", models.DateTimeField()),
                (
                    "board",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="automation_pack_installs",
                        to="db.board",
                    ),
                ),
                (
                    "installed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="automation_pack_installs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="automation_pack_installs",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "board_automation_pack_installs",
                "ordering": ("-installed_at",),
            },
        ),
        migrations.AddIndex(
            model_name="boardautomationpackinstall",
            index=models.Index(fields=["board", "pack_name"], name="board_auto_pack_board_name_idx"),
        ),
        migrations.AddIndex(
            model_name="boardautomationpackinstall",
            index=models.Index(fields=["workspace", "board"], name="board_auto_pack_ws_board_idx"),
        ),
        migrations.AddConstraint(
            model_name="boardautomationpackinstall",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("board", "pack_name"),
                name="board_automation_pack_install_unique_active",
            ),
        ),
    ]
