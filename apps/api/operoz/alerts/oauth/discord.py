from __future__ import annotations

import json
import secrets
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from django.conf import settings
from django.core.cache import cache

DISCORD_AUTH_URL = "https://discord.com/api/oauth2/authorize"
DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token"
DISCORD_USER_URL = "https://discord.com/api/users/@me"
DISCORD_SCOPES = "identify"
# Cloudflare blocks Python's default urllib User-Agent (HTTP 403, error 1010).
DISCORD_USER_AGENT = "Operoz (https://operoz.com; DiscordOAuth/1.0)"
STATE_TTL = 600
STATE_SEPARATOR = "::"


def redirect_uri() -> str:
    # Keep trailing slash: Django route requires it, and Discord needs an exact
    # match with the registered redirect (same pattern as Google Calendar OAuth).
    explicit = getattr(settings, "DISCORD_OAUTH_REDIRECT_URI", "") or ""
    if explicit:
        return explicit.rstrip("/") + "/"
    api_base = (getattr(settings, "WEB_URL", None) or "http://localhost:8000").rstrip("/")
    return f"{api_base}/api/integrations/discord/auth/callback/"


def get_client_credentials() -> tuple[str, str]:
    client_id = (getattr(settings, "DISCORD_OAUTH_CLIENT_ID", "") or "").strip()
    client_secret = (getattr(settings, "DISCORD_OAUTH_CLIENT_SECRET", "") or "").strip()
    return client_id, client_secret


def oauth_configured() -> bool:
    client_id, client_secret = get_client_credentials()
    return bool(client_id and client_secret)


def _http_post(url: str, body: dict, headers: dict | None = None) -> dict[str, Any]:
    data = urllib.parse.urlencode(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    req.add_header("User-Agent", DISCORD_USER_AGENT)
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Discord OAuth error {exc.code}: {detail}") from exc


def _http_get(url: str, access_token: str) -> dict[str, Any]:
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {access_token}")
    req.add_header("User-Agent", DISCORD_USER_AGENT)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Discord API error {exc.code}: {detail}") from exc


def create_oauth_state(*, workspace_slug: str, user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    state = f"{workspace_slug}{STATE_SEPARATOR}{token}"
    cache.set(
        f"discord_oauth_state:{state}",
        {"workspace_slug": workspace_slug, "user_id": user_id},
        timeout=STATE_TTL,
    )
    return state


def pop_oauth_state(state: str) -> dict | None:
    key = f"discord_oauth_state:{state}"
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
        raise ValueError("Discord OAuth not configured")
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri(),
        "response_type": "code",
        "scope": DISCORD_SCOPES,
        "state": state,
    }
    return f"{DISCORD_AUTH_URL}?{urllib.parse.urlencode(params)}"


def exchange_code_for_tokens(code: str) -> dict[str, Any]:
    client_id, client_secret = get_client_credentials()
    if not client_id or not client_secret:
        raise ValueError("Discord OAuth not configured")
    return _http_post(
        DISCORD_TOKEN_URL,
        {
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri(),
        },
    )


def get_discord_user(access_token: str) -> dict[str, Any]:
    return _http_get(DISCORD_USER_URL, access_token)
