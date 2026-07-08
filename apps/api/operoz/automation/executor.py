from __future__ import annotations

import logging
from collections.abc import Iterator
from typing import Any

from operoz.automation.catalog import catalog_for_board
from operoz.automation.compiler import CompiledGraph, compile_graph, get_outgoing_targets
from operoz.automation.domain import DomainEvent
from operoz.automation.hooks_registry import HookExecutionContext, run_board_hooks
from operoz.automation.executor_advanced import execute_fan_out, execute_retry_until
from operoz.automation.policy import evaluate_pre_action_policy, policy_step_payload
from operoz.db.models import BoardAutomationHook

logger = logging.getLogger(__name__)

BRANCHING_ACTION_KEYS = frozenset({"action.run_script", "action.send_email"})
ACTION_BRANCH_SUCCESS = "success"
ACTION_BRANCH_ERROR = "error"


def build_execution_context(event: DomainEvent, *, rule_id: str, automation_actor) -> dict[str, Any]:
    from operoz.db.models import Issue

    issue = None
    issue_id = None
    if event.entity_type == "issue":
        issue_id = event.entity_id
    elif event.payload.get("issue_id"):
        issue_id = event.payload["issue_id"]
    if issue_id:
        issue = (
            Issue.objects.filter(id=issue_id).select_related("project", "state").prefetch_related("assignees").first()
        )
    playbook_snippets = ""
    if event.board_id:
        from operoz.playbooks.resolver import format_playbook_snippets, resolve_shared_board_playbooks

        playbooks = resolve_shared_board_playbooks(str(event.board_id))
        playbook_snippets = format_playbook_snippets(playbooks)

    return {
        "event": event,
        "issue": issue,
        "rule_id": rule_id,
        "workspace_id": event.workspace_id,
        "board_id": event.board_id,
        "automation_actor": automation_actor,
        "playbook_snippets": playbook_snippets,
    }


def _hook_context(
    *,
    event: DomainEvent,
    context: dict[str, Any],
    rule_id: str,
    dry_run: bool,
    node_id: str | None = None,
    catalog_key: str | None = None,
    action_config: dict[str, Any] | None = None,
    action_result: dict[str, Any] | None = None,
) -> HookExecutionContext:
    return HookExecutionContext(
        event=event,
        context=context,
        rule_id=rule_id,
        board_id=str(event.board_id),
        dry_run=dry_run,
        node_id=node_id,
        catalog_key=catalog_key,
        action_config=action_config,
        action_result=action_result,
    )


def _append_hook_steps(
    steps: list[dict[str, Any]],
    hook_steps: list[dict[str, Any]],
    on_step,
) -> None:
    for hook_step in hook_steps:
        _record_step(steps, hook_step, on_step)


def _run_policy_pre_action(
    *,
    event: DomainEvent,
    node_id: str,
    catalog_key: str,
    action_config: dict[str, Any],
    steps: list[dict[str, Any]],
    on_step=None,
) -> bool:
    outcome = evaluate_pre_action_policy(
        str(event.board_id),
        catalog_key=catalog_key,
        action_config=action_config,
    )
    if outcome.allowed:
        return True
    step = policy_step_payload(
        code=outcome.code or "policy_denied",
        outcome=outcome,
        node_id=node_id,
        catalog_key=catalog_key,
    )
    _record_step(steps, step, on_step)
    return False


def _run_pre_action_hooks(
    *,
    event: DomainEvent,
    context: dict[str, Any],
    rule_id: str,
    dry_run: bool,
    node_id: str,
    catalog_key: str,
    action_config: dict[str, Any],
    steps: list[dict[str, Any]],
    on_step=None,
) -> bool:
    hook_steps, continue_exec = run_board_hooks(
        BoardAutomationHook.EVENT_PRE_ACTION,
        _hook_context(
            event=event,
            context=context,
            rule_id=rule_id,
            dry_run=dry_run,
            node_id=node_id,
            catalog_key=catalog_key,
            action_config=action_config,
        ),
        catalog_key=catalog_key,
    )
    _append_hook_steps(steps, hook_steps, on_step)
    return continue_exec


def _run_post_action_hooks(
    *,
    event: DomainEvent,
    context: dict[str, Any],
    rule_id: str,
    dry_run: bool,
    node_id: str,
    catalog_key: str,
    action_config: dict[str, Any],
    action_result: dict[str, Any],
    steps: list[dict[str, Any]],
    on_step=None,
) -> None:
    hook_ctx = _hook_context(
        event=event,
        context=context,
        rule_id=rule_id,
        dry_run=dry_run,
        node_id=node_id,
        catalog_key=catalog_key,
        action_config=action_config,
        action_result=action_result,
    )
    for phase in (BoardAutomationHook.EVENT_POST_ACTION, BoardAutomationHook.EVENT_ON_FAILURE):
        hook_steps, _ = run_board_hooks(phase, hook_ctx, catalog_key=catalog_key)
        _append_hook_steps(steps, hook_steps, on_step)


