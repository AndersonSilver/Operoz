from __future__ import annotations

import logging
from typing import Any

from operoz.assistant.indexing import IndexChunk, index_entity
from operoz.db.models import Client360HealthSnapshot, Project, SearchEmbedding
from operoz.utils.client_360_intelligence import build_snapshot_summary_text

logger = logging.getLogger(__name__)


def build_health_snapshot_chunks(snapshot: Client360HealthSnapshot) -> list[IndexChunk]:
    project = Project.objects.filter(id=snapshot.project_id).first()
    project_name = project.name if project else str(snapshot.project_id)
    content = build_snapshot_summary_text(snapshot, project_name=project_name)
    metadata = {
        "project_id": str(snapshot.project_id),
        "period_start": snapshot.period_start.isoformat(),
        "period_end": snapshot.period_end.isoformat(),
        "health_score": snapshot.health_score,
        "health": snapshot.health,
        "entity_kind": "client360_weekly_snapshot",
    }
    return [IndexChunk(content=content, metadata=metadata)]


def index_health_snapshot_for_rag(snapshot_id: str) -> dict[str, Any]:
    snapshot = Client360HealthSnapshot.objects.filter(pk=snapshot_id).first()
    if not snapshot:
        return {"ok": False, "error": "snapshot_not_found"}
    return index_entity(SearchEmbedding.ENTITY_CLIENT360_SNAPSHOT, str(snapshot.id))


def reindex_workspace_snapshots(workspace_id) -> dict[str, Any]:
    snapshots = Client360HealthSnapshot.objects.filter(
        workspace_id=workspace_id,
        deleted_at__isnull=True,
    ).order_by("-period_start")[:520]
    indexed = 0
    failed = 0
    for snapshot in snapshots:
        result = index_health_snapshot_for_rag(str(snapshot.id))
        if result.get("ok"):
            indexed += 1
        else:
            failed += 1
    return {"indexed": indexed, "failed": failed, "total": snapshots.count()}
