from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import urlparse

from django.utils import timezone

from operoz.db.models import BoardAutomationPolicy, BoardAutomationPublishAudit, BoardAutomationRule

FORBIDDEN_SCRIPT_PATTERNS: tuple[re.Pattern[str], ...] = tuple(
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"child_process",
        r"node:child_process",
        r"node:fs",
        r"node:os",
        r"from\s+['\"]fs['\"]",
        r"from\s+['\"]node:fs['\"]",
        r"require\s*\(\s*['\"]fs['\"]",
        r"require\s*\(\s*['\"]child_process['\"]",
        r"process\.exit\s*\(",
        r"eval\s*\(",
        r"Function\s*\(",
    )
)

DEFAULT_POLICY = {
    "webhook_allowlist_enabled": False,
    "webhook_allowed_domains": [],
    "script_timeout_seconds": 10,
    "script_max_memory_mb": 128,
    "script_block_dangerous_imports": True,
    "require_dry_run_before_enable": False,
}


@dataclass
class PolicyOutcome:
    allowed: bool = True
    message: str = ""
    code: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)


def get_or_create_board_policy(board) -> BoardAutomationPolicy:
    policy, _ = BoardAutomationPolicy.objects.get_or_create(
        board=board,
        defaults={"workspace": board.workspace, **DEFAULT_POLICY},
    )
    return policy


def get_board_policy(board_id: str) -> BoardAutomationPolicy | None:
    return (
        BoardAutomationPolicy.objects.filter(board_id=board_id, deleted_at__isnull=True).select_related("board").first()
    )


def policy_step_payload(
    *,
    code: str,
    outcome: PolicyOutcome,
    node_id: str | None,
    catalog_key: str | None,
) -> dict[str, Any]:
    return {
        "kind": "policy",
        "policy_code": code,
        "allowed": outcome.allowed,
        "passed": outcome.allowed,
        "ok": outcome.allowed,
        "message": outcome.message,
        "node_id": node_id,
        "key": catalog_key,
        "catalog_key": catalog_key,
    }


def _normalize_domains(domains: list[Any] | None) -> list[str]:
    return [str(d).strip().lower() for d in (domains or []) if str(d).strip()]


def check_webhook_url(policy: BoardAutomationPolicy, url: str) -> PolicyOutcome:
    if not policy.webhook_allowlist_enabled:
        return PolicyOutcome(allowed=True)
    if not url:
        return PolicyOutcome(allowed=False, message="URL do webhook ausente", code="webhook_url_missing")
    domains = _normalize_domains(policy.webhook_allowed_domains)
    if not domains:
        return PolicyOutcome(allowed=True)
    host = (urlparse(url).hostname or "").lower()
    allowed = any(host == domain or host.endswith(f".{domain}") for domain in domains)
    if not allowed:
        return PolicyOutcome(
            allowed=False,
            message=f"Domínio não permitido pela política do board: {host or url}",
            code="webhook_domain_denied",
        )
    return PolicyOutcome(allowed=True, message="Webhook permitido pela política do board")


def evaluate_pre_action_policy(
    board_id: str,
    *,
    catalog_key: str | None,
    action_config: dict[str, Any] | None,
) -> PolicyOutcome:
    policy = get_board_policy(board_id)
    if not policy:
        return PolicyOutcome(allowed=True)

    if catalog_key == "action.webhook":
        url = str((action_config or {}).get("url") or "")
        return check_webhook_url(policy, url)

    return PolicyOutcome(allowed=True)


def validate_script_source(policy: BoardAutomationPolicy, source_code: str) -> PolicyOutcome:
    if not policy.script_block_dangerous_imports:
        return PolicyOutcome(allowed=True)
    for pattern in FORBIDDEN_SCRIPT_PATTERNS:
        if pattern.search(source_code or ""):
            return PolicyOutcome(
                allowed=False,
                message=f"Script bloqueado pela política: padrão proibido ({pattern.pattern})",
                code="script_import_denied",
            )
    return PolicyOutcome(allowed=True)


def script_runtime_limits(policy: BoardAutomationPolicy) -> dict[str, int]:
    timeout = max(1, min(int(policy.script_timeout_seconds or 10), 120))
    memory_mb = max(32, min(int(policy.script_max_memory_mb or 128), 512))
    return {"timeout_seconds": timeout, "max_memory_mb": memory_mb}


def can_enable_rule(rule: BoardAutomationRule, policy: BoardAutomationPolicy | None = None) -> PolicyOutcome:
    policy = policy or get_board_policy(str(rule.board_id))
    if not policy or not policy.require_dry_run_before_enable:
        return PolicyOutcome(allowed=True)
    if not rule.published_version:
        return PolicyOutcome(allowed=False, message="Publique o fluxo antes de ativar.", code="publish_required")
    if (rule.dry_run_verified_version or 0) < rule.published_version:
        return PolicyOutcome(
            allowed=False,
            message="Execute um dry-run bem-sucedido desta versão publicada antes de ativar.",
            code="dry_run_required",
        )
    return PolicyOutcome(allowed=True)


def mark_dry_run_verified(rule: BoardAutomationRule, *, graph: dict[str, Any], result: dict[str, Any]) -> None:
    if result.get("dry_run") is False:
        return
    if not result.get("matched"):
        return
    if result.get("passed_filters") is False:
        return
    target_version = rule.published_version or 0
    if target_version and graph == (rule.published_graph or {}):
        rule.dry_run_verified_version = target_version
        rule.save(update_fields=["dry_run_verified_version", "updated_at"])


def summarize_graph_diff(old_graph: dict[str, Any] | None, new_graph: dict[str, Any] | None) -> dict[str, Any]:
    old_nodes = {n.get("id"): n for n in (old_graph or {}).get("nodes", []) if n.get("id")}
    new_nodes = {n.get("id"): n for n in (new_graph or {}).get("nodes", []) if n.get("id")}
    added = sorted(node_id for node_id in new_nodes if node_id not in old_nodes)
    removed = sorted(node_id for node_id in old_nodes if node_id not in new_nodes)
    changed: list[str] = []
    for node_id in sorted(set(old_nodes) & set(new_nodes)):
        if old_nodes[node_id] != new_nodes[node_id]:
            changed.append(node_id)
    return {
        "added_nodes": added,
        "removed_nodes": removed,
        "changed_nodes": changed,
        "nodes_before": len(old_nodes),
        "nodes_after": len(new_nodes),
    }


def record_publish_audit(
    rule: BoardAutomationRule,
    *,
    actor,
    previous_graph: dict[str, Any] | None,
) -> BoardAutomationPublishAudit:
    return BoardAutomationPublishAudit.objects.create(
        rule=rule,
        board=rule.board,
        workspace=rule.workspace,
        published_version=rule.published_version,
        graph_diff=summarize_graph_diff(previous_graph, rule.published_graph),
        published_by=actor,
        published_at=rule.published_at or timezone.now(),
    )