def _record_step(steps: list[dict[str, Any]], step: dict[str, Any], on_step) -> None:
    steps.append(step)
    if on_step:
        on_step(step)


def _branch_action_success(branch_steps: list[dict[str, Any]]) -> bool:
    action_steps = [
        step
        for step in branch_steps
        if step.get("kind") == "action" and step.get("key") not in {None, "action.retry_until"}
    ]
    if not action_steps:
        return True
    return all(bool(step.get("ok", False)) for step in action_steps)


def _make_branch_walker(
    *,
    compiled: CompiledGraph,
    event: DomainEvent,
    context: dict[str, Any],
    rule_id: str,
    dry_run: bool,
    on_step=None,
):
    def walk_branch(target_id: str) -> tuple[list[dict[str, Any]], bool]:
        branch_steps: list[dict[str, Any]] = []
        continued = _walk_from_node(
            compiled,
            target_id,
            event=event,
            context=context,
            rule_id=rule_id,
            dry_run=dry_run,
            steps=branch_steps,
            visited_path=set(),
            on_step=on_step,
        )
        ok = continued and _branch_action_success(branch_steps)
        return branch_steps, ok

    return walk_branch


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

    catalog = catalog_for_board(str(event.board_id) if event.board_id else None)
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

    if node.kind == "parallel" and node.catalog_key == "parallel.fan_out":
        walk_branch = _make_branch_walker(
            compiled=compiled,
            event=event,
            context=context,
            rule_id=rule_id,
            dry_run=dry_run,
            on_step=on_step,
        )
        execute_fan_out(
            compiled=compiled,
            node_id=node_id,
            config=node.config,
            walk_branch=walk_branch,
            record_step=lambda step: _record_step(steps, step, on_step),
        )
        return True

    if node.kind == "action":
        if node.catalog_key == "action.retry_until":
            walk_branch = _make_branch_walker(
                compiled=compiled,
                event=event,
                context=context,
                rule_id=rule_id,
                dry_run=dry_run,
                on_step=on_step,
            )
            execute_retry_until(
                compiled=compiled,
                node_id=node_id,
                config=node.config,
                dry_run=dry_run,
                walk_branch=walk_branch,
                record_step=lambda step: _record_step(steps, step, on_step),
            )
            return True
        if not entry or not entry.handler:
            _record_step(
                steps,
                {"node_id": node_id, "kind": "action", "ok": False, "key": node.catalog_key},
                on_step,
            )
            return True
        if not _run_policy_pre_action(
            event=event,
            node_id=node_id,
            catalog_key=node.catalog_key,
            action_config=node.config,
            steps=steps,
            on_step=on_step,
        ):
            _record_step(
                steps,
                {
                    "node_id": node_id,
                    "kind": "action",
                    "key": node.catalog_key,
                    "ok": False,
                    "blocked_by_policy": True,
                    "message": "Ação bloqueada por política do board",
                },
                on_step,
            )
            return True
        if not _run_pre_action_hooks(
            event=event,
            context=context,
            rule_id=rule_id,
            dry_run=dry_run,
            node_id=node_id,
            catalog_key=node.catalog_key,
            action_config=node.config,
            steps=steps,
            on_step=on_step,
        ):
            _record_step(
                steps,
                {
                    "node_id": node_id,
                    "kind": "action",
                    "key": node.catalog_key,
                    "ok": False,
                    "blocked_by_hook": True,
                    "message": "Ação bloqueada por hook PreAction",
                },
                on_step,
            )
            return True
        result = entry.handler(event, node.config, context, dry_run=dry_run)
        _run_post_action_hooks(
            event=event,
            context=context,
            rule_id=rule_id,
            dry_run=dry_run,
            node_id=node_id,
            catalog_key=node.catalog_key,
            action_config=node.config,
            action_result=result,
            steps=steps,
            on_step=on_step,
        )
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

    catalog = catalog_for_board(str(event.board_id) if event.board_id else None)
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

    if node.kind == "parallel" and node.catalog_key == "parallel.fan_out":
        walk_branch = _make_branch_walker(
            compiled=compiled,
            event=event,
            context=context,
            rule_id=rule_id,
            dry_run=dry_run,
        )

        yield_holder: list[dict[str, Any]] = []

        def record_and_collect(step: dict[str, Any]) -> None:
            steps.append(step)
            yield_holder.append({"type": "step", "step": step})

        execute_fan_out(
            compiled=compiled,
            node_id=node_id,
            config=node.config,
            walk_branch=walk_branch,
            record_step=record_and_collect,
        )
        for item in yield_holder:
            yield item
        return

    if node.kind == "action":
        if node.catalog_key == "action.retry_until":
            walk_branch = _make_branch_walker(
                compiled=compiled,
                event=event,
                context=context,
                rule_id=rule_id,
                dry_run=dry_run,
            )
            yield_holder: list[dict[str, Any]] = []

            def record_retry(step: dict[str, Any]) -> None:
                steps.append(step)
                yield_holder.append({"type": "step", "step": step})

            execute_retry_until(
                compiled=compiled,
                node_id=node_id,
                config=node.config,
                dry_run=dry_run,
                walk_branch=walk_branch,
                record_step=record_retry,
            )
            for item in yield_holder:
                yield item
            return
        if not entry or not entry.handler:
            step = {"node_id": node_id, "kind": "action", "ok": False, "key": node.catalog_key}
            steps.append(step)
            yield {"type": "step", "step": step}
            return
        if not _run_policy_pre_action(
            event=event,
            node_id=node_id,
            catalog_key=node.catalog_key,
            action_config=node.config,
            steps=steps,
        ):
            step = {
                "node_id": node_id,
                "kind": "action",
                "key": node.catalog_key,
                "ok": False,
                "blocked_by_policy": True,
                "message": "Ação bloqueada por política do board",
            }
            steps.append(step)
            yield {"type": "step", "step": step}
            return
        if not _run_pre_action_hooks(
            event=event,
            context=context,
            rule_id=rule_id,
            dry_run=dry_run,
            node_id=node_id,
            catalog_key=node.catalog_key,
            action_config=node.config,
            steps=steps,
        ):
            step = {
                "node_id": node_id,
                "kind": "action",
                "key": node.catalog_key,
                "ok": False,
                "blocked_by_hook": True,
                "message": "Ação bloqueada por hook PreAction",
            }
            steps.append(step)
            yield {"type": "step", "step": step}
            return
        result = entry.handler(event, node.config, context, dry_run=dry_run)
        _run_post_action_hooks(
            event=event,
            context=context,
            rule_id=rule_id,
            dry_run=dry_run,
            node_id=node_id,
            catalog_key=node.catalog_key,
            action_config=node.config,
            action_result=result,
            steps=steps,
        )
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

    board_catalog = catalog_for_board(str(event.board_id) if event.board_id else None)
    compiled: CompiledGraph = compile_graph(graph)
    context = build_execution_context(event, rule_id=rule_id, automation_actor=automation_actor)
    context["dry_run"] = dry_run

    trigger_entry = board_catalog.get(compiled.trigger.catalog_key)
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

    pre_dispatch_steps, continue_dispatch = run_board_hooks(
        BoardAutomationHook.EVENT_PRE_DISPATCH,
        _hook_context(event=event, context=context, rule_id=rule_id, dry_run=dry_run),
    )
    for hook_step in pre_dispatch_steps:
        steps.append(hook_step)
        yield {"type": "step", "step": hook_step}
    if not continue_dispatch:
        yield {
            "type": "done",
            "result": {
                "matched": True,
                "passed_filters": False,
                "steps": steps,
                "dry_run": dry_run,
                "live": not dry_run,
                "blocked_by_hook": True,
            },
        }
        return

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

    on_complete_steps, _ = run_board_hooks(
        BoardAutomationHook.EVENT_ON_COMPLETE,
        _hook_context(event=event, context=context, rule_id=rule_id, dry_run=dry_run),
    )
    for hook_step in on_complete_steps:
        steps.append(hook_step)
        yield {"type": "step", "step": hook_step}

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
    board_catalog = catalog_for_board(str(event.board_id) if event.board_id else None)
    compiled: CompiledGraph = compile_graph(graph)
    context = build_execution_context(event, rule_id=rule_id, automation_actor=automation_actor)
    context["dry_run"] = dry_run

    trigger_entry = board_catalog.get(compiled.trigger.catalog_key)
    if not trigger_entry or not trigger_entry.handler:
        return {"matched": False, "steps": [], "error": "Trigger inválido"}

    if not trigger_entry.handler(event, compiled.trigger.config):
        return {"matched": False, "steps": [], "message": "Trigger não corresponde ao evento"}

    steps: list[dict[str, Any]] = []
    blocked = False

    pre_dispatch_steps, continue_dispatch = run_board_hooks(
        BoardAutomationHook.EVENT_PRE_DISPATCH,
        _hook_context(event=event, context=context, rule_id=rule_id, dry_run=dry_run),
    )
    steps.extend(pre_dispatch_steps)
    if not continue_dispatch:
        return {
            "matched": True,
            "passed_filters": False,
            "steps": steps,
            "dry_run": dry_run,
            "blocked_by_hook": True,
        }

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

    on_complete_steps, _ = run_board_hooks(
        BoardAutomationHook.EVENT_ON_COMPLETE,
        _hook_context(event=event, context=context, rule_id=rule_id, dry_run=dry_run),
    )
    steps.extend(on_complete_steps)

    return {
        "matched": True,
        "passed_filters": not blocked,
        "steps": steps,
        "dry_run": dry_run,
    }
