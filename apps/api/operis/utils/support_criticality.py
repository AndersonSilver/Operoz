from __future__ import annotations

CRITICALITY_VALUES: frozenset[str] = frozenset({"p0", "p1", "p2", "p3", "p4", "not_incident"})

CRITICALITY_LABELS: dict[str, str] = {
    "p0": "P0 — CRÍTICO",
    "p1": "P1 — ALTO",
    "p2": "P2 — MÉDIO",
    "p3": "P3 — BAIXO",
    "p4": "P4 — PLANEJADO",
    "not_incident": "NÃO É INCIDENTE",
}

DEFAULT_SLA_MINUTES: dict[str, int] = {
    "p0": 240,
    "p1": 480,
    "p2": 1440,
    "p3": 4320,
    "p4": 10080,
    "not_incident": 10080,
}


def is_valid_criticality(value: str | None) -> bool:
    return bool(value) and value in CRITICALITY_VALUES


def criticality_label(value: str | None) -> str:
    if not value:
        return ""
    return CRITICALITY_LABELS.get(value, value)
