from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.utils import timezone

from operoz.automation.domain import DomainEvent
from operoz.automation.graph_trigger import extract_trigger_from_graph
from operoz.automation.rule_lifecycle import get_rule_execution_graph

logger = logging.getLogger(__name__)

# ISO weekday (0=Monday) → cron weekday (0=Sunday)
_WEEKDAY_ISO_TO_CRON = {0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 0}

DEFAULT_SCHEDULE_CONFIG: dict[str, Any] = {
    "preset": "daily",
    "time": "09:00",
    "weekdays": [0, 1, 2, 3, 4],
    "day_of_month": 1,
    "cron": "0 9 * * *",
    "timezone": "America/Sao_Paulo",
}


def default_schedule_config() -> dict[str, Any]:
    return dict(DEFAULT_SCHEDULE_CONFIG)


def parse_time_hm(value: str) -> tuple[int, int]:
    parts = (value or "").strip().split(":")
    if len(parts) != 2:
        raise ValueError("time_invalid")
    hour, minute = int(parts[0]), int(parts[1])
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        raise ValueError("time_invalid")
    return hour, minute


def cron_from_config(config: dict[str, Any]) -> str:
    preset = config.get("preset") or "daily"
    if preset == "custom":
        cron = (config.get("cron") or "").strip()
        if not cron:
            raise ValueError("cron_required")
        return cron

    hour, minute = parse_time_hm(str(config.get("time") or "09:00"))

    if preset == "daily":
        return f"{minute} {hour} * * *"
    if preset == "weekly":
        weekdays = config.get("weekdays") or [0, 1, 2, 3, 4]
        if not weekdays:
            raise ValueError("weekdays_required")
        cron_days = ",".join(str(_WEEKDAY_ISO_TO_CRON[int(d)]) for d in sorted(set(weekdays)))
        return f"{minute} {hour} * * {cron_days}"
    if preset == "monthly":
        dom = int(config.get("day_of_month") or 1)
        if not (1 <= dom <= 31):
            raise ValueError("day_of_month_invalid")
        return f"{minute} {hour} {dom} * *"
    raise ValueError("preset_invalid")


def _error_message(code: str) -> str:
    messages = {
        "time_invalid": "Horário inválido. Use HH:MM.",
        "cron_required": "Informe a expressão cron.",
        "weekdays_required": "Selecione pelo menos um dia da semana.",
        "day_of_month_invalid": "Dia do mês deve ser entre 1 e 31.",
        "preset_invalid": "Tipo de agendamento inválido.",
    }
    return messages.get(code, code)


def validate_schedule_config(config: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    tz_name = config.get("timezone") or "UTC"
    try:
        ZoneInfo(tz_name)
    except ZoneInfoNotFoundError:
        errors.append(f"Fuso horário inválido: {tz_name}")
        return errors

    try:
        cron_expr = cron_from_config(config)
    except ValueError as exc:
        errors.append(_error_message(str(exc.args[0])))
        return errors

    try:
        from croniter import croniter

        if not croniter.is_valid(cron_expr):
            errors.append(f"Expressão cron inválida: {cron_expr}")
    except ImportError:
        logger.warning("croniter not installed — skipping cron validation")

    return errors


def current_slot_key(now: datetime, tz_name: str) -> str:
    tz = ZoneInfo(tz_name)
    local = now.astimezone(tz).replace(second=0, microsecond=0)
    return local.strftime("%Y-%m-%dT%H:%M")


def is_slot_due(
    now: datetime,
    config: dict[str, Any],
    *,
    last_slot: str = "",
    grace_minutes: int = 15,
) -> str | None:
    """Retorna o slot cron pendente mais recente (com janela de recuperação se o worker estava parado)."""
    from croniter import croniter

    tz_name = config.get("timezone") or "UTC"
    cron_expr = cron_from_config(config)
    tz = ZoneInfo(tz_name)
    local_now = now.astimezone(tz).replace(second=0, microsecond=0)

    for minutes_back in range(grace_minutes + 1):
        candidate = local_now - timedelta(minutes=minutes_back)
        base = (candidate - timedelta(minutes=1)).replace(tzinfo=None)
        cron = croniter(cron_expr, base)
        next_fire = cron.get_next(datetime).replace(tzinfo=tz)
        if next_fire != candidate:
            continue
        slot = candidate.strftime("%Y-%m-%dT%H:%M")
        if slot != last_slot:
            return slot
    return None


def build_schedule_event(rule, slot: str, config: dict[str, Any]) -> DomainEvent:
    now = timezone.now()
    event_id = f"schedule:{rule.id}:{slot}"
    return DomainEvent(
        event_id=event_id,
        event_type="schedule.cron",
        workspace_id=str(rule.workspace_id),
        board_id=str(rule.board_id),
        actor_id=None,
        entity_type="schedule",
        entity_id=str(rule.id),
        project_id=None,
        payload={
            "rule_id": str(rule.id),
            "slot": slot,
            "cron": cron_from_config(config),
            "timezone": config.get("timezone") or "UTC",
            "preset": config.get("preset"),
        },
        occurred_at=now,
        automation_origin=False,
    )


def dispatch_due_scheduled_rules() -> int:
    from operoz.automation.dispatcher import dispatch_domain_event
    from operoz.db.models import BoardAutomationRule

    now = timezone.now()
    rules = BoardAutomationRule.objects.filter(
        enabled=True,
        deleted_at__isnull=True,
    ).select_related("board", "workspace", "created_by")

    dispatched = 0
    for rule in rules:
        graph = get_rule_execution_graph(rule)
        if not graph.get("nodes"):
            continue
        extracted = extract_trigger_from_graph(graph)
        if not extracted:
            continue
        catalog_key, config = extracted
        if catalog_key != "schedule.cron":
            continue

        try:
            slot = is_slot_due(now, config, last_slot=rule.schedule_last_slot or "")
        except Exception:
            logger.exception("schedule slot check failed rule=%s", rule.id)
            continue
        if not slot:
            continue
        if rule.schedule_last_slot == slot:
            continue

        event = build_schedule_event(rule, slot, config)
        dispatch_domain_event(event)
        BoardAutomationRule.objects.filter(pk=rule.id).update(schedule_last_slot=slot)
        dispatched += 1

    return dispatched
