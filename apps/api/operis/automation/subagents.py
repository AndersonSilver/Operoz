from __future__ import annotations

import json
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

from operis.automation.automation_llm import llm_json_completion


def parallel_triage_classifiers(
    *,
    prompt: str,
    classifiers: list[dict[str, Any]],
    context: dict[str, Any],
    dry_run: bool = False,
) -> dict[str, Any]:
    """Executa N classificadores LLM em paralelo e faz merge por voto majoritário."""
    if not classifiers:
        return {"ok": False, "error": "no_classifiers"}

    if dry_run:
        first = classifiers[0]
        return {
            "ok": True,
            "dry_run": True,
            "label": first.get("label"),
            "confidence": 100,
            "votes": {str(first.get("label")): 1},
        }

    context_json = json.dumps(context, default=str)[:4000]

    def run_one(spec: dict[str, Any]) -> dict[str, Any]:
        label = str(spec.get("label") or "unknown")
        system = (
            'Responda APENAS JSON {"label": string, "confidence": number 0-100}. '
            f'O label deve ser exatamente "{label}".'
        )
        user = f"{prompt}\n\nContexto:\n{context_json}"
        result = llm_json_completion(system=system, user=user)
        if not result.get("ok"):
            return {"label": label, "confidence": 0, "error": result.get("error")}
        return {
            "label": str(result.get("label") or label),
            "confidence": int(result.get("confidence") or 0),
        }

    votes: list[str] = []
    confidences: list[int] = []
    with ThreadPoolExecutor(max_workers=min(3, len(classifiers))) as pool:
        futures = [pool.submit(run_one, spec) for spec in classifiers[:3]]
        for future in as_completed(futures):
            item = future.result()
            votes.append(str(item.get("label")))
            confidences.append(int(item.get("confidence") or 0))

    tally = Counter(votes)
    winner, count = tally.most_common(1)[0]
    avg_confidence = sum(confidences) // max(len(confidences), 1)
    return {
        "ok": True,
        "label": winner,
        "confidence": avg_confidence,
        "votes": dict(tally),
        "winner_votes": count,
    }
