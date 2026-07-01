from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, time, timedelta
from typing import Any

from django.utils import timezone

from operoz.alerts.oauth.google_calendar import decrypt_tokens, encrypt_tokens, refresh_access_token, token_expires_at
from operoz.db.models import GoogleCalendarEvent, UserExternalAccount

SUPPORT_SLA_ALERT_TYPES = frozenset(
    {
        "support_ticket_created",
        "support_ticket_accepted",
        "support_sla_approaching",
        "support_sla_breached",
    }
)

CALENDAR_DELETE_ALERT_TYPES = frozenset(
    {
        "support_ticket_closed",
        "due_date_overdue",
    }
)


def _http_json(method: str, url: str, *, headers: dict, body: dict | None = None) -> dict[str, Any]:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    if body is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Google Calendar API {method} {url} -> {exc.code}: {detail}") from exc


def ensure_fresh_access_token(account: UserExternalAccount) -> str:
    tokens = decrypt_tokens(account.token_data or "")
    access = tokens.get("access_token") or ""
    refresh = tokens.get("refresh_token") or ""
    expires_at = account.metadata.get("expires_at") if account.metadata else None
    if access and expires_at:
        from django.utils.dateparse import parse_datetime

        parsed = parse_datetime(expires_at)
        if parsed and parsed > timezone.now():
            return access
    if not refresh:
        raise ValueError("Google Calendar token expired — reconnect required")
    payload = refresh_access_token(refresh)
    tokens.update(payload)
    account.token_data = encrypt_tokens(tokens)
    metadata = dict(account.metadata or {})
    metadata["expires_at"] = token_expires_at(payload).isoformat()
    account.metadata = metadata
    account.last_synced_at = timezone.now()
    account.save(update_fields=["token_data", "metadata", "last_synced_at", "updated_at"])
    return tokens.get("access_token") or payload.get("access_token") or ""


def resolve_calendar_event_at(*, issue, intake_issue, alert_type: str) -> tuple[datetime | None, bool]:
    """Return event datetime and whether it should be an all-day event."""
    from operoz.utils.board_support_sla import parse_iso_datetime
    from operoz.utils.support_ticket import get_support_namespace

    if alert_type in SUPPORT_SLA_ALERT_TYPES:
        if intake_issue is None:
            return None, False
        support = get_support_namespace(intake_issue.extra)
        sla_due = parse_iso_datetime(support.get("sla_due_at"))
        return (sla_due, False) if sla_due else (None, False)

    if issue.target_date:
        dt = datetime.combine(issue.target_date, time.min)
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, timezone.get_current_timezone())
        return dt, True

    return None, False


def calendar_event_summary(*, issue, alert_type: str) -> str:
    labels = {
        "support_ticket_created": "[Suporte] SLA",
        "support_ticket_accepted": "[Suporte] SLA",
        "support_sla_approaching": "[Suporte] SLA próximo",
        "support_sla_breached": "[Suporte] SLA violado",
    }
    prefix = labels.get(alert_type, "")
    base = f"{issue.project.identifier}-{issue.sequence_id}: {issue.name}"
    text = f"{prefix} {base}".strip() if prefix else base
    return text[:1024]


def _build_event_body(
    *,
    summary: str,
    issue_url: str,
    event_at: datetime,
    all_day: bool,
) -> dict[str, Any]:
    if all_day:
        day = event_at.date().isoformat()
        return {
            "summary": summary,
            "description": issue_url,
            "start": {"date": day},
            "end": {"date": day},
        }

    tz_name = str(timezone.get_current_timezone())
    local_start = timezone.localtime(event_at)
    local_end = timezone.localtime(event_at + timedelta(hours=1))
    return {
        "summary": summary,
        "description": issue_url,
        "start": {"dateTime": local_start.strftime("%Y-%m-%dT%H:%M:%S"), "timeZone": tz_name},
        "end": {"dateTime": local_end.strftime("%Y-%m-%dT%H:%M:%S"), "timeZone": tz_name},
    }


def upsert_issue_event(
    *,
    account: UserExternalAccount,
    issue,
    issue_url: str,
    event_at: datetime,
    all_day: bool = False,
    summary: str | None = None,
) -> str:
    access = ensure_fresh_access_token(account)
    calendar_id = (account.metadata or {}).get("calendar_id") or "primary"
    event_body = _build_event_body(
        summary=summary or calendar_event_summary(issue=issue, alert_type="issue_created"),
        issue_url=issue_url,
        event_at=event_at,
        all_day=all_day,
    )
    existing = GoogleCalendarEvent.objects.filter(
        issue_id=issue.id,
        user_external_account_id=account.id,
        deleted_at__isnull=True,
    ).first()

    headers = {"Authorization": f"Bearer {access}", "Accept": "application/json"}
    if existing:
        url = f"https://www.googleapis.com/calendar/v3/calendars/{urllib.parse.quote(calendar_id)}/events/{existing.google_event_id}"
        result = _http_json("PATCH", url, headers=headers, body=event_body)
    else:
        url = f"https://www.googleapis.com/calendar/v3/calendars/{urllib.parse.quote(calendar_id)}/events"
        result = _http_json("POST", url, headers=headers, body=event_body)
        GoogleCalendarEvent.objects.update_or_create(
            issue_id=issue.id,
            user_external_account_id=account.id,
            defaults={
                "google_event_id": result.get("id", ""),
                "calendar_id": calendar_id,
                "sync_status": GoogleCalendarEvent.SyncStatus.SYNCED,
            },
        )
    return result.get("id", "")


def delete_issue_event(*, account: UserExternalAccount, issue) -> None:
    existing = GoogleCalendarEvent.objects.filter(
        issue_id=issue.id,
        user_external_account_id=account.id,
        deleted_at__isnull=True,
    ).first()
    if not existing:
        return
    access = ensure_fresh_access_token(account)
    calendar_id = existing.calendar_id or "primary"
    url = f"https://www.googleapis.com/calendar/v3/calendars/{urllib.parse.quote(calendar_id)}/events/{existing.google_event_id}"
    headers = {"Authorization": f"Bearer {access}"}
    try:
        req = urllib.request.Request(url, headers=headers, method="DELETE")
        urllib.request.urlopen(req, timeout=30)
    except urllib.error.HTTPError:
        pass
    existing.sync_status = GoogleCalendarEvent.SyncStatus.DELETED
    existing.delete()
