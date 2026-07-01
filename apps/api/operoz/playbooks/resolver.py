from __future__ import annotations

from typing import Any

from operoz.db.models import BoardPlaybook

INTENT_AUTOMATION = "automation"
INTENT_GENERAL = "general"


def _metadata_intents(metadata: dict[str, Any] | None) -> list[str]:
    raw = (metadata or {}).get("intents") or []
    return [str(item).strip().lower() for item in raw if str(item).strip()]


def _metadata_tags(metadata: dict[str, Any] | None) -> list[str]:
    raw = (metadata or {}).get("tags") or []
    return [str(item).strip().lower() for item in raw if str(item).strip()]


def playbook_matches_intent(metadata: dict[str, Any] | None, intent: str) -> bool:
    intents = _metadata_intents(metadata)
    if not intents:
        return True
    normalized = (intent or INTENT_GENERAL).strip().lower()
    if normalized in intents:
        return True
    if INTENT_GENERAL in intents and normalized in {INTENT_GENERAL, "documentation", "metrics"}:
        return True
    return False


def playbook_matches_automation(metadata: dict[str, Any] | None) -> bool:
    intents = _metadata_intents(metadata)
    tags = _metadata_tags(metadata)
    if INTENT_AUTOMATION in intents:
        return True
    if "automation" in tags or "sla" in tags or "glossary" in tags:
        return True
    return not intents


def _active_playbooks_qs(board_id: str):
    return BoardPlaybook.objects.filter(
        board_id=board_id,
        is_active=True,
        published_version__gt=0,
        deleted_at__isnull=True,
    ).order_by("sort_order", "-updated_at")


def resolve_playbooks_for_intent(board_id: str, intent: str, *, limit: int = 2) -> list[BoardPlaybook]:
    matched: list[BoardPlaybook] = []
    for playbook in _active_playbooks_qs(board_id):
        if playbook_matches_intent(playbook.metadata, intent):
            matched.append(playbook)
        if len(matched) >= limit:
            break
    return matched


def resolve_playbooks_for_automation(board_id: str, *, limit: int = 2) -> list[BoardPlaybook]:
    return resolve_shared_board_playbooks(board_id, limit=limit)


def resolve_shared_board_playbooks(board_id: str, *, limit: int = 2) -> list[BoardPlaybook]:
    """Playbooks publicados injetados no assistente (intent automation) e no executor."""
    matched: list[BoardPlaybook] = []
    for playbook in _active_playbooks_qs(board_id):
        if playbook_matches_automation(playbook.metadata):
            matched.append(playbook)
        if len(matched) >= limit:
            break
    return matched


def format_playbook_snippets(playbooks: list[BoardPlaybook], *, max_chars: int = 4000) -> str:
    if not playbooks:
        return ""

    parts: list[str] = []
    remaining = max_chars
    for playbook in playbooks:
        body = (playbook.published_markdown or "").strip()
        if not body:
            continue
        snippet = f"## Playbook: {playbook.title}\n{body}"
        if len(snippet) > remaining:
            snippet = snippet[:remaining]
        parts.append(snippet)
        remaining -= len(snippet)
        if remaining <= 0:
            break

    if not parts:
        return ""
    return "\n\n".join(parts)
