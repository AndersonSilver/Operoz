from __future__ import annotations

import logging
import re
from typing import TYPE_CHECKING, Any

from operoz.db.models import FileAsset
from operoz.utils.html_processor import strip_tags

if TYPE_CHECKING:
    from operoz.db.models import Page

logger = logging.getLogger(__name__)

_HTML_DOCUMENT_EMBED_RE = re.compile(r"<html-document-embed\b([^>]*)/?>", re.IGNORECASE)
_ATTR_RE = re.compile(r'([\w-]+)\s*=\s*(["\'])(.*?)\2', re.DOTALL)

# Cap HTML asset reads for assistant indexing (bytes).
_DEFAULT_MAX_ASSET_BYTES = 2_000_000


def parse_html_document_embeds(description_html: str) -> list[tuple[str, str]]:
    """Return (asset_id, title) pairs from html-document-embed nodes in page HTML."""
    normalized = description_html or ""
    if not normalized.strip():
        return []

    refs: list[tuple[str, str]] = []
    seen: set[str] = set()
    for match in _HTML_DOCUMENT_EMBED_RE.finditer(normalized):
        attrs = _parse_tag_attributes(match.group(1))
        asset_id = (attrs.get("src") or "").strip()
        if not asset_id or asset_id in seen:
            continue
        seen.add(asset_id)
        title = (attrs.get("title") or "Documento HTML").strip() or "Documento HTML"
        refs.append((asset_id, title))
    return refs


def _merge_embed_refs(*sources: list[tuple[str, str]]) -> list[tuple[str, str]]:
    merged: list[tuple[str, str]] = []
    seen: set[str] = set()
    for refs in sources:
        for asset_id, title in refs:
            if asset_id in seen:
                continue
            seen.add(asset_id)
            merged.append((asset_id, title))
    return merged


def parse_editor_json_document_embeds(description_json: dict[str, Any] | list[Any] | None) -> list[tuple[str, str]]:
    """Return (asset_id, title) pairs from htmlDocumentEmbed nodes in TipTap JSON."""
    if not description_json:
        return []

    refs: list[tuple[str, str]] = []
    seen: set[str] = set()

    def walk(node: Any) -> None:
        if isinstance(node, dict):
            if node.get("type") == "htmlDocumentEmbed":
                attrs = node.get("attrs")
                attrs_dict = attrs if isinstance(attrs, dict) else {}
                asset_id = str(attrs_dict.get("src") or "").strip()
                if asset_id and asset_id not in seen:
                    seen.add(asset_id)
                    raw_title = attrs_dict.get("title")
                    title = raw_title.strip() if isinstance(raw_title, str) and raw_title.strip() else "Documento HTML"
                    refs.append((asset_id, title))
            content = node.get("content")
            if isinstance(content, list):
                for child in content:
                    walk(child)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(description_json)
    return refs


def collect_html_document_embeds_from_content(
    description_html: str,
    description_json: dict[str, Any] | list[Any] | None,
) -> list[tuple[str, str]]:
    """Merge html-document-embed refs from saved HTML and editor JSON."""
    return _merge_embed_refs(
        parse_html_document_embeds(description_html or ""),
        parse_editor_json_document_embeds(description_json),
    )


def collect_page_html_document_embeds(page: Page) -> list[tuple[str, str]]:
    """Merge html-document-embed refs from saved HTML and editor JSON."""
    return collect_html_document_embeds_from_content(page.description_html, page.description_json)


def _parse_tag_attributes(attr_string: str) -> dict[str, str]:
    parsed: dict[str, str] = {}
    for match in _ATTR_RE.finditer(attr_string or ""):
        parsed[match.group(1).lower()] = match.group(3)
    return parsed


def _read_storage_object_bytes(object_name: str, *, max_bytes: int) -> bytes | None:
    if not object_name:
        return None
    try:
        from operoz.settings.storage import S3Storage

        storage = S3Storage()
        response = storage.s3_client.get_object(
            Bucket=storage.aws_storage_bucket_name,
            Key=object_name,
            Range=f"bytes=0-{max_bytes}",
        )
        return response["Body"].read(max_bytes + 1)
    except Exception:
        logger.warning("assistant: failed to read storage object %s", object_name, exc_info=True)
        return None


def read_html_document_asset_text(asset_id: str, *, max_bytes: int = _DEFAULT_MAX_ASSET_BYTES) -> str | None:
    """Load a PAGE_DESCRIPTION HTML asset and return stripped plain text."""
    asset = (
        FileAsset.objects.filter(pk=asset_id, is_deleted=False, deleted_at__isnull=True)
        .only("id", "asset", "attributes")
        .first()
    )
    if not asset or not asset.asset or not asset.asset.name:
        return None

    raw = _read_storage_object_bytes(asset.asset.name, max_bytes=max_bytes)
    if raw is None:
        return None

    if len(raw) > max_bytes:
        raw = raw[:max_bytes]

    charset = "utf-8"
    attrs = asset.attributes if isinstance(asset.attributes, dict) else {}
    encoding = attrs.get("encoding") or attrs.get("charset")
    if isinstance(encoding, str) and encoding.strip():
        charset = encoding.strip()

    try:
        html = raw.decode(charset)
    except (LookupError, UnicodeDecodeError):
        html = raw.decode("utf-8", errors="replace")

    text = strip_tags(html).strip()
    return text or None


def read_html_document_asset_html(asset_id: str, *, max_bytes: int = _DEFAULT_MAX_ASSET_BYTES) -> str | None:
    """Load a PAGE_DESCRIPTION HTML asset and return raw HTML."""
    asset = (
        FileAsset.objects.filter(pk=asset_id, is_deleted=False, deleted_at__isnull=True)
        .only("id", "asset", "attributes")
        .first()
    )
    if not asset or not asset.asset or not asset.asset.name:
        return None

    raw = _read_storage_object_bytes(asset.asset.name, max_bytes=max_bytes)
    if raw is None:
        return None

    if len(raw) > max_bytes:
        raw = raw[:max_bytes]

    charset = "utf-8"
    attrs = asset.attributes if isinstance(asset.attributes, dict) else {}
    encoding = attrs.get("encoding") or attrs.get("charset")
    if isinstance(encoding, str) and encoding.strip():
        charset = encoding.strip()

    try:
        return raw.decode(charset)
    except (LookupError, UnicodeDecodeError):
        return raw.decode("utf-8", errors="replace")


def build_page_indexable_text(page: Page) -> str:
    """Plain text for RAG/tools: inline page body plus embedded HTML document assets."""
    parts: list[str] = []

    name = (page.name or "").strip()
    if name:
        parts.append(name)

    inline = (page.description_stripped or "").strip()
    if inline:
        parts.append(inline)

    for asset_id, title in collect_page_html_document_embeds(page):
        embed_text = read_html_document_asset_text(asset_id)
        if not embed_text:
            continue
        section_title = title.strip() or "Documento HTML"
        parts.append(f"## {section_title}\n\n{embed_text}")

    if not parts and name:
        return name
    return "\n\n".join(parts).strip()
