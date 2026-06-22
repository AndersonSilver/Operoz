from __future__ import annotations

import re

from rest_framework import serializers

from operis.db.models import Board, Project
from operis.discord_integration.models import DISCORD_COMMAND_NAME_PATTERN, CustomSlashCommand

DISCORD_NAME_RE = re.compile(r"^[\w-]{1,32}$")


class CustomSlashCommandSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomSlashCommand
        fields = [
            "id",
            "name",
            "description",
            "prompt_instructions",
            "guild_id",
            "board_slug",
            "default_project",
            "is_enabled",
            "discord_command_id",
            "registration_status",
            "registration_error",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "discord_command_id",
            "registration_status",
            "registration_error",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value: str) -> str:
        normalized = value.lower().strip()
        if not DISCORD_NAME_RE.match(normalized):
            raise serializers.ValidationError(
                "Use apenas letras, números, underscore e hífen (máx. 32 caracteres)."
            )
        return normalized

    def validate_description(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("A descrição é obrigatória.")
        if len(cleaned) > 100:
            raise serializers.ValidationError("Máximo de 100 caracteres (limite Discord).")
        return cleaned

    def validate_prompt_instructions(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("As instruções do prompt são obrigatórias.")
        return cleaned

    def validate_guild_id(self, value: str | None) -> str:
        cleaned = (value or "").strip()
        if not cleaned:
            raise serializers.ValidationError("Guild ID é obrigatório para isolar comandos por servidor Discord.")
        return cleaned

    def validate(self, attrs):
        name = attrs.get("name") or getattr(self.instance, "name", "")
        guild_id = attrs.get("guild_id", getattr(self.instance, "guild_id", None))
        workspace = self.context.get("workspace")
        board_slug = attrs.get("board_slug", getattr(self.instance, "board_slug", ""))
        default_project = attrs.get("default_project", getattr(self.instance, "default_project", None))

        if board_slug is not None:
            attrs["board_slug"] = board_slug.strip()

        if workspace and board_slug and not Board.objects.filter(
            workspace=workspace,
            slug=board_slug.strip(),
            deleted_at__isnull=True,
        ).exists():
            raise serializers.ValidationError({"board_slug": "Board não encontrado neste workspace."})

        if workspace and default_project is not None:
            if default_project and not Project.objects.filter(
                pk=default_project.pk,
                workspace=workspace,
                archived_at__isnull=True,
            ).exists():
                raise serializers.ValidationError(
                    {"default_project": "Projeto não pertence a este workspace."}
                )

        if workspace and name:
            qs = CustomSlashCommand.objects.filter(
                workspace=workspace,
                name=name.lower().strip(),
                guild_id=guild_id,
                deleted_at__isnull=True,
            )
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {"name": "Já existe um comando com este nome neste escopo."}
                )

        if name and not DISCORD_COMMAND_NAME_PATTERN.match(name.lower().strip()):
            raise serializers.ValidationError({"name": "Nome de comando inválido para o Discord."})

        effective_guild_id = attrs.get("guild_id")
        if effective_guild_id is None and self.instance:
            effective_guild_id = self.instance.guild_id
        if not str(effective_guild_id or "").strip():
            raise serializers.ValidationError(
                {"guild_id": "Guild ID é obrigatório para isolar comandos por servidor Discord."}
            )

        return attrs
