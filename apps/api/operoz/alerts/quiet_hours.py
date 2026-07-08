from __future__ import annotations

import zoneinfo
from datetime import datetime, time
from typing import TYPE_CHECKING

from django.utils import timezone

if TYPE_CHECKING:
    from operoz.db.models import UserNotificationPreference


def is_in_quiet_hours(*, prefs: UserNotificationPreference | None, now: datetime | None = None) -> bool:
    if prefs is None:
        return False
    start = prefs.quiet_hours_start
    end = prefs.quiet_hours_end
    if start is None or end is None:
        return False

    reference = now or timezone.now()
    tz_name = prefs.quiet_hours_timezone or "UTC"
    try:
        tz = zoneinfo.ZoneInfo(tz_name)
    except Exception:
        tz = zoneinfo.ZoneInfo("UTC")

    local_now = reference.astimezone(tz)
    current = local_now.time()

    if start <= end:
        return start <= current < end
    return current >= start or current < end


def parse_time_value(value: str | time | None) -> time | None:
    if value is None or value == "":
        return None
    if isinstance(value, time):
        return value
    parts = str(value).split(":")
    if len(parts) < 2:
        return None
    return time(hour=int(parts[0]), minute=int(parts[1]))
