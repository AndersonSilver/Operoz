from __future__ import annotations

import copy
import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

from django.conf import settings

from operoz.automation.validator import validate_graph

_PLACEHOLDER = re.compile(r"^\{\{([a-zA-Z0-9_]+)\}\}$")
_REQUIRED_TEMPLATE_KEYS = frozenset({"id", "version", "name", "description", "graph", "parameters"})


def automation_templates_dir() -> Path:
    packaged = Path(settings.BASE_DIR) / "packs" / "automation-templates"
    monorepo = Path(settings.BASE_DIR).parent.parent.parent / "packs" / "automation-templates"
    if packaged.is_dir():
        return packaged
    return monorepo


def _apply_params(value: Any, params: dict[str, Any]) -> Any:
    if isinstance(value, str):
        match = _PLACEHOLDER.match(value.strip())
        if match:
            key = match.group(1)
            if key not in params:
                return value
            return params[key]
        return value
    if isinstance(value, list):
        return [_apply_params(item, params) for item in value]
    if isinstance(value, dict):
        return {key: _apply_params(item, params) for key, item in value.items()}
    return value


def _default_params(template: dict[str, Any]) -> dict[str, Any]:
    defaults: dict[str, Any] = {}
    for param in template.get("parameters") or []:
        key = param.get("key")
        if not key:
            continue
        if "default" in param:
            defaults[key] = param["default"]
    return defaults


def validate_template_payload(template: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    missing = _REQUIRED_TEMPLATE_KEYS - set(template.keys())
    if missing:
        errors.append(f"Campos obrigatórios ausentes: {', '.join(sorted(missing))}")
        return errors

    if not isinstance(template.get("parameters"), list):
        errors.append("parameters deve ser uma lista.")
    if not isinstance(template.get("graph"), dict):
        errors.append("graph deve ser um objeto.")

    for param in template.get("parameters") or []:
        if not param.get("key"):
            errors.append("Parâmetro sem key.")
        if param.get("required") and "default" not in param:
            # required params must be supplied at install — ok without default
            pass

    return errors


@lru_cache(maxsize=1)
def _load_templates() -> dict[str, dict[str, Any]]:
    directory = automation_templates_dir()
    templates: dict[str, dict[str, Any]] = {}
    if not directory.is_dir():
        return templates

    for path in sorted(directory.glob("*.json")):
        if path.name == "schema.json":
            continue
        with path.open(encoding="utf-8") as handle:
            payload = json.load(handle)
        file_errors = validate_template_payload(payload)
        if file_errors:
            raise ValueError(f"Template inválido {path.name}: {'; '.join(file_errors)}")
        template_id = payload["id"]
        if template_id in templates:
            raise ValueError(f"Template duplicado: {template_id}")
        templates[template_id] = payload
    return templates


def list_automation_templates() -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for template in _load_templates().values():
        items.append(
            {
                "id": template["id"],
                "version": template["version"],
                "name": template["name"],
                "description": template["description"],
                "icon": template.get("icon", "workflow"),
                "category": template.get("category", "general"),
                "parameters": template.get("parameters") or [],
                "preview": summarize_template_graph(template["graph"]),
            }
        )
    return sorted(items, key=lambda item: item["name"])


def get_automation_template(template_id: str) -> dict[str, Any] | None:
    return _load_templates().get(template_id)


def summarize_template_graph(graph: dict[str, Any]) -> dict[str, Any]:
    nodes = graph.get("nodes") or []
    trigger = next((n for n in nodes if (n.get("data") or {}).get("kind") == "trigger"), None)
    actions = [n for n in nodes if (n.get("data") or {}).get("kind") == "action"]
    filters = [n for n in nodes if (n.get("data") or {}).get("kind") == "filter"]
    return {
        "node_count": len(nodes),
        "trigger_key": (trigger.get("data") or {}).get("catalog_key") if trigger else None,
        "action_keys": [(n.get("data") or {}).get("catalog_key") for n in actions],
        "filter_count": len(filters),
    }


def merge_template_parameters(template: dict[str, Any], parameters: dict[str, Any] | None) -> dict[str, Any]:
    merged = _default_params(template)
    merged.update(parameters or {})

    for param in template.get("parameters") or []:
        key = param.get("key")
        if not key:
            continue
        if param.get("required") and (key not in merged or merged[key] in (None, "", [])):
            raise ValueError(f"parameter_required:{key}")

    return merged


def instantiate_template_graph(template: dict[str, Any], parameters: dict[str, Any] | None = None) -> dict[str, Any]:
    params = merge_template_parameters(template, parameters)
    graph = _apply_params(copy.deepcopy(template["graph"]), params)
    validation = validate_graph(graph)
    if not validation["valid"]:
        raise ValueError(json.dumps({"graph_errors": validation["errors"]}))
    return graph


def build_rule_from_template(
    template: dict[str, Any],
    parameters: dict[str, Any] | None = None,
    *,
    name: str | None = None,
    description: str | None = None,
) -> dict[str, Any]:
    params = merge_template_parameters(template, parameters)
    graph = instantiate_template_graph(template, params)
    rule_name = name or str(params.get("rule_name") or template.get("default_rule_name") or template["name"])
    rule_description = description or str(
        params.get("rule_description") or template.get("default_description") or template["description"]
    )
    return {
        "name": rule_name,
        "description": rule_description,
        "graph": graph,
        "enabled": False,
    }


def _dummy_parameters(template: dict[str, Any]) -> dict[str, Any]:
    params = _default_params(template)
    for param in template.get("parameters") or []:
        key = param.get("key")
        if not key or params.get(key) not in (None, "", []):
            continue
        param_type = param.get("type")
        if param_type == "array":
            params[key] = ["ops@example.com"]
        elif param_type == "integer":
            params[key] = int(param.get("default") or 1)
        elif param.get("required"):
            params[key] = "00000000-0000-0000-0000-000000000001"
    return params


def validate_all_pack_templates() -> list[str]:
    """Valida todos os JSON oficiais — usado em testes/CI."""
    errors: list[str] = []
    directory = automation_templates_dir()
    paths = sorted(path for path in directory.glob("*.json") if path.name != "schema.json")
    if len(paths) < 5:
        errors.append(f"Esperados ≥5 templates em {directory}, encontrados {len(paths)}.")

    _load_templates.cache_clear()
    try:
        templates = _load_templates()
    except ValueError as exc:
        return [str(exc)]

    for template_id, template in templates.items():
        try:
            instantiate_template_graph(template, _dummy_parameters(template))
        except ValueError as exc:
            errors.append(f"{template_id}: {exc}")
    return errors
