from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

import httpx
from django.conf import settings

from operoz.discord_integration.models import CustomSlashCommand

logger = logging.getLogger(__name__)

DISCORD_API_BASE = "https://discord.com/api/v10"


class DiscordSlashCommandSyncError(Exception):
    """Falha ao sincronizar um slash command com a API do Discord."""


@dataclass(frozen=True)
class DiscordSlashCommandPayload:
    name: str
    description: str
    type: int = 1  # CHAT_INPUT
    include_foco_option: bool = True

    def to_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "name": self.name,
            "description": self.description,
            "type": self.type,
        }
        if self.include_foco_option:
            payload["options"] = [
                {
                    "type": 3,
                    "name": "foco",
                    "description": "Cliente, tema ou pergunta (ex.: SICREDI, riscos, só backend)",
                    "required": False,
                }
            ]
        return payload


class DiscordSlashCommandService:
    """
    Cliente fino para registrar/atualizar slash commands na API do Discord.

    Escopo:
    - Global: PUT/POST/PATCH/DELETE em /applications/{id}/commands
    - Guild:  idem em /applications/{id}/guilds/{guild_id}/commands

    Referência: https://discord.com/developers/docs/interactions/application-commands
    """

    def __init__(
        self,
        *,
        application_id: str | None = None,
        bot_token: str | None = None,
        client: httpx.Client | None = None,
    ) -> None:
        self.application_id = application_id or getattr(settings, "DISCORD_APPLICATION_ID", "")
        self.bot_token = bot_token or getattr(settings, "DISCORD_BOT_TOKEN", "")
        self._client = client

    @property
    def is_configured(self) -> bool:
        return bool(self.application_id and self.bot_token)

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bot {self.bot_token}",
            "Content-Type": "application/json",
        }

    def _commands_url(self, guild_id: str | None = None) -> str:
        base = f"{DISCORD_API_BASE}/applications/{self.application_id}"
        if guild_id:
            return f"{base}/guilds/{guild_id}/commands"
        return f"{base}/commands"

    def _command_url(self, command_id: str, guild_id: str | None = None) -> str:
        return f"{self._commands_url(guild_id)}/{command_id}"

    def _http(self) -> httpx.Client:
        if self._client is not None:
            return self._client
        return httpx.Client(timeout=15.0)

    def _request(self, method: str, url: str, *, json: dict[str, Any] | None = None) -> dict[str, Any]:
        if not self.is_configured:
            raise DiscordSlashCommandSyncError(
                "Discord não configurado: defina DISCORD_APPLICATION_ID e DISCORD_BOT_TOKEN."
            )

        with self._http() as client:
            response = client.request(method, url, headers=self._headers(), json=json)

        if response.status_code >= 400:
            logger.warning(
                "discord slash command sync failed",
                extra={
                    "method": method,
                    "status_code": response.status_code,
                    "body": response.text[:500],
                },
            )
            raise DiscordSlashCommandSyncError(
                f"Discord API {response.status_code}: {response.text[:300]}"
            )

        if response.status_code == 204:
            return {}
        return response.json()

    def build_payload(self, command: CustomSlashCommand) -> DiscordSlashCommandPayload:
        return DiscordSlashCommandPayload(
            name=command.name,
            description=command.description,
        )

    def upsert(self, command: CustomSlashCommand) -> dict[str, Any]:
        """Cria ou atualiza o comando remoto e devolve o payload da API."""
        payload = self.build_payload(command).to_dict()
        guild_id = command.guild_id or None

        if command.discord_command_id:
            return self._request(
                "PATCH",
                self._command_url(command.discord_command_id, guild_id),
                json=payload,
            )

        return self._request(
            "POST",
            self._commands_url(guild_id),
            json=payload,
        )

    def delete(self, command: CustomSlashCommand) -> None:
        if not command.discord_command_id:
            return
        self._request(
            "DELETE",
            self._command_url(command.discord_command_id, command.guild_id or None),
        )

    def sync_command(self, command: CustomSlashCommand) -> CustomSlashCommand:
        """
        Sincroniza um comando com o Discord e persiste o estado local.

        Usa update_fields para evitar re-disparar signals desnecessariamente.
        """
        if not command.is_enabled:
            if command.discord_command_id:
                self.delete(command)
                command.discord_command_id = None
            command.registration_status = CustomSlashCommand.RegistrationStatus.PENDING
            command.registration_error = ""
            command._skip_discord_sync = True
            command.save(
                update_fields=[
                    "discord_command_id",
                    "registration_status",
                    "registration_error",
                    "updated_at",
                ],
                disable_auto_set_user=True,
            )
            return command

        try:
            result = self.upsert(command)
            command.discord_command_id = str(result["id"])
            command.registration_status = CustomSlashCommand.RegistrationStatus.SYNCED
            command.registration_error = ""
        except DiscordSlashCommandSyncError as exc:
            command.registration_status = CustomSlashCommand.RegistrationStatus.FAILED
            command.registration_error = str(exc)
            logger.exception("failed to sync discord slash command %s", command.pk)

        command._skip_discord_sync = True
        command.save(
            update_fields=[
                "discord_command_id",
                "registration_status",
                "registration_error",
                "updated_at",
            ],
            disable_auto_set_user=True,
        )
        return command
