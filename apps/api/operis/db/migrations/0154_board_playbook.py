# Generated manually for Board Playbooks (Fase 3)

import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0153_board_automation_policy"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="BoardPlaybook",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
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
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=255)),
                ("slug", models.SlugField(max_length=128)),
                ("description", models.TextField(blank=True, default="")),
                ("draft_markdown", models.TextField(blank=True, default="")),
                ("published_markdown", models.TextField(blank=True, default="")),
                ("published_version", models.PositiveIntegerField(default=0)),
                ("published_at", models.DateTimeField(blank=True, null=True)),
                ("is_active", models.BooleanField(default=True)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                (
                    "board",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="playbooks",
                        to="db.board",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="board_playbooks",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "board_playbooks",
                "ordering": ("sort_order", "-created_at"),
            },
        ),
        migrations.AddIndex(
            model_name="boardplaybook",
            index=models.Index(fields=["board", "is_active"], name="board_playb_board_i_6f0a2a_idx"),
        ),
        migrations.AddIndex(
            model_name="boardplaybook",
            index=models.Index(fields=["workspace", "board"], name="board_playb_workspa_91c4e1_idx"),
        ),
        migrations.AddConstraint(
            model_name="boardplaybook",
            constraint=models.UniqueConstraint(fields=("board", "slug"), name="board_playbook_board_slug_unique"),
        ),
    ]
