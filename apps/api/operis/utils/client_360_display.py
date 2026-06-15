from __future__ import annotations

from django.conf import settings

from operis.db.models import Workspace, WorkspaceClient360Settings

# Score thresholds (default) → RAG label used by API field `health`.
HEALTH_SCORE_RAG_MAPPING = (
    {"field": "health", "source": "health_score", "rules": "score >= ok_min → ok; >= warning_min → warning; else critical"},
    {"field": "legacy_health", "source": "compute_health()", "rules": "rule-based semáforo MVP (report/overdue/support)"},
)

# Deprecation: legacy_health remains until 2026-Q4; consumers should migrate to health + health_score.
LEGACY_HEALTH_DEPRECATION = "2026-Q4"


def _env_default_health_score_display() -> bool:
    raw = getattr(settings, "CLIENT_360_HEALTH_SCORE_DISPLAY_DEFAULT", "0")
    if isinstance(raw, bool):
        return raw
    return str(raw).lower() in ("1", "true", "yes", "on")


def health_score_display_enabled(workspace: Workspace) -> bool:
    row = WorkspaceClient360Settings.objects.filter(
        workspace=workspace,
        deleted_at__isnull=True,
    ).first()
    if row is None:
        return _env_default_health_score_display()
    return row.health_score_display_enabled


def client_360_display_payload(workspace: Workspace) -> dict:
    return {"health_score_enabled": health_score_display_enabled(workspace)}


def default_workspace_client360_settings_payload() -> dict:
    return {
        "is_custom": False,
        "health_score_display_enabled": _env_default_health_score_display(),
    }


def serialize_workspace_client360_settings(row: WorkspaceClient360Settings | None) -> dict:
    if row is None:
        return default_workspace_client360_settings_payload()
    return {
        "is_custom": True,
        "health_score_display_enabled": row.health_score_display_enabled,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }
