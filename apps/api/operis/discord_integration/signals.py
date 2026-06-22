from __future__ import annotations

import logging

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from operis.discord_integration.models import CustomSlashCommand
from operis.discord_integration.services.slash_commands import DiscordSlashCommandService

logger = logging.getLogger(__name__)


def _should_skip_sync(**kwargs) -> bool:
    return bool(kwargs.get("raw"))


@receiver(post_save, sender=CustomSlashCommand)
def sync_slash_command_on_save(
    sender,
    instance: CustomSlashCommand,
    created: bool,
    **kwargs,
) -> None:
    if _should_skip_sync(**kwargs) or getattr(instance, "_skip_discord_sync", False):
        return

    service = DiscordSlashCommandService()
    if not service.is_configured:
        logger.info(
            "discord slash command saved but sync skipped (missing credentials)",
            extra={"command_id": str(instance.pk), "command_name": instance.name},
        )
        return

    if instance.deleted_at:
        if instance.discord_command_id:
            try:
                service.delete(instance)
            except Exception:
                logger.exception(
                    "failed to delete discord slash command on soft delete",
                    extra={"command_id": str(instance.pk), "discord_command_id": instance.discord_command_id},
                )
        return

    service.sync_command(instance)


@receiver(post_delete, sender=CustomSlashCommand)
def delete_slash_command_on_remove(sender, instance: CustomSlashCommand, **kwargs) -> None:
    if _should_skip_sync(**kwargs):
        return

    service = DiscordSlashCommandService()
    if not service.is_configured or not instance.discord_command_id:
        return

    try:
        service.delete(instance)
    except Exception:
        logger.exception(
            "failed to delete discord slash command on model removal",
            extra={"command_id": str(instance.pk), "discord_command_id": instance.discord_command_id},
        )
