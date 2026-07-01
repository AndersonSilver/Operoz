from __future__ import annotations

import json
from typing import Any

from operoz.automation.automation_llm import llm_json_completion
from operoz.automation.domain import DomainEvent

DEFAULT_CONFIDENCE_THRESHOLD = 80


def _branch_catalog(branches: list[dict[str, Any]]) -> str:
    lines = []
    for branch in branches:
        lines.append(
            f"- id={branch.get('id')}: {branch.get('label')} — {branch.get('description') or ''}".strip()
        )
    return "\n".join(lines)


def evaluate_llm_decision(
    event: DomainEvent,
    config: dict[str, Any],
    context: dict[str, Any],
    *,
    dry_run: bool = False,
) -> str | None:
    dry_run = dry_run or bool(context.get("dry_run"))
    branches = list(config.get("branches") or [])
    if not branches:
        return config.get("human_branch_id")

    human_branch_id = config.get("human_branch_id")
    threshold = int(config.get("confidence_threshold", DEFAULT_CONFIDENCE_THRESHOLD))
    prompt = str(config.get("prompt") or "Classifique o evento e escolha o ramo mais adequado.")

    if dry_run:
        return str(branches[0].get("id") or human_branch_id or "")

    issue = context.get("issue")
    issue_snapshot: dict[str, Any] = {}
    if issue is not None:
        issue_snapshot = {
            "id": str(getattr(issue, "id", "")),
            "name": getattr(issue, "name", ""),
            "priority": getattr(issue, "priority", ""),
        }
    context_snapshot = {
        "event": event.to_dict(),
        "issue": issue_snapshot,
        "board_id": event.board_id,
    }
    system = (
        "Você classifica eventos de automação Operoz. Responda APENAS JSON válido com "
        '{"branch_id": string, "confidence": number 0-100, "reasoning": string}. '
        f"confidence_threshold do fluxo: {threshold}."
    )
    user = (
        f"{prompt}\n\nRamos disponíveis:\n{_branch_catalog(branches)}\n\n"
        f"Contexto:\n{json.dumps(context_snapshot, default=str)[:6000]}"
    )

    result = llm_json_completion(system=system, user=user)
    if not result.get("ok"):
        return human_branch_id

    branch_id = result.get("branch_id")
    confidence = int(result.get("confidence") or 0)
    valid_ids = {str(b.get("id")) for b in branches if b.get("id")}
    if branch_id not in valid_ids:
        return human_branch_id
    if confidence < threshold:
        return human_branch_id or branch_id
    return str(branch_id)
