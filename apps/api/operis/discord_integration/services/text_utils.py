from __future__ import annotations

from operis.discord_integration.models import CustomSlashCommand

DISCORD_MESSAGE_MAX_LENGTH = 2000
DISCORD_EMBED_DESCRIPTION_MAX_LENGTH = 4096


def truncate_for_discord(text: str, *, max_length: int = DISCORD_MESSAGE_MAX_LENGTH) -> str:
    if len(text) <= max_length:
        return text
    return text[: max_length - 1] + "…"


def build_command_prompt(command: CustomSlashCommand, user_input: str) -> str:
    sections = [command.prompt_instructions.strip()]
    if user_input.strip():
        sections.append(f"Entrada do utilizador no Discord:\n{user_input.strip()}")
    return "\n\n".join(section for section in sections if section)
