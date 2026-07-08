"""Converte Atlassian Document Format (ADF) do Jira REST API v3 em HTML."""

from __future__ import annotations

import ast
import html
import json
from typing import Any


def description_needs_jira_repair(description_html: str | None) -> bool:
    """Detecta descrições importadas com ADF cru (dict/JSON) em vez de HTML."""
    if not description_html:
        return False
    markers = (
        "'type': 'doc'",
        '"type":"doc"',
        '"type": "doc"',
        "{'type':",
        '{"type":',
    )
    return any(marker in description_html for marker in markers)


def _parse_adf_document(value: str) -> dict | None:
    stripped = value.strip()
    if not stripped.startswith("{") or "type" not in stripped:
        return None
    try:
        parsed = json.loads(stripped)
        if isinstance(parsed, dict) and parsed.get("type") == "doc":
            return parsed
    except json.JSONDecodeError:
        pass
    try:
        parsed = ast.literal_eval(stripped)
        if isinstance(parsed, dict) and parsed.get("type") == "doc":
            return parsed
    except (ValueError, SyntaxError):
        pass
    return None


def jira_description_to_html(description: Any, media_urls: dict[str, str] | None = None) -> str:
    """Normaliza description do Jira (ADF dict, string legada ou vazio) para HTML."""
    if not description:
        return ""
    if isinstance(description, str):
        adf = _parse_adf_document(description)
        if adf:
            return adf_to_html(adf, media_urls=media_urls)
        if description_needs_jira_repair(description):
            adf = _parse_adf_document(description.strip().strip("<p>").strip("</p>"))
            if adf:
                return adf_to_html(adf, media_urls=media_urls)
        return f"<p>{html.escape(description)}</p>"
    if isinstance(description, dict):
        if description.get("type") == "doc":
            return adf_to_html(description, media_urls=media_urls)
        return f"<p>{html.escape(str(description))}</p>"
    return f"<p>{html.escape(str(description))}</p>"


def resolve_jira_description_html(
    jira_description: Any,
    *,
    media_urls: dict[str, str] | None = None,
    existing_description_html: str | None = None,
) -> str:
    """Converte description do Jira; repara ADF cru já gravado no card quando o Jira não devolve o campo."""
    desc_html = jira_description_to_html(jira_description, media_urls=media_urls)
    if desc_html and not description_needs_jira_repair(desc_html):
        return desc_html

    if existing_description_html and description_needs_jira_repair(existing_description_html):
        repaired = jira_description_to_html(existing_description_html, media_urls=media_urls)
        if repaired and not description_needs_jira_repair(repaired):
            return repaired

    return desc_html


def adf_to_html(doc: dict, media_urls: dict[str, str] | None = None) -> str:
    if doc.get("type") != "doc":
        return ""
    return "".join(
        _adf_node_to_html(node, media_urls=media_urls) for node in doc.get("content") or [] if isinstance(node, dict)
    )


def _apply_marks(text: str, marks: list[dict]) -> str:
    for mark in reversed(marks):
        mtype = mark.get("type")
        mattrs = mark.get("attrs") or {}
        if mtype == "strong":
            text = f"<strong>{text}</strong>"
        elif mtype == "em":
            text = f"<em>{text}</em>"
        elif mtype == "code":
            text = f"<code>{text}</code>"
        elif mtype == "link":
            href = html.escape(mattrs.get("href") or "#", quote=True)
            text = f'<a href="{href}" rel="noopener noreferrer">{text}</a>'
        elif mtype == "strike":
            text = f"<s>{text}</s>"
        elif mtype == "underline":
            text = f"<u>{text}</u>"
    return text


def _resolve_media_url(attrs: dict, media_urls: dict[str, str] | None) -> str:
    url = (attrs.get("url") or "").strip()
    if url or not media_urls:
        return url
    media_id = str(attrs.get("id") or "").strip()
    alt = str(attrs.get("alt") or attrs.get("title") or "").strip()
    for key in (media_id, alt):
        if key and media_urls.get(key):
            return media_urls[key]
    return ""


def _adf_node_to_html(node: dict, media_urls: dict[str, str] | None = None) -> str:
    node_type = node.get("type")
    content = node.get("content") or []
    attrs = node.get("attrs") or {}

    if node_type == "text":
        text = html.escape(node.get("text") or "")
        return _apply_marks(text, node.get("marks") or [])

    children = "".join(_adf_node_to_html(child, media_urls=media_urls) for child in content if isinstance(child, dict))

    if node_type == "doc":
        return children
    if node_type == "paragraph":
        return f"<p>{children}</p>"
    if node_type == "heading":
        level = min(max(int(attrs.get("level") or 1), 1), 6)
        return f"<h{level}>{children}</h{level}>"
    if node_type == "bulletList":
        return f"<ul>{children}</ul>"
    if node_type == "orderedList":
        return f"<ol>{children}</ol>"
    if node_type == "listItem":
        return f"<li>{children}</li>"
    if node_type == "hardBreak":
        return "<br>"
    if node_type == "codeBlock":
        return f"<pre><code>{children}</code></pre>"
    if node_type == "blockquote":
        return f"<blockquote>{children}</blockquote>"
    if node_type == "rule":
        return "<hr>"
    if node_type in {"mediaSingle", "mediaGroup"}:
        return children
    if node_type == "media":
        alt = html.escape(attrs.get("alt") or attrs.get("title") or "media")
        url = _resolve_media_url(attrs, media_urls)
        if url:
            safe_url = html.escape(url, quote=True)
            return f'<p><img src="{safe_url}" alt="{alt}" /></p>'
        return f"<p><em>[Imagem: {alt}]</em></p>"
    if node_type == "mention":
        label = html.escape(attrs.get("text") or attrs.get("id") or "@mention")
        return f"<span>{label}</span>"
    if node_type == "emoji":
        return html.escape(attrs.get("shortName") or attrs.get("text") or "")
    if node_type == "panel":
        return f"<blockquote>{children}</blockquote>"
    if node_type == "table":
        return f"<table>{children}</table>"
    if node_type == "tableRow":
        return f"<tr>{children}</tr>"
    if node_type == "tableHeader":
        return f"<th>{children}</th>"
    if node_type == "tableCell":
        return f"<td>{children}</td>"
    if node_type in {"inlineCard", "blockCard"}:
        url = attrs.get("url") or ""
        if url:
            safe_url = html.escape(url, quote=True)
            return f'<p><a href="{safe_url}" rel="noopener noreferrer">{safe_url}</a></p>'
        return children
    return children
