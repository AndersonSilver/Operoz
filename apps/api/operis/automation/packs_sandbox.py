from __future__ import annotations

from typing import Any

from operis.automation.catalog.registry import AutomationCatalog, CatalogEntry
from operis.db.models import BoardAutomationHook

FORBIDDEN_CATALOG_KEYS = frozenset({"handler", "python_module", "import_path", "callable"})
ALLOWED_HANDLER_TYPES = frozenset(choice[0] for choice in BoardAutomationHook.HANDLER_CHOICES)
ALLOWED_HOOK_EVENTS = frozenset(choice[0] for choice in BoardAutomationHook.EVENT_CHOICES)
ALLOWED_CATALOG_KINDS = frozenset({"trigger", "filter", "action", "decision", "parallel"})


def validate_pack_catalog_entry(entry: dict[str, Any], base_catalog: AutomationCatalog) -> list[str]:
    errors: list[str] = []
    for forbidden in FORBIDDEN_CATALOG_KEYS:
        if forbidden in entry:
            errors.append(f"Campo proibido em catalog entry: {forbidden}")

    key = entry.get("key")
    kind = entry.get("kind")
    handler_ref = entry.get("handler_ref")

    if not key or not kind or not handler_ref:
        errors.append("catalog entry exige key, kind e handler_ref.")
        return errors

    if kind not in ALLOWED_CATALOG_KINDS:
        errors.append(f"kind inválido em {key}: {kind}")

    base = base_catalog.get(str(handler_ref))
    if not base or not base.handler:
        errors.append(f"handler_ref desconhecido ou sem handler: {handler_ref}")
    elif base.kind != kind:
        errors.append(f"handler_ref {handler_ref} é kind={base.kind}, esperado {kind}")

    return errors


def catalog_entry_from_pack(entry: dict[str, Any], base_catalog: AutomationCatalog) -> CatalogEntry:
    errors = validate_pack_catalog_entry(entry, base_catalog)
    if errors:
        raise ValueError("; ".join(errors))

    base = base_catalog.get(str(entry["handler_ref"]))
    assert base is not None and base.handler is not None

    return CatalogEntry(
        key=str(entry["key"]),
        kind=str(entry["kind"]),
        label=str(entry.get("label") or base.label),
        description=str(entry.get("description") or base.description),
        icon=str(entry.get("icon") or base.icon),
        config_schema=dict(entry.get("config_schema") or base.config_schema),
        output_schema=dict(entry.get("output_schema") or base.output_schema),
        handler=base.handler,
    )


def validate_pack_hook(hook: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for forbidden in ("python_module", "import_path", "handler", "code"):
        if forbidden in hook:
            errors.append(f"Campo proibido em hook: {forbidden}")

    handler_type = hook.get("handler_type")
    event = hook.get("event")
    if handler_type not in ALLOWED_HANDLER_TYPES:
        errors.append(f"handler_type não permitido: {handler_type}")
    if event not in ALLOWED_HOOK_EVENTS:
        errors.append(f"event inválido: {event}")
    if not hook.get("name"):
        errors.append("hook sem name")
    return errors
