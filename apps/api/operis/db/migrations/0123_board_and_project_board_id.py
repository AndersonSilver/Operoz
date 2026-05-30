# Tech4Humans: Board model + Project.board_id (D9, D10)

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import operis.db.models.workspace


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0122_workspace_issue_email_notification_flags"),
    ]

    operations = [
        migrations.CreateModel(
            name="Board",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
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
                ("name", models.CharField(max_length=255, verbose_name="Board Name")),
                (
                    "slug",
                    models.SlugField(
                        max_length=48,
                        validators=[operis.db.models.workspace.slug_validator],
                    ),
                ),
                ("description", models.TextField(blank=True, default="")),
                ("logo_props", models.JSONField(default=dict)),
                ("sort_order", models.FloatField(default=65535)),
                ("archived_at", models.DateTimeField(blank=True, null=True)),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="boards",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Board",
                "verbose_name_plural": "Boards",
                "db_table": "boards",
                "ordering": ("sort_order", "-created_at"),
            },
        ),
        migrations.AddConstraint(
            model_name="board",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("workspace", "slug"),
                name="board_unique_slug_workspace_when_deleted_at_null",
            ),
        ),
        migrations.AddConstraint(
            model_name="board",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("workspace", "name"),
                name="board_unique_name_workspace_when_deleted_at_null",
            ),
        ),
        migrations.AddField(
            model_name="project",
            name="board",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="board_projects",
                to="db.board",
            ),
        ),
    ]
