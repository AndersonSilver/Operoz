from __future__ import annotations

from django.conf import settings

from operis.alerts.discord_embed import build_discord_alert_message
from operis.alerts.channels.base import BaseAlertChannel
from operis.alerts.types import AlertContext, AlertResult
from operis.db.models import UserExternalAccount
from operis.db.models.external_account import UserExternalAccount as ExternalAccountModel


class DiscordDMChannel(BaseAlertChannel):
    channel_type = "discord_dm"

    def validate_account(self, user, workspace) -> bool:
        return UserExternalAccount.objects.filter(
            user_id=user.id,
            workspace_id=workspace.id,
            provider=ExternalAccountModel.Provider.DISCORD,
            is_active=True,
            deleted_at__isnull=True,
        ).exists()

    def send(self, context: AlertContext) -> AlertResult:
        account = UserExternalAccount.objects.filter(
            user_id=context.user.id,
            workspace_id=context.workspace.id,
            provider=ExternalAccountModel.Provider.DISCORD,
            is_active=True,
            deleted_at__isnull=True,
        ).first()
        if not account:
            return AlertResult(success=False, error="Discord account not linked")

        bot_token = getattr(settings, "DISCORD_BOT_TOKEN", "")
        if not bot_token:
            return AlertResult(success=False, error="Discord bot not configured")

        try:
            import httpx

            content, embed = build_discord_alert_message(context)
            headers = {"Authorization": f"Bot {bot_token}", "Content-Type": "application/json"}
            dm_channel_id = (account.metadata or {}).get("dm_channel_id")
            if not dm_channel_id:
                dm_response = httpx.post(
                    "https://discord.com/api/v10/users/@me/channels",
                    headers=headers,
                    json={"recipient_id": account.external_id},
                    timeout=10.0,
                )
                if dm_response.status_code >= 400:
                    return AlertResult(success=False, error=f"Discord DM channel error: {dm_response.text}")
                dm_channel_id = dm_response.json().get("id")
                metadata = dict(account.metadata or {})
                metadata["dm_channel_id"] = dm_channel_id
                account.metadata = metadata
                account.save(update_fields=["metadata", "updated_at"])

            payload: dict = {"embeds": [embed]}
            if content:
                payload["content"] = content

            message_response = httpx.post(
                f"https://discord.com/api/v10/channels/{dm_channel_id}/messages",
                headers=headers,
                json=payload,
                timeout=10.0,
            )
            if message_response.status_code >= 400:
                return AlertResult(success=False, error=f"Discord send error: {message_response.text}")
            return AlertResult(success=True)
        except Exception as exc:
            return AlertResult(success=False, error=str(exc))
