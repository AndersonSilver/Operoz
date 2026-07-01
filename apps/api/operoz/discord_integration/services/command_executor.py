from __future__ import annotations

import httpx
from django.conf import settings

from operoz.discord_integration.models import CustomSlashCommand
from operoz.discord_integration.services.assistant_bridge import run_discord_assistant
from operoz.discord_integration.services.discord_formatting import DiscordReply
from operoz.discord_integration.services.text_utils import truncate_for_discord

DISCORD_API_BASE = "https://discord.com/api/v10"


def execute_slash_command(command: CustomSlashCommand, user_input: str = "") -> DiscordReply:
    """Executa via assistente Operoz completo (ferramentas + RAG)."""
    return run_discord_assistant(command, user_input)


def send_followup_message(
    *,
    interaction_token: str,
    content: str = "",
    embeds: list[dict] | None = None,
) -> None:
    """Publica resposta após defer (webhook da interação)."""
    application_id = getattr(settings, "DISCORD_APPLICATION_ID", "")
    bot_token = getattr(settings, "DISCORD_BOT_TOKEN", "")
    if not application_id or not bot_token:
        return

    url = f"{DISCORD_API_BASE}/webhooks/{application_id}/{interaction_token}"
    headers = {
        "Authorization": f"Bot {bot_token}",
        "Content-Type": "application/json",
    }
    payload: dict = {}
    if content.strip():
        payload["content"] = truncate_for_discord(content)
    if embeds:
        payload["embeds"] = embeds
    if not payload:
        payload["content"] = "Sem resposta."

    with httpx.Client(timeout=30.0) as client:
        response = client.post(url, headers=headers, json=payload)
        response.raise_for_status()


def send_discord_reply(*, interaction_token: str, reply: DiscordReply) -> None:
    """Envia uma ou mais mensagens follow-up (ex.: overview paginado)."""
    for payload in reply.payloads:
        send_followup_message(
            interaction_token=interaction_token,
            content=payload.content,
            embeds=payload.embeds or None,
        )
