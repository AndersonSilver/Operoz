from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger("operoz.worker")

DEFAULT_SCORE_ALERT_THRESHOLD = 40
CLIENT360_HEALTH_SCORE_ALERT_EVENT = "client360.health_score_alert"


def resolve_score_alert_threshold(threshold: int | None) -> int:
    return DEFAULT_SCORE_ALERT_THRESHOLD if threshold is None else threshold


def is_health_score_alert(score: int, threshold: int | None = None) -> bool:
    effective = resolve_score_alert_threshold(threshold)
    return score < effective


def build_client360_list_summary(clients: list[dict]) -> dict:
    return {
        "total_clients": len(clients),
        "health_critical": sum(1 for c in clients if c["health"] == "critical"),
        "health_warning": sum(1 for c in clients if c["health"] == "warning"),
        "report_missing": sum(1 for c in clients if c["status_report"]["coverage"] == "missing"),
        "total_overdue": sum(c["issues"]["overdue"] for c in clients),
        "total_support_open": sum(c["support"]["open_count"] for c in clients),
        "health_score_alert": sum(1 for c in clients if c.get("health_score_alert")),
        "intake_pending": sum(c.get("intake", {}).get("pending", 0) for c in clients),
        "blockers_total": sum(c.get("blockers", {}).get("count", 0) for c in clients),
        "support_sla_breach": sum(1 for c in clients if c.get("support_sla", {}).get("breached")),
    }


def emit_client360_health_score_alert_hook(
    *,
    project_id: str,
    workspace_id: str | None = None,
    board_id: str | None = None,
    health_score: int,
    score_alert_threshold: int,
    in_alert: bool,
    previous_in_alert: bool | None = None,
) -> None:
    """
    Hook for future in-app notifications (Fase 5 IA).
    Call when health score alert state changes; currently logs only.
    """
    payload: dict[str, Any] = {
        "event": CLIENT360_HEALTH_SCORE_ALERT_EVENT,
        "project_id": project_id,
        "workspace_id": workspace_id,
        "board_id": board_id,
        "health_score": health_score,
        "score_alert_threshold": score_alert_threshold,
        "in_alert": in_alert,
        "previous_in_alert": previous_in_alert,
    }
    if previous_in_alert is not None and previous_in_alert != in_alert:
        logger.info("client360 health score alert state changed", extra=payload)
        if workspace_id and in_alert:
            try:
                from operoz.utils.client_360_enterprise import dispatch_client360_webhook

                dispatch_client360_webhook(
                    workspace_id,
                    "health_score_alert",
                    {
                        **payload,
                        "event": CLIENT360_HEALTH_SCORE_ALERT_EVENT,
                    },
                )
            except Exception:
                logger.exception("client360 webhook dispatch failed")
    else:
        logger.debug("client360 health score alert evaluated", extra=payload)
