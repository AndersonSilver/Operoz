from __future__ import annotations

import json
from typing import Any

from django.db import transaction
from django.utils import timezone

from operis.automation.validator import validate_graph
from operis.db.models import BoardAutomationRule, BoardAutomationRuleRevision


def graphs_equal(left: dict[str, Any] | None, right: dict[str, Any] | None) -> bool:
    return json.dumps(left or {}, sort_keys=True, default=str) == json.dumps(
        right or {}, sort_keys=True, default=str
    )


def rule_has_published_graph(rule: BoardAutomationRule) -> bool:
    return bool((rule.published_graph or {}).get("nodes"))


def rule_has_unpublished_changes(rule: BoardAutomationRule) -> bool:
    if not rule_has_published_graph(rule):
        return bool((rule.graph or {}).get("nodes"))
    return not graphs_equal(rule.graph, rule.published_graph)


def get_rule_execution_graph(rule: BoardAutomationRule) -> dict[str, Any]:
    return rule.published_graph or {}


def _create_revision(
    rule: BoardAutomationRule,
    *,
    kind: str,
    actor,
) -> BoardAutomationRuleRevision:
    return BoardAutomationRuleRevision.objects.create(
        rule=rule,
        board=rule.board,
        workspace=rule.workspace,
        kind=kind,
        graph=rule.graph or {},
        name=rule.name,
        description=rule.description,
        graph_version=rule.graph_version,
        created_by=actor,
        updated_by=actor,
    )


@transaction.atomic
def save_rule_draft(
    rule: BoardAutomationRule,
    *,
    actor,
    name: str | None = None,
    description: str | None = None,
    graph: dict[str, Any] | None = None,
    enabled: bool | None = None,
    record_revision: bool = True,
) -> BoardAutomationRule:
    updates: list[str] = []

    if name is not None and name != rule.name:
        rule.name = name
        updates.append("name")
    if description is not None and description != rule.description:
        rule.description = description
        updates.append("description")
    if enabled is not None and enabled != rule.enabled:
        if enabled and not rule_has_published_graph(rule):
            raise ValueError("publish_required_before_enable")
        rule.enabled = enabled
        updates.append("enabled")
    if graph is not None:
        validation = validate_graph(graph)
        if graph and not validation["valid"]:
            raise ValueError(json.dumps({"graph_errors": validation["errors"]}))
        if not graphs_equal(graph, rule.graph):
            rule.graph = graph
            updates.append("graph")

    if not updates:
        return rule

    rule.updated_by = actor
    updates.append("updated_by")
    rule.save(update_fields=[*updates, "updated_at"])

    if record_revision and any(field in updates for field in ("graph", "name", "description")):
        _create_revision(rule, kind=BoardAutomationRuleRevision.KIND_DRAFT, actor=actor)

    return rule


@transaction.atomic
def publish_rule_draft(rule: BoardAutomationRule, *, actor) -> BoardAutomationRule:
    graph = rule.graph or {}
    validation = validate_graph(graph)
    if not validation["valid"]:
        raise ValueError(json.dumps({"graph_errors": validation["errors"]}))

    rule.published_graph = graph
    rule.published_version = (rule.published_version or 0) + 1
    rule.published_at = timezone.now()
    rule.updated_by = actor
    rule.save(
        update_fields=[
            "published_graph",
            "published_version",
            "published_at",
            "updated_by",
            "updated_at",
        ]
    )
    _create_revision(rule, kind=BoardAutomationRuleRevision.KIND_PUBLISHED, actor=actor)
    return rule


@transaction.atomic
def restore_rule_revision(
    rule: BoardAutomationRule,
    revision: BoardAutomationRuleRevision,
    *,
    actor,
) -> BoardAutomationRule:
    if revision.rule_id != rule.id:
        raise ValueError("revision_not_found")

    rule.graph = revision.graph or {}
    rule.name = revision.name
    rule.description = revision.description
    rule.graph_version = revision.graph_version
    rule.updated_by = actor
    rule.save(
        update_fields=[
            "graph",
            "name",
            "description",
            "graph_version",
            "updated_by",
            "updated_at",
        ]
    )
    _create_revision(rule, kind=BoardAutomationRuleRevision.KIND_DRAFT, actor=actor)
    return rule
