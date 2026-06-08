import uuid

import django.db.models.deletion
import operis.db.models.intake_form
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0147_board_automation_draft_publish"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="IntakeForm",
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
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("header_title", models.CharField(blank=True, max_length=255)),
                (
                    "anchor",
                    models.CharField(
                        db_index=True,
                        default=operis.db.models.intake_form.get_intake_form_anchor,
                        max_length=255,
                        unique=True,
                    ),
                ),
                ("is_published", models.BooleanField(default=False)),
                ("fields", models.JSONField(default=operis.db.models.intake_form.default_intake_form_fields)),
                ("defaults", models.JSONField(blank=True, default=dict)),
                ("submit_message", models.TextField(blank=True, default="")),
                ("require_auth", models.BooleanField(default=False)),
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
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_%(class)s",
                        to="db.project",
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
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_%(class)s",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "IntakeForm",
                "verbose_name_plural": "IntakeForms",
                "db_table": "intake_forms",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddConstraint(
            model_name="intakeform",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("project", "name"),
                name="intake_form_unique_name_project_when_deleted_at_null",
            ),
        ),
        migrations.AddField(
            model_name="intakeissue",
            name="intake_form",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="submissions",
                to="db.intakeform",
            ),
        ),
    ]
