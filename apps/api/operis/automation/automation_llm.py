from __future__ import annotations

import json
import logging
import re
from typing import Any

from operis.assistant.llm.client import chat_completion

logger = logging.getLogger(__name__)

JSON_BLOCK = re.compile(r"\{[\s\S]*\}")


def _extract_json(text: str) -> dict[str, Any] | None:
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = JSON_BLOCK.search(text)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def llm_json_completion(
    *,
    system: str,
    user: str,
    dry_run: bool = False,
    dry_run_payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if dry_run:
        return dict(dry_run_payload or {"ok": True, "dry_run": True})

    result = chat_completion(
        [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        tools=None,
    )
    if result.error:
        return {"ok": False, "error": result.error}
    payload = _extract_json(result.content or "")
    if not payload:
        return {"ok": False, "error": "invalid_llm_json"}
    payload["ok"] = True
    payload["model"] = result.model
    return payload
