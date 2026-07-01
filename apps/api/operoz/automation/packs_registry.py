from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

from django.conf import settings

from operoz.automation.catalog import ensure_catalog
from operoz.automation.packs_sandbox import validate_pack_catalog_entry, validate_pack_hook

PACK_REQUIRED_KEYS = frozenset({"name", "version", "description", "permissions"})


def automation_packs_dir() -> Path:
    packaged = Path(settings.BASE_DIR) / "packs" / "automation-packs"
    monorepo = Path(settings.BASE_DIR).parent.parent.parent / "packs" / "automation-packs"
    if packaged.is_dir():
        return packaged
    return monorepo


@dataclass(frozen=True)
class AutomationPackBundle:
    name: str
    root: Path
    manifest: dict[str, Any]

    def hooks_path(self) -> Path | None:
        rel = self.manifest.get("hooks")
        if not rel:
            return None
        return self.root / str(rel)

    def load_hooks(self) -> list[dict[str, Any]]:
        path = self.hooks_path()
        if not path or not path.is_file():
            return []
        with path.open(encoding="utf-8") as handle:
            payload = json.load(handle)
        hooks = payload.get("hooks") or []
        if not isinstance(hooks, list):
            raise ValueError("hooks.json: hooks deve ser uma lista")
        return hooks

    def catalog_entries(self) -> list[dict[str, Any]]:
        entries = self.manifest.get("catalog") or []
        if not isinstance(entries, list):
            raise ValueError("pack.json: catalog deve ser uma lista")
        return entries

    def rules(self) -> list[dict[str, Any]]:
        rules = self.manifest.get("rules") or []
        if not isinstance(rules, list):
            raise ValueError("pack.json: rules deve ser uma lista")
        return rules


def validate_pack_manifest(manifest: dict[str, Any], *, pack_root: Path | None = None) -> list[str]:
    errors: list[str] = []
    missing = PACK_REQUIRED_KEYS - set(manifest.keys())
    if missing:
        errors.append(f"Campos obrigatórios ausentes: {', '.join(sorted(missing))}")
        return errors

    if not isinstance(manifest.get("permissions"), list):
        errors.append("permissions deve ser uma lista")

    base = ensure_catalog()
    for entry in manifest.get("catalog") or []:
        if isinstance(entry, dict):
            errors.extend(validate_pack_catalog_entry(entry, base))

    if pack_root and manifest.get("hooks"):
        hooks_path = pack_root / str(manifest["hooks"])
        if not hooks_path.is_file():
            errors.append(f"hooks não encontrado: {manifest['hooks']}")
        else:
            try:
                with hooks_path.open(encoding="utf-8") as handle:
                    hooks_payload = json.load(handle)
                for hook in hooks_payload.get("hooks") or []:
                    if isinstance(hook, dict):
                        errors.extend(validate_pack_hook(hook))
            except json.JSONDecodeError as exc:
                errors.append(f"hooks.json inválido: {exc}")

    for rule in manifest.get("rules") or []:
        if not isinstance(rule, dict) or not rule.get("template_id"):
            errors.append("Cada rule precisa de template_id")

    return errors


@lru_cache(maxsize=1)
def _load_pack_index() -> dict[str, AutomationPackBundle]:
    directory = automation_packs_dir()
    index: dict[str, AutomationPackBundle] = {}
    if not directory.is_dir():
        return index

    for pack_json in sorted(directory.glob("*/pack.json")):
        with pack_json.open(encoding="utf-8") as handle:
            manifest = json.load(handle)
        pack_name = manifest.get("name") or pack_json.parent.name
        file_errors = validate_pack_manifest(manifest, pack_root=pack_json.parent)
        if file_errors:
            raise ValueError(f"Pack inválido {pack_name}: {'; '.join(file_errors)}")
        if pack_name in index:
            raise ValueError(f"Pack duplicado: {pack_name}")
        index[pack_name] = AutomationPackBundle(name=pack_name, root=pack_json.parent, manifest=manifest)
    return index


def list_automation_packs() -> list[dict[str, Any]]:
    return [
        {
            "name": bundle.name,
            "version": bundle.manifest["version"],
            "description": bundle.manifest["description"],
            "permissions": bundle.manifest.get("permissions") or [],
            "rules_count": len(bundle.rules()),
            "catalog_count": len(bundle.catalog_entries()),
            "has_hooks": bundle.hooks_path() is not None,
        }
        for bundle in sorted(_load_pack_index().values(), key=lambda item: item.name)
    ]


def get_automation_pack(pack_name: str) -> AutomationPackBundle | None:
    return _load_pack_index().get(pack_name)


def validate_all_automation_packs() -> list[str]:
    errors: list[str] = []
    try:
        _load_pack_index()
    except ValueError as exc:
        errors.append(str(exc))
    return errors


def clear_pack_cache() -> None:
    _load_pack_index.cache_clear()
