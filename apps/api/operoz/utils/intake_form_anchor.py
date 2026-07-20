import re

from django.utils.text import slugify

UUID_HEX_ANCHOR = re.compile(r"^[0-9a-f]{32}$")


def slugify_intake_form_anchor(name: str) -> str:
    return slugify(name)[:100] or "formulario"


def is_legacy_uuid_anchor(anchor: str) -> bool:
    return bool(UUID_HEX_ANCHOR.match(anchor or ""))


def unique_board_intake_form_anchor(board_id, name: str, *, exclude_id=None) -> str:
    from operoz.db.models import BoardIntakeForm

    base = slugify_intake_form_anchor(name)
    candidate = base
    index = 2
    # Must use all_objects (bypasses SoftDeletionManager) because anchor has a global UNIQUE
    # constraint — soft-deleted rows still occupy their anchor slot in the DB.
    queryset = BoardIntakeForm.all_objects.all()
    if exclude_id:
        queryset = queryset.exclude(pk=exclude_id)
    while queryset.filter(anchor=candidate).exists():
        candidate = f"{base}-{index}"
        index += 1
    return candidate[:255]


def unique_project_intake_form_anchor(project_id, name: str, *, exclude_id=None) -> str:
    from operoz.db.models import IntakeForm

    base = slugify_intake_form_anchor(name)
    candidate = base
    index = 2
    # Must use all_objects (bypasses SoftDeletionManager) because anchor has a global UNIQUE
    # constraint — soft-deleted rows still occupy their anchor slot in the DB.
    queryset = IntakeForm.all_objects.all()
    if exclude_id:
        queryset = queryset.exclude(pk=exclude_id)
    while queryset.filter(anchor=candidate).exists():
        candidate = f"{base}-{index}"
        index += 1
    return candidate[:255]
