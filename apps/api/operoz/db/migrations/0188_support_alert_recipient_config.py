# Align support alert rules: creator + assignees + project lead; no broadcast to support team.

from django.db import migrations

SUPPORT_ALERT_TYPES = (
    "support_ticket_created",
    "support_ticket_accepted",
    "support_sla_approaching",
    "support_sla_breached",
    "support_ticket_closed",
)

RECIPIENT_PATCH = {
    "notify_assignees": True,
    "notify_creator": True,
    "notify_project_lead": True,
    "notify_support_team": False,
}


def normalize_support_alert_configs(apps, schema_editor):
    AlertRule = apps.get_model("db", "AlertRule")
    for rule in AlertRule.objects.filter(alert_type__in=SUPPORT_ALERT_TYPES, deleted_at__isnull=True):
        config = dict(rule.config or {})
        config.update(RECIPIENT_PATCH)
        rule.config = config
        rule.save(update_fields=["config", "updated_at"])


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0187_alerts_multi_channel"),
    ]

    operations = [
        migrations.RunPython(normalize_support_alert_configs, migrations.RunPython.noop),
    ]
