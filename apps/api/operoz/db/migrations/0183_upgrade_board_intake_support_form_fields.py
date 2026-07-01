"""Garante campos de sustentação (criticidade, SLA, etc.) nos formulários de abertura existentes."""

from django.db import migrations

from operoz.db.models.board_intake_form import default_board_intake_form_fields


def upgrade_support_opening_forms(apps, schema_editor):
    BoardIntakeForm = apps.get_model("db", "BoardIntakeForm")
    canonical = default_board_intake_form_fields()
    required_types = {"client", "name", "criticality", "datetime", "sla_due", "ticket_number"}

    for form in BoardIntakeForm.objects.filter(deleted_at__isnull=True).iterator():
        existing = form.fields or []
        existing_types = {
            field.get("field_type")
            for field in existing
            if isinstance(field, dict) and field.get("field_type")
        }
        if required_types.issubset(existing_types):
            continue
        form.fields = canonical
        form.save(update_fields=["fields"])


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0182_board_support_sla_policy_and_form_fields"),
    ]

    operations = [
        migrations.RunPython(upgrade_support_opening_forms, migrations.RunPython.noop),
    ]
