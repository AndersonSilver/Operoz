import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("db", "0184_intake_form_slug_anchors"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="CustomSlashCommand",
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
                    "name",
                    models.CharField(
                        help_text="Nome do comando no Discord (lowercase, sem espaços).",
                        max_length=32,
                    ),
                ),
                (
                    "description",
                    models.CharField(
                        help_text="Descrição curta exibida no cliente Discord.",
                        max_length=100,
                    ),
                ),
                (
                    "prompt_instructions",
                    models.TextField(
                        help_text="Instruções personalizadas injetadas no prompt do assistente Operoz.",
                    ),
                ),
                (
                    "discord_command_id",
                    models.CharField(
                        blank=True,
                        help_text="Snowflake retornado pela API do Discord após o registro.",
                        max_length=32,
                        null=True,
                    ),
                ),
                (
                    "guild_id",
                    models.CharField(
                        blank=True,
                        help_text="Se preenchido, registra como comando de guild; caso contrário, global.",
                        max_length=32,
                        null=True,
                    ),
                ),
                ("is_enabled", models.BooleanField(default=True)),
                (
                    "registration_status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("synced", "Synced"),
                            ("failed", "Failed"),
                        ],
                        default="pending",
                        max_length=16,
                    ),
                ),
                ("registration_error", models.TextField(blank=True)),
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
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="discord_slash_commands",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Custom Slash Command",
                "verbose_name_plural": "Custom Slash Commands",
                "db_table": "discord_custom_slash_commands",
                "ordering": ("name",),
            },
        ),
        migrations.AddConstraint(
            model_name="customslashcommand",
            constraint=models.UniqueConstraint(
                fields=("workspace", "name", "guild_id"),
                name="discord_slash_command_unique_scope",
            ),
        ),
    ]
