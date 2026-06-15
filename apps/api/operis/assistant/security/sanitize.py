from __future__ import annotations

import nh3

ALLOWED_ASSISTANT_TAGS = frozenset({"p", "br", "strong", "em", "code", "pre", "ul", "ol", "li", "a"})
ALLOWED_ASSISTANT_ATTRIBUTES = {
    "a": {"href", "title"},
}


def sanitize_assistant_content(content: str) -> str:
    """Remove XSS de respostas do assistente antes de persistir ou renderizar."""
    text = (content or "").strip()
    if not text:
        return ""
    if "<" not in text and ">" not in text:
        return text
    return nh3.clean(
        text,
        tags=ALLOWED_ASSISTANT_TAGS,
        attributes=ALLOWED_ASSISTANT_ATTRIBUTES,
        url_schemes={"http", "https", "mailto"},
        link_rel="noopener noreferrer nofollow",
    )
