"""Default project feature flags (Cycles, Modules, Views, Pages, Intake, Support)."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from operoz.db.models import Project

DEFAULT_PROJECT_FEATURE_FIELDS: dict[str, bool] = {
    "cycle_view": True,
    "module_view": True,
    "issue_views_view": True,
    "page_view": True,
    "intake_view": True,
    "support_view": True,
}


def apply_default_project_features(data: dict) -> dict:
    """Merge default enabled features into create payloads when omitted."""
    for field, value in DEFAULT_PROJECT_FEATURE_FIELDS.items():
        data.setdefault(field, value)
    return data


def ensure_project_default_features(project: Project) -> None:
    """Persist default features on an existing project when any flag is disabled."""
    updates = {
        field: value for field, value in DEFAULT_PROJECT_FEATURE_FIELDS.items() if getattr(project, field) is not value
    }
    if not updates:
        return
    for field, value in updates.items():
        setattr(project, field, value)
    project.save(update_fields=[*updates.keys(), "updated_at"])
