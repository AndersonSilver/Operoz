from __future__ import annotations


DISCORD_MESSAGE_MAX_LENGTH = 2000
DISCORD_EMBED_DESCRIPTION_MAX_LENGTH = 4096


def truncate_for_discord(text: str, *, max_length: int = DISCORD_MESSAGE_MAX_LENGTH) -> str:
    if len(text) <= max_length:
        return text
    return text[: max_length - 1] + "…"
