from __future__ import annotations

from operis.discord_integration.models import CustomSlashCommand

DISCORD_MESSAGE_MAX_LENGTH = 2000


def truncate_for_discord(text: str) -> str:
    if len(text) <= DISCORD_MESSAGE_MAX_LENGTH:
        return text
    return text[: DISCORD_MESSAGE_MAX_LENGTH - 1] + "…"


def build_command_prompt(command: CustomSlashCommand, user_input: str) -> str:
    sections = [command.prompt_instructions.strip()]
    if user_input.strip():
        sections.append(f"Entrada do utilizador no Discord:\n{user_input.strip()}")
    return "\n\n".join(section for section in sections if section)
