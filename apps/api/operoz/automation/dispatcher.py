from __future__ import annotations

import logging

from operoz.automation.domain import DomainEvent
from operoz.automation.governance import check_dispatch_allowed
from operoz.automation.matching import rule_trigger_matches_event
from operoz.automation.rule_lifecycle import get_rule_execution_graph
from operoz.automation.observability import automation_log, bind_correlation, record_metric
from operoz.automation.outbox import schedule_automation_jobs

logger = logging.getLogger(__name__)


def dispatch_domain_event(event: DomainEvent) -> None:
    if event.automation_origin:
        return

    from operoz.db.models import BoardAutomationRule

    bind_correlation(event.event_id)

    rules = (
        BoardAutomationRule.objects.filter(
            board_id=event.board_id,
            enabled=True,
            deleted_at__isnull=True,
        )
        .select_related("created_by", "board", "workspace")
        .order_by("sort_order", "created_at")
    )

    matched_rules = []
    skipped_no_match = 0
    blocked = 0

    for rule in rules:
        if not get_rule_execution_graph(rule).get("nodes"):
            skipped_no_match += 1
            continue
        if not rule_trigger_matches_event(rule, event):
            skipped_no_match += 1
            continue

        allowed, reason = check_dispatch_allowed(rule, event)
        if not allowed:
            blocked += 1
            record_metric("dispatch_blocked", reason=reason)
            automation_log(
                "dispatch_blocked",
                rule_id=str(rule.id),
                board_id=event.board_id,
                reason=reason,
            )
            continue

        matched_rules.append(rule)

    record_metric("dispatch_rules_matched", amount=len(matched_rules))
    record_metric("dispatch_rules_skipped", amount=skipped_no_match)

    automation_log(
        "dispatch_completed",
        board_id=event.board_id,
        event_type=event.event_type,
        event_id=event.event_id,
        matched=len(matched_rules),
        skipped=skipped_no_match,
        blocked=blocked,
    )

    schedule_automation_jobs(event, matched_rules)
