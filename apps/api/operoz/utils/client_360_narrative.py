from __future__ import annotations

from operoz.db.models import Client360Narrative


def serialize_narrative(row: Client360Narrative | None) -> dict:
    if row is None:
        return {
            "wins_md": "",
            "risks_md": "",
            "next_steps_md": "",
            "updated_at": None,
        }
    return {
        "wins_md": row.wins_md or "",
        "risks_md": row.risks_md or "",
        "next_steps_md": row.next_steps_md or "",
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def upsert_narrative(
    *,
    workspace_id,
    project_id,
    period_start,
    period_end,
    wins_md: str = "",
    risks_md: str = "",
    next_steps_md: str = "",
) -> Client360Narrative:
    row, _ = Client360Narrative.objects.update_or_create(
        project_id=project_id,
        period_start=period_start,
        defaults={
            "workspace_id": workspace_id,
            "period_end": period_end,
            "wins_md": wins_md or "",
            "risks_md": risks_md or "",
            "next_steps_md": next_steps_md or "",
        },
    )
    return row
