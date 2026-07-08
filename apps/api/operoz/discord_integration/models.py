import re

from django.core.exceptions import ValidationError
from django.db import models

from operoz.db.models import BaseModel

DISCORD_COMMAND_NAME_PATTERN = re.compile(r"^[\w-]{1,32}$")


class CustomSlashCommand(BaseModel):
    """Slash command dinâmico do Operoz, sincronizado com a API do Discord."""

    class RegistrationStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        SYNCED = "synced", "Synced"
        FAILED = "failed", "Failed"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="discord_slash_commands",
    )
    name = models.CharField(
        max_length=32,
        help_text="Nome do comando no Discord (lowercase, sem espaços).",
    )
    description = models.CharField(
        max_length=100,
        help_text="Descrição curta exibida no cliente Discord.",
    )
    prompt_instructions = models.TextField(
        help_text="Instruções personalizadas injetadas no prompt do assistente Operoz.",
    )
    discord_command_id = models.CharField(
        max_length=32,
        blank=True,
        null=True,
        help_text="Snowflake retornado pela API do Discord após o registro.",
    )
    guild_id = models.CharField(
        max_length=32,
        blank=True,
        null=True,
        help_text="Se preenchido, registra como comando de guild; caso contrário, global.",
    )
    board_slug = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Board Operoz usado pelo assistente ao executar o comando (opcional).",
    )
    default_project = models.ForeignKey(
        "db.Project",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="discord_slash_commands",
        help_text="Projeto/cliente em foco para ferramentas do assistente (opcional).",
    )
    is_enabled = models.BooleanField(default=True)
    registration_status = models.CharField(
        max_length=16,
        choices=RegistrationStatus.choices,
        default=RegistrationStatus.PENDING,
    )
    registration_error = models.TextField(blank=True)

    class Meta:
        db_table = "discord_custom_slash_commands"
        verbose_name = "Custom Slash Command"
        verbose_name_plural = "Custom Slash Commands"
        ordering = ("name",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name", "guild_id"],
                name="discord_slash_command_unique_scope",
            ),
        ]

    def __str__(self) -> str:
        scope = f"guild:{self.guild_id}" if self.guild_id else "global"
        return f"/{self.name} ({scope})"

    def clean(self) -> None:
        super().clean()
        normalized_name = self.name.lower().strip()
        if normalized_name != self.name:
            raise ValidationError({"name": "O nome deve estar em lowercase."})
        if not DISCORD_COMMAND_NAME_PATTERN.match(self.name):
            raise ValidationError({"name": "Use apenas letras, números, underscore e hífen (máx. 32 caracteres)."})

    def save(self, *args, **kwargs) -> None:
        self.name = self.name.lower().strip()
        super().save(*args, **kwargs)
