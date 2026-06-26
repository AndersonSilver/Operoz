from operis.alerts.channels.discord_dm import DiscordDMChannel
from operis.alerts.channels.email import EmailAlertChannel
from operis.alerts.channels.gcalendar import GoogleCalendarChannel
from operis.alerts.channels.in_app import InAppChannel

_CHANNEL_HANDLERS = {
    "email": EmailAlertChannel(),
    "in_app": InAppChannel(),
    "discord_dm": DiscordDMChannel(),
    "google_calendar": GoogleCalendarChannel(),
}


def get_channel_handler(channel_type: str):
    return _CHANNEL_HANDLERS.get(channel_type)
