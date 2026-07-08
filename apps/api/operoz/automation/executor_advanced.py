from __future__ import annotations

import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Callable

from operoz.automation.compiler import CompiledGraph, get_parallel_branch_targets


def _branch_join_ok(results: list[bool], join_policy: str) -> bool:
    if not results:
        return True
    if join_policy == "any":
        return any(results)
    return all(results)


def execute_fan_out(
    *,
    compiled: CompiledGraph,
    node_id: str,
    config: dict[str, Any],
    walk_branch: Callable[[str], tuple[list[dict[str, Any]], bool]],
    record_step: Callable[[dict[str, Any]], None],
) -> bool:
    join_policy = str(config.get("join_policy") or "all")
    branches = get_parallel_branch_targets(compiled, node_id)
    if len(branches) < 2:
        record_step(
            {
                "node_id": node_id,
                "kind": "parallel",
                "key": "parallel.fan_out",
                "ok": False,
                "message": "Fan-out requer pelo menos dois ramos conectados.",
            }
        )
        return False

    branch_meta: list[dict[str, Any]] = []
    branch_ok: list[bool] = []

    def run_branch(
        index: int, source_handle: str | None, target_id: str
    ) -> tuple[int, str | None, str, list[dict[str, Any]], bool]:
        steps, ok = walk_branch(target_id)
        for step in steps:
            step["parallel_branch_index"] = index
            step["parallel_branch_handle"] = source_handle
            step["parallel_fan_out_id"] = node_id
        return index, source_handle, target_id, steps, ok

    collected_steps: list[dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=min(8, len(branches))) as pool:
        futures = [
            pool.submit(run_branch, index, source_handle, target_id)
            for index, (source_handle, target_id) in enumerate(branches)
        ]
        for future in as_completed(futures):
            index, source_handle, target_id, steps, ok = future.result()
            branch_ok.append(ok)
            branch_meta.append(
                {
                    "branch_index": index,
                    "target_id": target_id,
                    "ok": ok,
                    "step_count": len(steps),
                }
            )
            collected_steps.extend(steps)

    joined_ok = _branch_join_ok(branch_ok, join_policy)
    record_step(
        {
            "node_id": node_id,
            "kind": "parallel",
            "key": "parallel.fan_out",
            "join_policy": join_policy,
            "branches": sorted(branch_meta, key=lambda item: item["branch_index"]),
            "ok": joined_ok,
            "passed": joined_ok,
        }
    )
    for step in collected_steps:
        record_step(step)
    return joined_ok


def execute_retry_until(
    *,
    compiled: CompiledGraph,
    node_id: str,
    config: dict[str, Any],
    dry_run: bool,
    walk_branch: Callable[[str], tuple[list[dict[str, Any]], bool]],
    record_step: Callable[[dict[str, Any]], None],
) -> bool:
    max_iterations = max(1, int(config.get("max_iterations") or 3))
    backoff_seconds = max(0.0, float(config.get("backoff_seconds") or 0))

    from operoz.automation.compiler import get_outgoing_targets

    child_targets = get_outgoing_targets(compiled, node_id)
    if not child_targets:
        record_step(
            {
                "node_id": node_id,
                "kind": "action",
                "key": "action.retry_until",
                "ok": False,
                "message": "Conecte pelo menos uma ação após o nó retry_until.",
            }
        )
        return False

    final_ok = False
    for iteration in range(1, max_iterations + 1):
        iteration_steps: list[dict[str, Any]] = []
        iteration_ok = True
        for target_id in child_targets:
            steps, ok = walk_branch(target_id)
            for step in steps:
                step["retry_iteration"] = iteration
                step["retry_parent_id"] = node_id
            iteration_steps.extend(steps)
            if not ok:
                iteration_ok = False

        record_step(
            {
                "node_id": node_id,
                "kind": "action",
                "key": "action.retry_until",
                "iteration": iteration,
                "max_iterations": max_iterations,
                "ok": iteration_ok,
                "passed": iteration_ok,
                "message": f"Tentativa {iteration}/{max_iterations}",
            }
        )
        for step in iteration_steps:
            record_step(step)

        if iteration_ok:
            final_ok = True
            break
        if not dry_run and backoff_seconds > 0 and iteration < max_iterations:
            time.sleep(backoff_seconds)

    return final_ok
