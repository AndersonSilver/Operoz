from __future__ import annotations

import logging
from collections.abc import Sequence
from typing import Any

from operoz.db.models import Board
from operoz.utils.client_360 import (
    HealthScoreThresholds,
    HealthScoreWeights,
    HealthScoreBreakdownItem,
    ReportCoverage,
    _clamp_score,
    health_level_from_score,
)

logger = logging.getLogger("operoz.worker")

CLIENT360_HEALTH_SETTINGS_CHANGED_EVENT = "client360.health_settings.changed"


def recompute_health_from_breakdown(
    breakdown: Sequence[HealthScoreBreakdownItem | dict[str, Any]],
    weights: HealthScoreWeights,
    thresholds: HealthScoreThresholds | None,
    *,
    report_coverage: ReportCoverage,
    modules_total: int,
    overdue_issues: int,
    support_overdue: int,
) -> tuple[int, str]:
    """Recalcula score/health com novos pesos a partir dos scores dimensionais existentes."""
    scores: dict[str, int] = {}
    for item in breakdown:
        if isinstance(item, dict):
            scores[str(item["dimension"])] = int(item["score"])
        else:
            scores[item.dimension] = item.score

    report_score = scores.get("report", 0)
    overdue_score = scores.get("overdue", 0)
    support_score = scores.get("support", 0)

    weighted = round(
        (report_score * weights.report + overdue_score * weights.overdue + support_score * weights.support)
        / 100
    )
    score = _clamp_score(weighted)

    if report_coverage == "missing" and modules_total > 0:
        score = min(score, 40)
    if overdue_issues >= 5:
        score = min(score, 35)
    if support_overdue > 0:
        score = min(score, 35)

    return score, health_level_from_score(score, thresholds)


def simulate_client_health_row(
    client: dict[str, Any],
    weights: HealthScoreWeights,
    thresholds: HealthScoreThresholds | None,
) -> dict[str, Any]:
    status_report = client.get("status_report") or {}
    issues = client.get("issues") or {}
    support = client.get("support") or {}
    breakdown = client.get("health_breakdown") or []

    simulated_score, simulated_health = recompute_health_from_breakdown(
        breakdown,
        weights,
        thresholds,
        report_coverage=status_report.get("coverage", "n_a"),
        modules_total=int(status_report.get("modules_total") or 0),
        overdue_issues=int(issues.get("overdue") or 0),
        support_overdue=int(support.get("overdue_count") or 0),
    )

    current_score = int(client.get("health_score") or 0)
    current_health = client.get("health") or "ok"

    return {
        "project_id": client.get("project_id"),
        "name": client.get("name"),
        "identifier": client.get("identifier"),
        "current_score": current_score,
        "current_health": current_health,
        "simulated_score": simulated_score,
        "simulated_health": simulated_health,
        "delta": simulated_score - current_score,
        "health_changed": simulated_health != current_health,
    }


def simulate_board_health_scores(
    clients: Sequence[dict[str, Any]],
    *,
    weights: HealthScoreWeights,
    thresholds: HealthScoreThresholds | None = None,
) -> list[dict[str, Any]]:
    rows = [simulate_client_health_row(client, weights, thresholds) for client in clients]
    rows.sort(key=lambda row: abs(row["delta"]), reverse=True)
    return rows


def log_board_health_settings_change(
    *,
    board: Board,
    actor,
    previous_weights: dict[str, int] | None,
    new_weights: dict[str, int],
) -> None:
    """Hook de audit log (prep Fase 6 enterprise)."""
    logger.info(
        "board client360 health settings weights changed",
        extra={
            "event": CLIENT360_HEALTH_SETTINGS_CHANGED_EVENT,
            "board_id": str(board.id),
            "workspace_id": str(board.workspace_id),
            "actor_id": str(actor.id) if actor else None,
            "previous_weights": previous_weights,
            "new_weights": new_weights,
        },
    )
