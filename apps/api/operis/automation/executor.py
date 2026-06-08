from __future__ import annotations

import logging
from collections.abc import Iterator
from typing import Any

from operis.automation.catalog import ensure_catalog
from operis.automation.compiler import CompiledGraph, compile_graph, get_outgoing_targets
from operis.automation.domain import DomainEvent

logger = logging.getLogger(__name__)

BRANCHING_ACTION_KEYS = frozenset({"action.run_script", "action.send_email"})
ACTION_BRANCH_SUCCESS = "success"
ACTION_BRANCH_ERROR = "error"


def build_execution_context(event: DomainEvent, *, rule_id: str, automation_actor) -> dict[str, Any]:
    from operis.db.models import Issue

    issue = None
    if event.entity_type == "issue":
        issue = (
            Issue.objects.filter(id=event.entity_id)
            .select_related("project", "state")
            .prefetch_related("assignees")
            .first()
        )
    return {
        "event": event,
        "issue": issue,
        "rule_id": rule_id,
        "workspace_id": event.workspace_id,
        "automation_actor": automation_actor,
    }


def _record_step(steps: list[dict[str, Any]], step: dict[str, Any], on_step) -> None:
    steps.append(step)
    if on_step:
        on_step(step)


def _walk_from_node(
    compiled: CompiledGraph,
    node_id: str,
    *,
    event: DomainEvent,
    context: dict[str, Any],
    rule_id: str,
    dry_run: bool,
    steps: list[dict[str, Any]],
    visited_path: set[str],
    on_step=None,
) -> bool:
    """Percorre o grafo a partir de um nó. Retorna False se um filtro bloqueou o ramo."""
    if node_id in visited_path:
        return True
    visited_path.add(node_id)

    node = compiled.nodes.get(node_id)
    if not node:
        return True

    catalog = ensure_catalog()
    entry = catalog.get(node.catalog_key)

    if node.kind == "filter":
        if not entry or not entry.handler:
            _record_step(
                steps,
                {"node_id": node_id, "kind": "filter", "ok": False, "key": node.catalog_key},
                on_step,
            )
            return False
        passed = entry.handler(event, node.config, context)
        _record_step(
            steps,
            {"node_id": node_id, "kind": "filter", "passed": passed, "key": node.catalog_key},
            on_step,
        )
        if not passed:
            return False
        for target_id in get_outgoing_targets(compiled, node_id):
            if not _walk_from_node(
                compiled,
                target_id,
                event=event,
                context=context,
                rule_id=rule_id,
                dry_run=dry_run,
                steps=steps,
                visited_path=visited_path.copy(),
                on_step=on_step,
            ):
                return False
        return True

    if node.kind == "decision":
        if not entry or not entry.handler:
            _record_step(
                steps,
                {"node_id": node_id, "kind": "decision", "ok": False, "key": node.catalog_key},
                on_step,
            )
            return True
        branch_id = entry.handler(event, node.config, context)
        _record_step(
            steps,
            {
                "node_id": node_id,
                "kind": "decision",
                "key": node.catalog_key,
                "matched_branch_id": branch_id,
                "ok": branch_id is not None,
            },
            on_step,
        )
        if branch_id:
            for target_id in get_outgoing_targets(compiled, node_id, source_handle=branch_id):
                _walk_from_node(
                    compiled,
                    target_id,
                    event=event,
                    context=context,
                    rule_id=rule_id,
                    dry_run=dry_run,
                    steps=steps,
                    visited_path=visited_path.copy(),
                    on_step=on_step,
                )
        return True

    if node.kind == "action":
        if not entry or not entry.handler:
            _record_step(
                steps,
                {"node_id": node_id, "kind": "action", "ok": False, "key": node.catalog_key},
                on_step,
            )
            return True
        result = entry.handler(event, node.config, context, dry_run=dry_run)
        action_ok = bool(result.get("ok", False))
        _record_step(
            steps,
            {
                "node_id": node_id,
                "kind": "action",
                "key": node.catalog_key,
                "branch_taken": ACTION_BRANCH_SUCCESS if action_ok else ACTION_BRANCH_ERROR,
                **result,
            },
            on_step,
        )
        if not action_ok and not dry_run:
            logger.warning("automation action failed rule=%s node=%s", rule_id, node_id)

        if node.catalog_key in BRANCHING_ACTION_KEYS:
            branch_handle = ACTION_BRANCH_SUCCESS if action_ok else ACTION_BRANCH_ERROR
            target_ids = get_outgoing_targets(compiled, node_id, source_handle=branch_handle)
        else:
            target_ids = get_outgoing_targets(compiled, node_id)

        for target_id in target_ids:
            _walk_from_node(
                compiled,
                target_id,
                event=event,
                context=context,
                rule_id=rule_id,
                dry_run=dry_run,
                steps=steps,
                visited_path=visited_path.copy(),
                on_step=on_step,
            )
        return True

    return True


