from django.db import migrations, models
import django.db.models.deletion
import uuid

import operis.db.models.board_support_sla_policy


def seed_sla_policies(apps, schema_editor):
    Board = apps.get_model("db", "Board")
    BoardSupportSlaPolicy = apps.get_model("db", "BoardSupportSlaPolicy")
    for board in Board.objects.filter(deleted_at__isnull=True).iterator():
        BoardSupportSlaPolicy.objects.get_or_create(
            board_id=board.id,
            defaults={
                "id": uuid.uuid4(),
                "workspace_id": board.workspace_id,
                "policies": operis.db.models.board_support_sla_policy.default_support_sla_policies(),
            },
        )


def backfill_board_intake_form_fields(apps, schema_editor):
    BoardIntakeForm = apps.get_model("db", "BoardIntakeForm")
    extra_defaults = [
        {
            "id": "field-criticality",
            "field_type": "criticality",
            "label": "Criticidade",
            "help_text": "",
            "required": True,
            "form_span": "full",
        },
        {
            "id": "field-problem-started",
            "field_type": "datetime",
            "label": "Data e Hora do início do problema",
            "help_text": "",
            "required": True,
            "form_span": "full",
            "maps_to": "problem_started_at",
        },
        {
            "id": "field-sla-due",
            "field_type": "sla_due",
            "label": "SLA do chamado",
            "help_text": "",
            "required": False,
            "form_span": "full",
        },
        {
            "id": "field-ticket-number",
            "field_type": "ticket_number",
            "label": "Número do Chamado",
            "help_text": "",
            "required": False,
            "form_span": "full",
        },
    ]

    for form in BoardIntakeForm.objects.filter(deleted_at__isnull=True).iterator():
        existing = form.fields or []
        existing_types = {
            f.get("field_type") for f in existing if isinstance(f, dict) and f.get("field_type")
        }
        required = {"criticality", "sla_due", "ticket_number"}
        if required.issubset(existing_types):
            continue
        existing_ids = {f.get("id") for f in existing if isinstance(f, dict)}
        merged = list(existing)
        for field in extra_defaults:
            if field["field_type"] not in existing_types and field["id"] not in existing_ids:
                merged.append(field)
        form.fields = merged
        form.save(update_fields=["fields"])


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0181_enable_project_support_view"),
    ]

    operations = [
        migrations.CreateModel(
            name="BoardSupportSlaPolicy",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                (
                    "id",
                    models.UUIDField(
                        db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True
                    ),
                ),
                ("policies", models.JSONField(default=operis.db.models.board_support_sla_policy.default_support_sla_policies)),
                (
                    "board",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE, related_name="support_sla_policy", to="db.board"
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to="db.user",
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to="db.user",
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="board_support_sla_policies",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "BoardSupportSlaPolicy",
                "verbose_name_plural": "BoardSupportSlaPolicies",
                "db_table": "board_support_sla_policies",
            },
        ),
        migrations.AddIndex(
            model_name="boardsupportslapolicy",
            index=models.Index(fields=["workspace", "board"], name="board_sla_policy_ws_board_idx"),
        ),
        migrations.RunPython(seed_sla_policies, migrations.RunPython.noop),
        migrations.RunPython(backfill_board_intake_form_fields, migrations.RunPython.noop),
    ]
