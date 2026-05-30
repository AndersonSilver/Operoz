# Tech4Humans: permissões de status report nos tipos de acesso do board

from django.db import migrations

NEW_KEYS = ("status_reports.manage", "status_reports.delete")

ROLE_DEFAULTS = {
    "administrator": {"status_reports.manage": True, "status_reports.delete": True},
    "member": {"status_reports.manage": True, "status_reports.delete": False},
    "member_with_delete": {"status_reports.manage": True, "status_reports.delete": True},
    "observer": {"status_reports.manage": False, "status_reports.delete": False},
    "guest_collaborator": {"status_reports.manage": False, "status_reports.delete": False},
}


def add_status_report_permissions(apps, schema_editor):
    BoardRole = apps.get_model("db", "BoardRole")
    BoardRolePermission = apps.get_model("db", "BoardRolePermission")

    for role in BoardRole.objects.filter(deleted_at__isnull=True).iterator():
        defaults = ROLE_DEFAULTS.get(role.slug, {})
        for key in NEW_KEYS:
            granted = defaults.get(key, False)
            perm, created = BoardRolePermission.objects.get_or_create(
                role_id=role.id,
                board_id=role.board_id,
                workspace_id=role.workspace_id,
                permission_key=key,
                defaults={"granted": granted},
            )
            if not created and role.is_system and key in defaults:
                perm.granted = granted
                perm.deleted_at = None
                perm.save(update_fields=["granted", "deleted_at", "updated_at"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0135_project_responsible_stakeholder"),
    ]

    operations = [
        migrations.RunPython(add_status_report_permissions, noop_reverse),
    ]
