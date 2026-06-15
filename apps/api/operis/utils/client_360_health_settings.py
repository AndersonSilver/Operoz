from __future__ import annotations

from collections.abc import Iterable

from operis.db.models import BoardClient360HealthSettings
from operis.utils.client_360 import (
    DEFAULT_HEALTH_SCORE_THRESHOLDS,
    DEFAULT_HEALTH_SCORE_WEIGHTS,
    HealthScoreThresholds,
    HealthScoreWeights,
)
from operis.utils.client_360_health_alerts import DEFAULT_SCORE_ALERT_THRESHOLD

BoardHealthConfig = tuple[HealthScoreWeights, HealthScoreThresholds]


def health_config_from_settings(row: BoardClient360HealthSettings) -> BoardHealthConfig:
    return (
        HealthScoreWeights(
            report=row.weight_report,
            overdue=row.weight_overdue,
            support=row.weight_support,
        ),
        HealthScoreThresholds(
            ok_min=row.threshold_ok_min,
            warning_min=row.threshold_warning_min,
        ),
    )


def load_board_score_alert_threshold_map(board_ids: Iterable) -> dict[str, int]:
    ids = list(board_ids)
    if not ids:
        return {}
    rows = BoardClient360HealthSettings.objects.filter(
        board_id__in=ids,
        deleted_at__isnull=True,
    )
    return {str(row.board_id): row.score_alert_threshold for row in rows}


def load_board_health_config_map(board_ids: Iterable) -> dict[str, BoardHealthConfig]:
    ids = list(board_ids)
    if not ids:
        return {}
    rows = BoardClient360HealthSettings.objects.filter(
        board_id__in=ids,
        deleted_at__isnull=True,
    )
    return {str(row.board_id): health_config_from_settings(row) for row in rows}


def default_health_settings_payload() -> dict:
    return {
        "is_custom": False,
        "weights": {
            "report": DEFAULT_HEALTH_SCORE_WEIGHTS.report,
            "overdue": DEFAULT_HEALTH_SCORE_WEIGHTS.overdue,
            "support": DEFAULT_HEALTH_SCORE_WEIGHTS.support,
        },
        "thresholds": {
            "ok_min": DEFAULT_HEALTH_SCORE_THRESHOLDS.ok_min,
            "warning_min": DEFAULT_HEALTH_SCORE_THRESHOLDS.warning_min,
        },
        "score_alert_threshold": DEFAULT_SCORE_ALERT_THRESHOLD,
        "status_report_reminder_enabled": False,
        "status_report_reminder_email": False,
        "support_sla_days": 7,
    }


def validate_health_weights(report: int, overdue: int, support: int) -> str | None:
    for label, value in (("report", report), ("overdue", overdue), ("support", support)):
        if value < 0 or value > 100:
            return f"Weight '{label}' must be between 0 and 100."
    total = report + overdue + support
    if total != 100:
        return f"Health score weights must sum to 100 (got {total})."
    return None


def validate_score_alert_threshold(value: int) -> str | None:
    if value < 0 or value > 100:
        return "score_alert_threshold must be between 0 and 100."
    return None


def validate_health_thresholds(ok_min: int, warning_min: int) -> str | None:
    for label, value in (("ok_min", ok_min), ("warning_min", warning_min)):
        if value < 0 or value > 100:
            return f"Threshold '{label}' must be between 0 and 100."
    if warning_min >= ok_min:
        return "threshold_warning_min must be lower than threshold_ok_min."
    return None
