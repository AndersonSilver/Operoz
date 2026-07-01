from django.db import migrations
from django.utils.text import slugify


def _slugify_name(name: str) -> str:
    return slugify(name)[:100] or "formulario"


def _unique_anchor(queryset, board_or_project_field: str, scope_id, name: str, *, exclude_pk=None) -> str:
    base = _slugify_name(name)
    candidate = base
    index = 2
    filters = {board_or_project_field: scope_id, "deleted_at__isnull": True}
    while True:
        qs = queryset.filter(anchor=candidate, **filters)
        if exclude_pk:
            qs = qs.exclude(pk=exclude_pk)
        if not qs.exists():
            return candidate[:255]
        candidate = f"{base}-{index}"
        index += 1


def migrate_intake_form_anchors(apps, schema_editor):
    BoardIntakeForm = apps.get_model("db", "BoardIntakeForm")
    IntakeForm = apps.get_model("db", "IntakeForm")

    for form in BoardIntakeForm.objects.filter(deleted_at__isnull=True).iterator():
        if len(form.anchor or "") == 32 and all(ch in "0123456789abcdef" for ch in form.anchor):
            form.anchor = _unique_anchor(
                BoardIntakeForm.objects,
                "board_id",
                form.board_id,
                form.name,
                exclude_pk=form.pk,
            )
            form.save(update_fields=["anchor"])

    for form in IntakeForm.objects.filter(deleted_at__isnull=True).iterator():
        if len(form.anchor or "") == 32 and all(ch in "0123456789abcdef" for ch in form.anchor):
            form.anchor = _unique_anchor(
                IntakeForm.objects,
                "project_id",
                form.project_id,
                form.name,
                exclude_pk=form.pk,
            )
            form.save(update_fields=["anchor"])


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0183_upgrade_board_intake_support_form_fields"),
    ]

    operations = [
        migrations.RunPython(migrate_intake_form_anchors, migrations.RunPython.noop),
    ]
