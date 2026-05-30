from __future__ import annotations

import json
import secrets
import urllib.error
import urllib.parse
import urllib.request
from datetime import timedelta
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone as django_tz

from operis.license.utils.encryption import decrypt_data, encrypt_data

if TYPE_CHECKING:
    from operis.db.models import WorkspaceJiraOpsConfig

ATLASSIAN_AUTH_URL = "https://auth.atlassian.com/authorize"
ATLASSIAN_TOKEN_URL = "https://auth.atlassian.com/oauth/token"
ATLASSIAN_RESOURCES_URL = "https://api.atlassian.com/oauth/token/accessible-resources"
JIRA_SCOPES = "read:jira-work read:jira-user offline_access"
STATE_TTL = 600
PENDING_CLOUDS_TTL = 600


def oauth_redirect_uri() -> str:
    explicit = getattr(settings, "ATLASSIAN_OAUTH_REDIRECT_URI", "") or ""
    if explicit:
        return explicit.rstrip("/") + "/"
    # O callback é tratado pelo Django em /api/ — não usar APP_BASE_URL (SPA na :3000).
    api_base = (settings.WEB_URL or "http://localhost:8000").rstrip("/")
    return f"{api_base}/api/jira-ops/oauth/callback/"


def get_oauth_app_credentials(config: WorkspaceJiraOpsConfig | None) -> tuple[str, str]:
    """Client ID/secret do app OAuth: primeiro workspace, depois .env (legado)."""
    if config and (config.oauth_app_client_id or "").strip():
        secret = ""
        if config.oauth_app_client_secret_encrypted:
            secret = decrypt_data(config.oauth_app_client_secret_encrypted) or ""
        if secret:
            return config.oauth_app_client_id.strip(), secret

    client_id = (getattr(settings, "ATLASSIAN_OAUTH_CLIENT_ID", "") or "").strip()
    client_secret = (getattr(settings, "ATLASSIAN_OAUTH_CLIENT_SECRET", "") or "").strip()
    return client_id, client_secret


def workspace_oauth_app_ready(config: WorkspaceJiraOpsConfig | None) -> bool:
    client_id, client_secret = get_oauth_app_credentials(config)
    return bool(client_id and client_secret)


def _http_json(method: str, url: str, headers: dict | None = None, body: dict | None = None) -> Any:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
    if body is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Atlassian OAuth {method} {url} -> {exc.code}: {detail}") from exc


def create_oauth_state(workspace_slug: str, user_id: str) -> str:
    state = secrets.token_urlsafe(32)
    cache.set(
        f"jira_oauth_state:{state}",
        {"workspace_slug": workspace_slug, "user_id": user_id},
        timeout=STATE_TTL,
    )
    return state


def pop_oauth_state(state: str) -> dict | None:
    key = f"jira_oauth_state:{state}"
    payload = cache.get(key)
    if payload:
        cache.delete(key)
    return payload


def build_authorize_url(state: str, config: WorkspaceJiraOpsConfig | None) -> str:
    client_id, _ = get_oauth_app_credentials(config)
    if not client_id:
        raise ValueError("App OAuth não configurado neste workspace")
    params = {
        "audience": "api.atlassian.com",
        "client_id": client_id,
        "scope": JIRA_SCOPES,
        "redirect_uri": oauth_redirect_uri(),
        "state": state,
        "response_type": "code",
        "prompt": "consent",
    }
    return f"{ATLASSIAN_AUTH_URL}?{urllib.parse.urlencode(params)}"


def exchange_code_for_tokens(code: str, config: WorkspaceJiraOpsConfig | None) -> dict[str, Any]:
    client_id, client_secret = get_oauth_app_credentials(config)
    if not client_id or not client_secret:
        raise ValueError("App OAuth não configurado")
    return _http_json(
        "POST",
        ATLASSIAN_TOKEN_URL,
        body={
            "grant_type": "authorization_code",
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": oauth_redirect_uri(),
        },
    )


def refresh_access_token(refresh_token: str, config: WorkspaceJiraOpsConfig | None) -> dict[str, Any]:
    client_id, client_secret = get_oauth_app_credentials(config)
    if not client_id or not client_secret:
        raise ValueError("App OAuth não configurado")
    return _http_json(
        "POST",
        ATLASSIAN_TOKEN_URL,
        body={
            "grant_type": "refresh_token",
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
        },
    )


def fetch_accessible_resources(access_token: str) -> list[dict]:
    return _http_json(
        "GET",
        ATLASSIAN_RESOURCES_URL,
        headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
    )


def fetch_jira_projects(access_token: str, cloud_id: str) -> list[dict]:
    url = f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/project"
    return _http_json(
        "GET",
        url,
        headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
    )


def fetch_jira_myself(access_token: str, cloud_id: str) -> dict:
    url = f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/myself"
    return _http_json(
        "GET",
        url,
        headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
    )


def store_pending_clouds(workspace_slug: str, resources: list[dict], tokens: dict) -> None:
    cache.set(
        f"jira_oauth_pending:{workspace_slug}",
        {"resources": resources, "tokens": tokens},
        timeout=PENDING_CLOUDS_TTL,
    )


def pop_pending_clouds(workspace_slug: str) -> dict | None:
    key = f"jira_oauth_pending:{workspace_slug}"
    payload = cache.get(key)
    if payload:
        cache.delete(key)
    return payload


def get_pending_clouds(workspace_slug: str) -> dict | None:
    return cache.get(f"jira_oauth_pending:{workspace_slug}")


def apply_token_response(config, token_payload: dict) -> None:
    access = token_payload.get("access_token") or ""
    refresh = token_payload.get("refresh_token") or ""
    expires_in = int(token_payload.get("expires_in") or 3600)
    config.oauth_access_token_encrypted = encrypt_data(access) if access else ""
    if refresh:
        config.oauth_refresh_token_encrypted = encrypt_data(refresh)
    config.oauth_expires_at = django_tz.now() + timedelta(seconds=max(expires_in - 60, 60))
    config.save(
        update_fields=[
            "oauth_access_token_encrypted",
            "oauth_refresh_token_encrypted",
            "oauth_expires_at",
            "updated_at",
        ]
    )


def ensure_fresh_oauth_token(config) -> str:
    access = decrypt_data(config.oauth_access_token_encrypted) if config.oauth_access_token_encrypted else ""
    if not access:
        raise ValueError("OAuth não conectado")
    if config.oauth_expires_at and config.oauth_expires_at > django_tz.now():
        return access
    refresh = decrypt_data(config.oauth_refresh_token_encrypted) if config.oauth_refresh_token_encrypted else ""
    if not refresh:
        return access
    payload = refresh_access_token(refresh, config)
    apply_token_response(config, payload)
    return decrypt_data(config.oauth_access_token_encrypted) or ""
