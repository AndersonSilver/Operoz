from __future__ import annotations

import logging

from celery import shared_task

from operis.discord_integration.models import CustomSlashCommand
from operis.discord_integration.services.assistant_bridge import run_discord_assistant
from operis.discord_integration.services.command_executor import (
    send_discord_reply,
    send_followup_message,
)
from operis.utils.exception_logger import log_exception

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2, default_retry_delay=5)
def process_discord_slash_command(
    self,
    *,
    command_id: str,
    interaction_token: str,
    user_input: str = "",
) -> None:
    command = CustomSlashCommand.objects.filter(pk=command_id, deleted_at__isnull=True).first()
    if not command or not command.is_enabled:
        send_followup_message(
            interaction_token=interaction_token,
            content="Este comando não está disponível.",
        )
        return

    followup_sent = False
    try:
        reply = run_discord_assistant(command, user_input)
        send_discord_reply(interaction_token=interaction_token, reply=reply)
        followup_sent = True
    except Exception as exc:
        log_exception(exc)
        logger.exception("discord slash command task failed", extra={"command_id": command_id})
        if not followup_sent:
            try:
                send_followup_message(
                    interaction_token=interaction_token,
                    content="Ocorreu um erro ao processar o comando.",
                )
                followup_sent = True
            except Exception:
                log_exception(exc)
        if not followup_sent and self.request.retries < self.max_retries:
            raise self.retry(exc=exc)
