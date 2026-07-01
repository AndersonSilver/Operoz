from __future__ import annotations

import re
from typing import Literal

AssistantIntent = Literal["documentation", "metrics", "automation", "general"]

_DOC_PATTERNS = (
    r"\bdocumenta[cç][aã]o\b",
    r"\bp[aá]gina\b",
    r"\bprd\b",
    r"\bguia\b",
    r"\bmanual\b",
    r"\bwiki\b",
    r"\bcomo funciona\b",
    r"\bo que diz\b",
    r"\bdescreve\b",
    r"\bprocedimento\b",
    r"\bespecificação\b",
    r"\bespecificacao\b",
)

_METRICS_PATTERNS = (
    r"\bm[eé]trica",
    r"\bquantos?\b",
    r"\bquantas?\b",
    r"\bestat[ií]stica",
    r"\bintake\b",
    r"\bcliente\s*360\b",
    r"\bpendente",
    r"\bkpi\b",
    r"\bdashboard\b",
    r"\brelat[oó]rio\b",
)

_AUTOMATION_PATTERNS = (
    r"\bautoma[cç][aã]o",
    r"\bregra\b",
    r"\bcri[ae]r?\s+(uma\s+)?regra",
    r"\bquando\s+(o\s+)?card",
    r"\bpack\b",
    r"\binstale?\b",
    r"\bpor\s+que\s+.*falhou",
    r"\bporque\s+.*falhou",
    r"\bexplica.*falha",
    r"\bstatus\s+report",
    r"\bpublicar\s+regra",
    r"\bdry[- ]?run",
    r"\bwebhook\b",
    r"\bstep_logs\b",
    r"\brun\b",
)


def _count_patterns(text: str, patterns: tuple[str, ...]) -> int:
    return sum(1 for pattern in patterns if re.search(pattern, text))


def classify_chat_intent(message: str) -> AssistantIntent:
    """Heurística leve: documentação → RAG; métricas → tools."""
    text = (message or "").strip().lower()
    if not text:
        return "general"

    doc_score = _count_patterns(text, _DOC_PATTERNS)
    metrics_score = _count_patterns(text, _METRICS_PATTERNS)
    automation_score = _count_patterns(text, _AUTOMATION_PATTERNS)

    scores = {
        "documentation": doc_score,
        "metrics": metrics_score,
        "automation": automation_score,
    }
    best = max(scores, key=scores.get)
    if scores[best] > 0:
        return best  # type: ignore[return-value]
    return "general"
