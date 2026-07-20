"""Default alert rules for new workspaces."""

from __future__ import annotations

from operoz.db.models import AlertRule, Workspace

SUPPORT_RECIPIENT_CONFIG: dict = {
    "notify_assignees": True,
    "notify_creator": True,
    "notify_project_lead": True,
    "notify_support_team": False,
}


DEFAULT_RULES: list[dict] = [
    {
        "alert_type": AlertRule.AlertType.ISSUE_CREATED,
        "name": "Card criado",
        "channels": ["email", "in_app"],
        "config": {"notify_assignees": True, "notify_creator": False},
    },
    {
        "alert_type": AlertRule.AlertType.STATE_CHANGE,
        "name": "Mudança de estado",
        "channels": ["in_app"],
        "config": {"notify_assignees": True, "notify_creator": True},
    },
    {
        "alert_type": AlertRule.AlertType.ASSIGNEE_CHANGE,
        "name": "Mudança de responsável",
        "channels": ["email", "in_app"],
        "config": {"notify_assignees": True, "notify_creator": True},
    },
    {
        "alert_type": AlertRule.AlertType.DUE_DATE_APPROACHING,
        "name": "Vencimento próximo",
        "channels": ["email", "in_app"],
        "config": {"thresholds_days": [7, 3, 1], "notify_assignees": True, "notify_creator": True},
        "escalation_schedule": [
            {"days_before": 7, "channels": ["email"]},
            {"days_before": 3, "channels": ["email", "in_app"]},
            {"days_before": 1, "channels": ["email", "in_app"]},
        ],
    },
    {
        "alert_type": AlertRule.AlertType.DUE_DATE_OVERDUE,
        "name": "Card atrasado",
        "channels": ["email", "in_app"],
        "config": {"notify_assignees": True, "notify_creator": True},
    },
    {
        "alert_type": AlertRule.AlertType.MISSING_DUE_DATE,
        "name": "Sem data de vencimento",
        "channels": ["email", "in_app"],
        "config": {"grace_period_days": 3, "notify_assignees": True, "notify_creator": True},
    },
    {
        "alert_type": AlertRule.AlertType.SUPPORT_TICKET_CREATED,
        "name": "Ticket de sustentação criado",
        "channels": ["email", "in_app"],
        "config": {
            **SUPPORT_RECIPIENT_CONFIG,
        },
    },
    {
        "alert_type": AlertRule.AlertType.SUPPORT_TICKET_ACCEPTED,
        "name": "Ticket aceito",
        "channels": ["email", "in_app"],
        "config": {**SUPPORT_RECIPIENT_CONFIG},
    },
    {
        "alert_type": AlertRule.AlertType.SUPPORT_SLA_APPROACHING,
        "name": "SLA próximo do limite",
        "channels": ["email", "in_app"],
        "config": {
            **SUPPORT_RECIPIENT_CONFIG,
            "thresholds_minutes": [60, 15],
        },
    },
    {
        "alert_type": AlertRule.AlertType.SUPPORT_SLA_BREACHED,
        "name": "SLA violado",
        "channels": ["email", "in_app", "discord_dm"],
        "config": {**SUPPORT_RECIPIENT_CONFIG},
    },
    {
        "alert_type": AlertRule.AlertType.SUPPORT_TICKET_CLOSED,
        "name": "Ticket encerrado",
        "channels": ["in_app"],
        "config": {**SUPPORT_RECIPIENT_CONFIG},
    },
    {
        "alert_type": AlertRule.AlertType.SUPPORT_NO_TEAM_RESPONSE,
        "name": "Chamado sem resposta da equipe",
        "channels": ["email", "in_app", "discord_dm"],
        "config": {**SUPPORT_RECIPIENT_CONFIG, "threshold_hours": 4},
    },
    {
        "alert_type": AlertRule.AlertType.ISSUE_NO_ACTIVITY,
        "name": "Card sem atualização",
        "channels": ["email", "in_app"],
        "config": {"threshold_days": 3, "notify_assignees": True, "notify_creator": False},
        "escalation_schedule": [
            {"days_inactive": 3, "channels": ["in_app"]},
            {"days_inactive": 7, "channels": ["email", "in_app"]},
            {"days_inactive": 14, "channels": ["email", "in_app", "discord_dm"]},
        ],
    },
    {
        "alert_type": AlertRule.AlertType.IN_PROGRESS_TOO_LONG,
        "name": "Card parado em andamento",
        "channels": ["email", "in_app"],
        "config": {"threshold_days": 5, "notify_assignees": True, "notify_creator": True},
    },
]


def seed_default_alert_rules(*, workspace_id: str) -> int:
    """Create any missing workspace-level default rules. Returns count created.

    Safe for existing workspaces: only inserts alert_types that are not present yet
    (so new rules like issue_no_activity land without wiping old config).
    """
    existing = set(
        AlertRule.objects.filter(
            workspace_id=workspace_id,
            project_id__isnull=True,
            deleted_at__isnull=True,
        ).values_list("alert_type", flat=True)
    )

    created = 0
    for spec in DEFAULT_RULES:
        if spec["alert_type"] in existing:
            continue
        AlertRule.objects.create(
            workspace_id=workspace_id,
            project_id=None,
            alert_type=spec["alert_type"],
            name=spec["name"],
            enabled=True,
            channels=spec.get("channels", ["email", "in_app"]),
            config=spec.get("config", {}),
            escalation_schedule=spec.get("escalation_schedule", []),
        )
        created += 1
    return created


def seed_all_workspaces_missing_rules() -> int:
    total = 0
    for workspace in Workspace.objects.filter(deleted_at__isnull=True).iterator(chunk_size=200):
        total += seed_default_alert_rules(workspace_id=str(workspace.id))
    return total
