import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0198_board_intake_form_unique_scope"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ProjectContact",
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
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                (
                    "category",
                    models.CharField(
                        choices=[("responsible", "Responsável"), ("stakeholder", "Stakeholder")],
                        max_length=16,
                    ),
                ),
                ("full_name", models.CharField(max_length=255, verbose_name="Nome completo")),
                ("email", models.EmailField(blank=True, default="", max_length=254)),
                ("role", models.CharField(blank=True, default="", max_length=255, verbose_name="Cargo")),
                ("whatsapp", models.CharField(blank=True, default="", max_length=32)),
                ("is_lead", models.BooleanField(default=False)),
                ("sort_order", models.FloatField(default=65535)),
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
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="contacts",
                        to="db.project",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_contacts",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Project Contact",
                "verbose_name_plural": "Project Contacts",
                "db_table": "project_contacts",
                "ordering": ("category", "sort_order", "created_at"),
            },
        ),
    ]
