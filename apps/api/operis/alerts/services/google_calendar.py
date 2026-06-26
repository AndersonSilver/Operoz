from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from django.utils import timezone

from operis.alerts.oauth.google_calendar import decrypt_tokens, encrypt_tokens, refresh_access_token, token_expires_at
from operis.db.models import GoogleCalendarEvent, UserExternalAccount


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


def upsert_issue_event(*, account: UserExternalAccount, issue, issue_url: str) -> str:
    if not issue.target_date:
        return ""
    access = ensure_fresh_access_token(account)
    calendar_id = (account.metadata or {}).get("calendar_id") or "primary"
    start = issue.target_date.isoformat()
    event_body = {
        "summary": f"{issue.project.identifier}-{issue.sequence_id}: {issue.name}"[:1024],
        "description": issue_url,
        "start": {"date": start},
        "end": {"date": start},
    }
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
