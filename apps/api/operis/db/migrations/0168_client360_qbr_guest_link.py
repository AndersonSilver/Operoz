import operis.db.models.client_360_qbr_guest_link
import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0167_workspace_client360_settings"),
    ]

    operations = [
        migrations.CreateModel(
            name="Client360QbrGuestLink",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to="db.user",
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to="db.user",
                        verbose_name="Last Modified By",
                    ),
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
                    "scope",
                    models.CharField(
                        choices=[("portfolio", "Portfolio"), ("client", "Client")],
                        max_length=16,
                    ),
                ),
                (
                    "token",
                    models.CharField(
                        db_index=True,
                        default=operis.db.models.client_360_qbr_guest_link.generate_qbr_guest_token,
                        max_length=128,
                        unique=True,
                    ),
                ),
                ("expires_at", models.DateTimeField()),
                ("revoked_at", models.DateTimeField(blank=True, null=True)),
                ("period_start", models.DateField()),
                ("period_end", models.DateField()),
                ("weeks", models.PositiveSmallIntegerField(default=13)),
                ("include_compare", models.BooleanField(default=False)),
                ("portfolio_project_ids", models.JSONField(blank=True, default=list)),
                ("access_count", models.PositiveIntegerField(default=0)),
                ("last_accessed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "project",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="client_360_qbr_guest_links",
                        to="db.project",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="client_360_qbr_guest_links",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "client_360_qbr_guest_links",
                "ordering": ("-created_at",),
            },
        ),
        migrations.CreateModel(
            name="Client360QbrGuestAccessLog",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to="db.user",
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to="db.user",
                        verbose_name="Last Modified By",
                    ),
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
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("user_agent", models.CharField(blank=True, default="", max_length=512)),
                (
                    "link",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="access_logs",
                        to="db.client360qbrguestlink",
                    ),
                ),
            ],
            options={
                "db_table": "client_360_qbr_guest_access_logs",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddIndex(
            model_name="client360qbrguestlink",
            index=models.Index(fields=["workspace", "scope"], name="client360_qbr_guest_ws_scope_idx"),
        ),
        migrations.AddIndex(
            model_name="client360qbrguestlink",
            index=models.Index(fields=["expires_at"], name="client360_qbr_guest_exp_idx"),
        ),
    ]
