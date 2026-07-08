from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

from django.conf import settings
from django.utils import timezone

from operoz.db.models import Workspace, WorkspaceJiraOpsConfig, Board
from operoz.license.utils.encryption import decrypt_data, encrypt_data

from .oauth import ensure_fresh_oauth_token

DEFAULT_JIRA_OPS_BOARD_SLUG = getattr(settings, "JIRA_OPS_BOARD_SLUG", "squad-as-a-service")


@dataclass
class JiraOpsCredentials:
    cloud_id: str
    email: str
    api_token: str
    project_key: str
    board_slug: str
    auth_mode: Literal["basic", "oauth"] = "basic"

    def is_complete(self) -> bool:
        if self.auth_mode == "oauth":
            return bool(self.cloud_id and self.api_token)
        return bool(self.cloud_id and self.email and self.api_token)


def resolve_jira_board_slug(workspace: Workspace, board_slug: str | None) -> str:
    """Retorna um slug de board existente; corrige defaults legados inválidos."""
    slug = (board_slug or "").strip() or DEFAULT_JIRA_OPS_BOARD_SLUG
    boards = Board.objects.filter(workspace=workspace, deleted_at__isnull=True)
    if boards.filter(slug=slug).exists():
        return slug
    preferred = boards.filter(slug=DEFAULT_JIRA_OPS_BOARD_SLUG).first()
    if preferred:
        return preferred.slug
    first = boards.order_by("sort_order", "-created_at").first()
    return first.slug if first else slug


def get_board_for_jira_ops(workspace: Workspace, board_slug: str | None) -> Board:
    slug = resolve_jira_board_slug(workspace, board_slug)
    board = Board.objects.filter(slug=slug, workspace=workspace, deleted_at__isnull=True).first()
    if not board:
        raise ValueError("Nenhum board válido neste workspace. Crie um board antes de importar do Jira.")
    return board


def get_or_create_config(workspace: Workspace) -> WorkspaceJiraOpsConfig:
    config, _ = WorkspaceJiraOpsConfig.objects.get_or_create(
        workspace=workspace,
        defaults={
            "project_key": getattr(settings, "JIRA_OPS_PROJECT_KEY", "OPS"),
            "board_slug": DEFAULT_JIRA_OPS_BOARD_SLUG,
        },
    )
    return config


def credentials_from_config(config: WorkspaceJiraOpsConfig) -> JiraOpsCredentials | None:
    if config.oauth_access_token_encrypted:
        try:
            access = ensure_fresh_oauth_token(config)
        except Exception:
            return None
        creds = JiraOpsCredentials(
            cloud_id=(config.cloud_id or "").strip(),
            email=(config.email or "oauth@connected").strip(),
            api_token=access,
            project_key=(config.project_key or "OPS").strip() or "OPS",
            board_slug=resolve_jira_board_slug(config.workspace, config.board_slug),
            auth_mode="oauth",
        )
        return creds if creds.is_complete() else None

    token = decrypt_data(config.api_token_encrypted) if config.api_token_encrypted else ""
    creds = JiraOpsCredentials(
        cloud_id=(config.cloud_id or "").strip(),
        email=(config.email or "").strip(),
        api_token=token,
        project_key=(config.project_key or "OPS").strip() or "OPS",
        board_slug=resolve_jira_board_slug(config.workspace, config.board_slug),
        auth_mode="basic",
    )
    return creds if creds.is_complete() else None


def _credentials_from_env() -> JiraOpsCredentials | None:
    cloud_id = getattr(settings, "JIRA_OPS_CLOUD_ID", "") or ""
    email = getattr(settings, "JIRA_OPS_EMAIL", "") or ""
    token = getattr(settings, "JIRA_OPS_API_TOKEN", "") or ""
    creds = JiraOpsCredentials(
        cloud_id=cloud_id.strip(),
        email=email.strip(),
        api_token=token.strip(),
        project_key=getattr(settings, "JIRA_OPS_PROJECT_KEY", "OPS"),
        board_slug=getattr(settings, "JIRA_OPS_BOARD_SLUG", DEFAULT_JIRA_OPS_BOARD_SLUG),
        auth_mode="basic",
    )
    return creds if creds.is_complete() else None


def get_workspace_credentials(workspace: Workspace) -> JiraOpsCredentials | None:
    try:
        config = workspace.jira_ops_config
    except WorkspaceJiraOpsConfig.DoesNotExist:
        return _credentials_from_env()
    creds = credentials_from_config(config)
    return creds or _credentials_from_env()


def workspace_jira_configured(workspace: Workspace) -> bool:
    return get_workspace_credentials(workspace) is not None


def config_to_api_dict(
    config: WorkspaceJiraOpsConfig,
    *,
    configured: bool,
    uses_env_fallback: bool = False,
) -> dict[str, Any]:
    from .oauth import oauth_redirect_uri, workspace_oauth_app_ready

    return {
        "oauth_app_client_id": config.oauth_app_client_id or "",
        "oauth_app_configured": workspace_oauth_app_ready(config),
        "oauth_redirect_uri": oauth_redirect_uri(),
        "cloud_id": config.cloud_id or "",
        "email": config.email or "",
        "api_token_configured": bool(config.api_token_encrypted),
        "oauth_connected": bool(config.oauth_access_token_encrypted),
        "jira_site_name": config.jira_site_name or "",
        "project_key": config.project_key or "OPS",
        "board_slug": resolve_jira_board_slug(config.workspace, config.board_slug),
        "configured": configured,
        "last_sync_at": config.last_sync_at.isoformat() if config.last_sync_at else None,
        "uses_env_fallback": uses_env_fallback,
    }


def update_workspace_config(workspace: Workspace, data: dict[str, Any]) -> WorkspaceJiraOpsConfig:
    config = get_or_create_config(workspace)

    if "cloud_id" in data:
        config.cloud_id = (data.get("cloud_id") or "").strip()
    if "email" in data:
        config.email = (data.get("email") or "").strip()
    if "project_key" in data:
        config.project_key = (data.get("project_key") or "OPS").strip() or "OPS"
    if "board_slug" in data:
        raw = (data.get("board_slug") or DEFAULT_JIRA_OPS_BOARD_SLUG).strip() or DEFAULT_JIRA_OPS_BOARD_SLUG
        config.board_slug = resolve_jira_board_slug(workspace, raw)

    if "oauth_app_client_id" in data:
        config.oauth_app_client_id = (data.get("oauth_app_client_id") or "").strip()
    if "oauth_app_client_secret" in data:
        raw_secret = data.get("oauth_app_client_secret")
        if raw_secret is None:
            pass
        elif raw_secret == "":
            config.oauth_app_client_secret_encrypted = ""
        else:
            config.oauth_app_client_secret_encrypted = encrypt_data(str(raw_secret).strip())

    if "api_token" in data:
        raw = data.get("api_token")
        if raw is None:
            pass
        elif raw == "":
            config.api_token_encrypted = ""
        else:
            config.api_token_encrypted = encrypt_data(str(raw).strip())

    config.save()
    return config


def mark_sync_completed(workspace: Workspace) -> None:
    config = get_or_create_config(workspace)
    config.last_sync_at = timezone.now()
    config.save(update_fields=["last_sync_at", "updated_at"])
