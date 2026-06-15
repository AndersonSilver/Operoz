from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable
from urllib.parse import urlparse

from operis.automation.domain import DomainEvent
from operis.automation.observability import record_metric
from operis.db.models import BoardAutomationHook

HookHandler = Callable[["HookExecutionContext"], "HookOutcome"]


@dataclass
class HookExecutionContext:
    event: DomainEvent
    context: dict[str, Any]
    rule_id: str
    board_id: str
    dry_run: bool
    node_id: str | None = None
    catalog_key: str | None = None
    action_config: dict[str, Any] | None = None
    action_result: dict[str, Any] | None = None


@dataclass
class HookOutcome:
    allowed: bool = True
    message: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)


_BUILTIN_HANDLERS: dict[str, HookHandler] = {}


def register_hook_handler(handler_type: str, handler: HookHandler) -> None:
    _BUILTIN_HANDLERS[handler_type] = handler


def _handler_block_catalog_key(ctx: HookExecutionContext, config: dict[str, Any]) -> HookOutcome:
    keys = list(config.get("catalog_keys") or [])
    if not ctx.catalog_key or ctx.catalog_key not in keys:
        return HookOutcome(allowed=True)
    return HookOutcome(
        allowed=False,
        message=config.get("message") or f"Ação {ctx.catalog_key} bloqueada por hook",
    )


def _handler_webhook_allowlist(ctx: HookExecutionContext, config: dict[str, Any]) -> HookOutcome:
    if ctx.catalog_key != "action.webhook":
        return HookOutcome(allowed=True)
    url = str((ctx.action_config or {}).get("url") or "")
    if not url:
        return HookOutcome(allowed=False, message="URL do webhook ausente")
    domains = [str(d).strip().lower() for d in (config.get("domains") or []) if str(d).strip()]
    if not domains:
        return HookOutcome(allowed=True)
    host = (urlparse(url).hostname or "").lower()
    allowed = any(host == domain or host.endswith(f".{domain}") for domain in domains)
    if not allowed:
        return HookOutcome(allowed=False, message=f"Domínio não permitido: {host or url}")
    return HookOutcome(allowed=True, message="Webhook permitido pela allowlist")


def _handler_record_metric(ctx: HookExecutionContext, config: dict[str, Any]) -> HookOutcome:
    metric_name = str(config.get("metric_name") or "hook_post_action")
    if not ctx.dry_run:
        record_metric(metric_name, handler="record_metric", catalog_key=ctx.catalog_key or "unknown")
    return HookOutcome(allowed=True, message=f"Métrica {metric_name} registrada")


def execute_hook_handler(hook: BoardAutomationHook, ctx: HookExecutionContext) -> HookOutcome:
    config = dict(hook.config or {})
    if hook.handler_type == BoardAutomationHook.HANDLER_BLOCK_CATALOG and hook.matcher:
        catalog_keys = list(config.get("catalog_keys") or [])
        if hook.matcher not in catalog_keys:
            catalog_keys.append(hook.matcher)
        config["catalog_keys"] = catalog_keys
    if hook.handler_type == BoardAutomationHook.HANDLER_BLOCK_CATALOG:
        return _handler_block_catalog_key(ctx, config)
    if hook.handler_type == BoardAutomationHook.HANDLER_WEBHOOK_ALLOWLIST:
        return _handler_webhook_allowlist(ctx, config)
    if hook.handler_type == BoardAutomationHook.HANDLER_RECORD_METRIC:
        return _handler_record_metric(ctx, config)

    builtin = _BUILTIN_HANDLERS.get(hook.handler_type)
    if builtin:
        return builtin(ctx)
    return HookOutcome(allowed=True, message=f"Handler {hook.handler_type} desconhecido — ignorado")


def hook_matches_action(hook: BoardAutomationHook, catalog_key: str | None) -> bool:
    if not hook.matcher:
        return True
    if not catalog_key:
        return False
    extra_keys = hook.config.get("catalog_keys") if isinstance(hook.config, dict) else None
    if isinstance(extra_keys, list) and catalog_key in extra_keys:
        return True
    return hook.matcher == catalog_key


def hook_step_payload(
    hook: BoardAutomationHook,
    *,
    phase: str,
    outcome: HookOutcome,
    node_id: str | None,
    catalog_key: str | None,
) -> dict[str, Any]:
    return {
        "kind": "hook",
        "hook_id": str(hook.id),
        "hook_name": hook.name,
        "phase": phase,
        "handler_type": hook.handler_type,
        "allowed": outcome.allowed,
        "passed": outcome.allowed,
        "ok": outcome.allowed,
        "message": outcome.message,
        "node_id": node_id,
        "key": catalog_key,
        "catalog_key": catalog_key,
    }


def run_board_hooks(
    phase: str,
    ctx: HookExecutionContext,
    *,
    catalog_key: str | None = None,
) -> tuple[list[dict[str, Any]], bool]:
    """Executa hooks do board para a fase. Retorna (steps, continue_execution)."""
    from operis.db.models import BoardAutomationHook as HookModel

    if catalog_key is not None:
        ctx.catalog_key = catalog_key

    hooks = HookModel.objects.filter(
        board_id=ctx.board_id,
        event=phase,
        enabled=True,
        deleted_at__isnull=True,
    ).order_by("sort_order", "created_at")

    steps: list[dict[str, Any]] = []
    blocking_phases = {
        HookModel.EVENT_PRE_DISPATCH,
        HookModel.EVENT_PRE_ACTION,
    }

    for hook in hooks:
        if phase in {HookModel.EVENT_PRE_ACTION, HookModel.EVENT_POST_ACTION, HookModel.EVENT_ON_FAILURE}:
            if phase == HookModel.EVENT_ON_FAILURE and ctx.action_result and ctx.action_result.get("ok"):
                continue
            if phase != HookModel.EVENT_ON_FAILURE and not hook_matches_action(hook, ctx.catalog_key):
                continue

        outcome = execute_hook_handler(hook, ctx)
        steps.append(
            hook_step_payload(
                hook,
                phase=phase,
                outcome=outcome,
                node_id=ctx.node_id,
                catalog_key=ctx.catalog_key,
            )
        )
        if not outcome.allowed and phase in blocking_phases:
            return steps, False

    return steps, True
