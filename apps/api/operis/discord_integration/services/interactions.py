from __future__ import annotations

from typing import Any

from operis.discord_integration.models import CustomSlashCommand

INTERACTION_TYPE_PING = 1
INTERACTION_TYPE_APPLICATION_COMMAND = 2

RESPONSE_TYPE_PONG = 1
RESPONSE_TYPE_DEFERRED_CHANNEL_MESSAGE = 5


def resolve_slash_command(*, command_name: str, guild_id: str | None) -> CustomSlashCommand | None:
    """Localiza comando dinâmico por nome dentro do guild Discord (sem fallback global)."""
    if not guild_id:
        return None

    return CustomSlashCommand.objects.filter(
        name=command_name.lower().strip(),
        guild_id=guild_id,
        is_enabled=True,
        deleted_at__isnull=True,
    ).first()


def build_ping_response() -> dict[str, int]:
    return {"type": RESPONSE_TYPE_PONG}


def build_deferred_response() -> dict[str, int]:
    return {"type": RESPONSE_TYPE_DEFERRED_CHANNEL_MESSAGE}


def extract_user_prompt(data: dict[str, Any]) -> str:
    """Monta texto livre a partir de opções do slash command (se existirem)."""
    options = data.get("options") or []
    parts: list[str] = []
    for option in options:
        name = option.get("name")
        value = option.get("value")
        if name and value is not None:
            parts.append(f"{name}: {value}")
    return "\n".join(parts)


def parse_application_command(payload: dict[str, Any]) -> tuple[CustomSlashCommand | None, str]:
    data = payload.get("data") or {}
    command_name = (data.get("name") or "").lower().strip()
    guild_id = payload.get("guild_id")
    user_prompt = extract_user_prompt(data)
    command = resolve_slash_command(command_name=command_name, guild_id=guild_id)
    return command, user_prompt
