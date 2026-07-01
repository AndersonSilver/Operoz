from __future__ import annotations

from datetime import timedelta
from typing import Any

from django.db.models import Count
from django.utils import timezone

from operoz.automation.analytics import _percentile
from operoz.db.models import Board, BoardAutomationRun, Workspace

AUTOMATION_P95_TARGET_MS = 2000


def build_workspace_automation_quality(workspace: Workspace, *, days: int = 7) -> dict[str, Any]:
    days = min(max(days, 1), 30)
    cutoff = timezone.now() - timedelta(days=days - 1)
    cutoff = cutoff.replace(hour=0, minute=0, second=0, microsecond=0)

    board_ids = Board.objects.filter(workspace=workspace, deleted_at__isnull=True).values_list("id", flat=True)
    runs = BoardAutomationRun.objects.filter(
        board_id__in=board_ids,
        deleted_at__isnull=True,
        dry_run=False,
        created_at__gte=cutoff,
        started_at__isnull=False,
        finished_at__isnull=False,
    )

    durations_ms: list[int] = []
    for started_at, finished_at in runs.values_list("started_at", "finished_at"):
        delta_ms = int((finished_at - started_at).total_seconds() * 1000)
        if delta_ms >= 0:
            durations_ms.append(delta_ms)

    p95_duration_ms = _percentile(durations_ms, 95)
    status_map: dict[str, int] = {}
    for row in runs.values("status").annotate(count=Count("id")):
        status_map[row["status"]] = row["count"]

    return {
        "period_days": days,
        "target_p95_ms": AUTOMATION_P95_TARGET_MS,
        "run_count": len(durations_ms),
        "p95_duration_ms": p95_duration_ms,
        "avg_duration_ms": int(sum(durations_ms) / len(durations_ms)) if durations_ms else None,
        "meets_target": p95_duration_ms is not None and p95_duration_ms < AUTOMATION_P95_TARGET_MS,
        "by_status": status_map,
        "note": "Duração mede execução do grafo até enfileirar e-mail (SMTP assíncrono na fila automation_email).",
    }
