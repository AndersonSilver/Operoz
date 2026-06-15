from __future__ import annotations

import os
import re
from dataclasses import dataclass


def orchestrator_enabled() -> bool:
    return os.environ.get("ASSISTANT_ORCHESTRATOR_ENABLED", "0").lower() in ("1", "true", "yes")


@dataclass(frozen=True)
class OrchestrationPlan:
    subtasks: tuple[str, ...]
    hint: str


_COMPLEX_PATTERNS = (
    r"\be também\b",
    r"\bal[eé]m disso\b",
    r"\bdepois\b",
    r"\bem seguida\b",
    r"\bprimeiro\b.+\bsegundo\b",
    r"\b1[\).\]]\s+.+\b2[\).\]]",
)


def _split_numbered_items(text: str) -> list[str]:
    parts = re.split(r"\n\s*\d+[\).\]]\s+", text)
    cleaned = [p.strip() for p in parts if p.strip()]
    return cleaned if len(cleaned) >= 2 else []


def decompose_complex_query(message: str) -> OrchestrationPlan | None:
    """Scaffold futuro: decompõe perguntas compostas em sub-tarefas sequenciais."""
    if not orchestrator_enabled():
        return None

    text = (message or "").strip()
    if not text:
        return None

    question_marks = text.count("?")
    if question_marks >= 2:
        parts = [p.strip() + ("?" if not p.strip().endswith("?") else "") for p in text.split("?") if p.strip()]
        if len(parts) >= 2:
            return OrchestrationPlan(
                subtasks=tuple(parts[:5]),
                hint="Responda cada sub-tarefa em ordem, citando fontes entre etapas.",
            )

    for pattern in _COMPLEX_PATTERNS:
        if re.search(pattern, text, flags=re.IGNORECASE | re.DOTALL):
            numbered = _split_numbered_items(text)
            if numbered:
                return OrchestrationPlan(
                    subtasks=tuple(numbered[:5]),
                    hint="Execute as etapas na ordem listada.",
                )
            segments = re.split(r"\be também\b|\bal[eé]m disso\b", text, flags=re.IGNORECASE)
            segments = [s.strip() for s in segments if s.strip()]
            if len(segments) >= 2:
                return OrchestrationPlan(
                    subtasks=tuple(segments[:5]),
                    hint="Trate cada parte como sub-tarefa sequencial.",
                )

    return None


def format_orchestration_block(plan: OrchestrationPlan) -> str:
    lines = ["\n\n## Plano de sub-tarefas (orquestrador)", plan.hint]
    for index, task in enumerate(plan.subtasks, start=1):
        lines.append(f"{index}. {task}")
    return "\n".join(lines)
