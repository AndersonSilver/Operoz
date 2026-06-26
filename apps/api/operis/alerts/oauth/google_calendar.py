from __future__ import annotations

import json
import secrets
import urllib.error
import urllib.parse
import urllib.request
from datetime import timedelta
from typing import Any

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone as django_tz

from operis.license.utils.encryption import decrypt_data, encrypt_data

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_SCOPES = "https://www.googleapis.com/auth/calendar.events"
STATE_TTL = 600
STATE_SEPARATOR = "::"


def redirect_uri() -> str:
    explicit = getattr(settings, "GOOGLE_CALENDAR_OAUTH_REDIRECT_URI", "") or ""
    if explicit:
        return explicit.rstrip("/") + "/"
    api_base = (getattr(settings, "WEB_URL", None) or "http://localhost:8000").rstrip("/")
    return f"{api_base}/api/integrations/google-calendar/auth/callback/"


def get_client_credentials() -> tuple[str, str]:
    client_id = (getattr(settings, "GOOGLE_CALENDAR_CLIENT_ID", "") or "").strip()
    client_secret = (getattr(settings, "GOOGLE_CALENDAR_CLIENT_SECRET", "") or "").strip()
    return client_id, client_secret


def oauth_configured() -> bool:
    client_id, client_secret = get_client_credentials()
    return bool(client_id and client_secret)


def _http_form_post(url: str, body: dict) -> dict[str, Any]:
    data = urllib.parse.urlencode(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Google OAuth error {exc.code}: {detail}") from exc


def create_oauth_state(*, workspace_slug: str, user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    state = f"{workspace_slug}{STATE_SEPARATOR}{token}"
    cache.set(
        f"gcal_oauth_state:{state}",
        {"workspace_slug": workspace_slug, "user_id": user_id},
        timeout=STATE_TTL,
    )
    return state


def pop_oauth_state(state: str) -> dict | None:
    key = f"gcal_oauth_state:{state}"
    payload = cache.get(key)
    if payload:
        cache.delete(key)
    return payload


def workspace_slug_from_state(state: str) -> str:
    if STATE_SEPARATOR not in state:
        return ""
    return state.split(STATE_SEPARATOR, 1)[0].strip()


def build_authorize_url(*, state: str) -> str:
    client_id, _ = get_client_credentials()
    if not client_id:
        raise ValueError("Google Calendar OAuth not configured")
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri(),
        "response_type": "code",
        "scope": GOOGLE_SCOPES,
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"


def exchange_code_for_tokens(code: str) -> dict[str, Any]:
    client_id, client_secret = get_client_credentials()
    if not client_id or not client_secret:
        raise ValueError("Google Calendar OAuth not configured")
    return _http_form_post(
        GOOGLE_TOKEN_URL,
        {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri(),
            "grant_type": "authorization_code",
        },
    )


def refresh_access_token(refresh_token: str) -> dict[str, Any]:
    client_id, client_secret = get_client_credentials()
    return _http_form_post(
        GOOGLE_TOKEN_URL,
        {
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        },
    )


def encrypt_tokens(tokens: dict[str, Any]) -> str:
    return encrypt_data(json.dumps(tokens))


def decrypt_tokens(encrypted: str) -> dict[str, Any]:
    raw = decrypt_data(encrypted) if encrypted else ""
    return json.loads(raw) if raw else {}


def token_expires_at(payload: dict[str, Any]):
    expires_in = int(payload.get("expires_in") or 3600)
    return django_tz.now() + timedelta(seconds=max(expires_in - 60, 60))