def _walk_from_node_events(
    compiled: CompiledGraph,
    node_id: str,
    *,
    event: DomainEvent,
    context: dict[str, Any],
    rule_id: str,
    dry_run: bool,
    steps: list[dict[str, Any]],
    visited_path: set[str],
) -> Iterator[dict[str, Any]]:
    if node_id in visited_path:
        return
    visited_path.add(node_id)

    node = compiled.nodes.get(node_id)
    if not node:
        return

    catalog = ensure_catalog()
    entry = catalog.get(node.catalog_key)

    if node.kind == "filter":
        if not entry or not entry.handler:
            step = {"node_id": node_id, "kind": "filter", "ok": False, "key": node.catalog_key}
            steps.append(step)
            yield {"type": "step", "step": step}
            yield {"type": "blocked"}
            return
        passed = entry.handler(event, node.config, context)
        step = {"node_id": node_id, "kind": "filter", "passed": passed, "key": node.catalog_key}
        steps.append(step)
        yield {"type": "step", "step": step}
        if not passed:
            yield {"type": "blocked"}
            return
        for target_id in get_outgoing_targets(compiled, node_id):
            yield from _walk_from_node_events(
                compiled,
                target_id,
                event=event,
                context=context,
                rule_id=rule_id,
                dry_run=dry_run,
                steps=steps,
                visited_path=visited_path.copy(),
            )
        return

    if node.kind == "decision":
        if not entry or not entry.handler:
            step = {"node_id": node_id, "kind": "decision", "ok": False, "key": node.catalog_key}
            steps.append(step)
            yield {"type": "step", "step": step}
            return
        branch_id = entry.handler(event, node.config, context)
        step = {
            "node_id": node_id,
            "kind": "decision",
            "key": node.catalog_key,
            "matched_branch_id": branch_id,
            "ok": branch_id is not None,
        }
        steps.append(step)
        yield {"type": "step", "step": step}
        if branch_id:
            for target_id in get_outgoing_targets(compiled, node_id, source_handle=branch_id):
                yield from _walk_from_node_events(
                    compiled,
                    target_id,
                    event=event,
                    context=context,
                    rule_id=rule_id,
                    dry_run=dry_run,
                    steps=steps,
                    visited_path=visited_path.copy(),
                )
        return

    if node.kind == "action":
        if not entry or not entry.handler:
            step = {"node_id": node_id, "kind": "action", "ok": False, "key": node.catalog_key}
            steps.append(step)
            yield {"type": "step", "step": step}
            return
        result = entry.handler(event, node.config, context, dry_run=dry_run)
        action_ok = bool(result.get("ok", False))
        step = {
            "node_id": node_id,
            "kind": "action",
            "key": node.catalog_key,
            "branch_taken": ACTION_BRANCH_SUCCESS if action_ok else ACTION_BRANCH_ERROR,
            **result,
        }
        steps.append(step)
        yield {"type": "step", "step": step}
        if not action_ok and not dry_run:
            logger.warning("automation action failed rule=%s node=%s", rule_id, node_id)

        if node.catalog_key in BRANCHING_ACTION_KEYS:
            branch_handle = ACTION_BRANCH_SUCCESS if action_ok else ACTION_BRANCH_ERROR
            target_ids = get_outgoing_targets(compiled, node_id, source_handle=branch_handle)
        else:
            target_ids = get_outgoing_targets(compiled, node_id)

        for target_id in target_ids:
            yield from _walk_from_node_events(
                compiled,
                target_id,
                event=event,
                context=context,
                rule_id=rule_id,
                dry_run=dry_run,
                steps=steps,
                visited_path=visited_path.copy(),
            )
        return


def execute_graph_events(
    graph: dict[str, Any],
    event: DomainEvent,
    *,
    rule_id: str,
    automation_actor,
    dry_run: bool = False,
) -> Iterator[dict[str, Any]]:
    """Emite eventos passo a passo durante a execução do grafo."""
    yield {"type": "started"}

    ensure_catalog()
    compiled: CompiledGraph = compile_graph(graph)
    context = build_execution_context(event, rule_id=rule_id, automation_actor=automation_actor)

    trigger_entry = ensure_catalog().get(compiled.trigger.catalog_key)
    if not trigger_entry or not trigger_entry.handler:
        yield {"type": "done", "result": {"matched": False, "steps": [], "error": "Trigger inválido"}}
        return

    if not trigger_entry.handler(event, compiled.trigger.config):
        yield {
            "type": "done",
            "result": {"matched": False, "steps": [], "message": "Trigger não corresponde ao evento"},
        }
        return

    steps: list[dict[str, Any]] = []
    blocked = False

    for target_id in get_outgoing_targets(compiled, compiled.trigger.id):
        for item in _walk_from_node_events(
            compiled,
            target_id,
            event=event,
            context=context,
            rule_id=rule_id,
            dry_run=dry_run,
            steps=steps,
            visited_path=set(),
        ):
            if item.get("type") == "blocked":
                blocked = True
                break
            if item.get("type") == "step":
                yield item
        if blocked:
            break

    yield {
        "type": "done",
        "result": {
            "matched": True,
            "passed_filters": not blocked,
            "steps": steps,
            "dry_run": dry_run,
            "live": not dry_run,
        },
    }


def execute_graph(
    graph: dict[str, Any],
    event: DomainEvent,
    *,
    rule_id: str,
    automation_actor,
    dry_run: bool = False,
) -> dict[str, Any]:
    ensure_catalog()
    compiled: CompiledGraph = compile_graph(graph)
    context = build_execution_context(event, rule_id=rule_id, automation_actor=automation_actor)

    trigger_entry = ensure_catalog().get(compiled.trigger.catalog_key)
    if not trigger_entry or not trigger_entry.handler:
        return {"matched": False, "steps": [], "error": "Trigger inválido"}

    if not trigger_entry.handler(event, compiled.trigger.config):
        return {"matched": False, "steps": [], "message": "Trigger não corresponde ao evento"}

    steps: list[dict[str, Any]] = []
    blocked = False

    for target_id in get_outgoing_targets(compiled, compiled.trigger.id):
        if not _walk_from_node(
            compiled,
            target_id,
            event=event,
            context=context,
            rule_id=rule_id,
            dry_run=dry_run,
            steps=steps,
            visited_path=set(),
        ):
            blocked = True

    return {
        "matched": True,
        "passed_filters": not blocked,
        "steps": steps,
        "dry_run": dry_run,
    }
