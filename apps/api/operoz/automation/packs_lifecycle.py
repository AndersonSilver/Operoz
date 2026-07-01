from __future__ import annotations

from typing import Any

from django.db import transaction
from django.utils import timezone

from operoz.automation.packs_catalog import clear_pack_catalog_cache
from operoz.automation.packs_registry import AutomationPackBundle, get_automation_pack
from operoz.automation.packs_sandbox import validate_pack_hook
from operoz.automation.rule_lifecycle import publish_rule_draft
from operoz.automation.templates_registry import build_rule_from_template, get_automation_template
from operoz.db.models import Board, BoardAutomationHook, BoardAutomationPackInstall, BoardAutomationRule


def install_automation_pack(
    board: Board,
    pack_name: str,
    *,
    config: dict[str, Any] | None = None,
    actor,
    create_rules: bool = True,
    publish_rules: bool = False,
) -> BoardAutomationPackInstall:
    bundle = get_automation_pack(pack_name)
    if not bundle:
        raise ValueError("pack_not_found")

    if BoardAutomationPackInstall.objects.filter(
        board=board,
        pack_name=pack_name,
        deleted_at__isnull=True,
    ).exists():
        raise ValueError("pack_already_installed")

    config = dict(config or {})
    hook_ids: list[str] = []
    rule_ids: list[str] = []

    with transaction.atomic():
        install = BoardAutomationPackInstall.objects.create(
            workspace=board.workspace,
            board=board,
            pack_name=pack_name,
            pack_version=str(bundle.manifest["version"]),
            config=config,
            catalog_overlay=bundle.catalog_entries(),
            installed_at=timezone.now(),
            installed_by=actor,
        )

        for index, hook_def in enumerate(bundle.load_hooks()):
            errors = validate_pack_hook(hook_def)
            if errors:
                raise ValueError(f"hook_invalid:{'; '.join(errors)}")
            hook = BoardAutomationHook.objects.create(
                workspace=board.workspace,
                board=board,
                name=str(hook_def["name"]),
                enabled=bool(hook_def.get("enabled", True)),
                event=str(hook_def["event"]),
                matcher=str(hook_def.get("matcher") or ""),
                handler_type=str(hook_def["handler_type"]),
                config=dict(hook_def.get("config") or {}),
                sort_order=int(hook_def.get("sort_order", index)),
            )
            hook_ids.append(str(hook.id))

        if create_rules:
            for rule_def in bundle.rules():
                rule_ids.extend(
                    _create_pack_rule(
                        board,
                        bundle,
                        rule_def,
                        config=config,
                        actor=actor,
                        publish=publish_rules or bool(rule_def.get("publish")),
                    )
                )

        install.hook_ids = hook_ids
        install.rule_ids = rule_ids
        install.save(update_fields=["hook_ids", "rule_ids", "updated_at"])

    clear_pack_catalog_cache(str(board.id))
    return install


def _create_pack_rule(
    board: Board,
    bundle: AutomationPackBundle,
    rule_def: dict[str, Any],
    *,
    config: dict[str, Any],
    actor,
    publish: bool,
) -> list[str]:
    template_id = str(rule_def["template_id"])
    template = get_automation_template(template_id)
    if not template:
        raise ValueError(f"template_not_found:{template_id}")

    parameters = dict(rule_def.get("parameters") or {})
    parameters.update(config.get("rule_parameters", {}).get(template_id, {}))

    rule_payload = build_rule_from_template(
        template,
        parameters,
        name=rule_def.get("name"),
        description=rule_def.get("description"),
    )

    rule = BoardAutomationRule.objects.create(
        board=board,
        workspace=board.workspace,
        name=rule_payload["name"],
        description=rule_payload["description"],
        graph=rule_payload["graph"],
        enabled=False,
    )

    if publish:
        publish_rule_draft(rule, actor=actor)

    return [str(rule.id)]


def uninstall_automation_pack(board: Board, pack_name: str) -> None:
    install = BoardAutomationPackInstall.objects.filter(
        board=board,
        pack_name=pack_name,
        deleted_at__isnull=True,
    ).first()
    if not install:
        raise ValueError("pack_not_installed")

    with transaction.atomic():
        if install.hook_ids:
            BoardAutomationHook.objects.filter(
                board=board,
                id__in=install.hook_ids,
            ).delete()
        if install.rule_ids:
            BoardAutomationRule.objects.filter(
                board=board,
                id__in=install.rule_ids,
            ).delete()
        install.delete()

    clear_pack_catalog_cache(str(board.id))
