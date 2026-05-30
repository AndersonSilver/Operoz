# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

from __future__ import annotations

import json
import re
import unicodedata
from functools import lru_cache
from pathlib import Path

BRACKET_RE = re.compile(r"\[\s*([^\]]+?)\s*\]")
_ALIASES_PATH = Path(__file__).resolve().parent / "client_aliases.json"


def _norm(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    normalized = "".join(c for c in normalized if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", normalized).lower().strip()


@lru_cache(maxsize=1)
def load_client_aliases() -> dict[str, list[str]]:
    if not _ALIASES_PATH.is_file():
        return {}
    data = json.loads(_ALIASES_PATH.read_text(encoding="utf-8"))
    return {canonical: [_norm(v) for v in variants] for canonical, variants in data.items()}


def resolve_client(summary: str | None, aliases: dict[str, list[str]] | None = None) -> str | None:
    if not summary:
        return None
    match = BRACKET_RE.search(summary)
    if not match:
        return None
    raw = match.group(1).strip()
    if not raw:
        return None

    aliases = aliases if aliases is not None else load_client_aliases()
    norm = _norm(raw)

    for canonical, variants in aliases.items():
        if norm == _norm(canonical) or norm in variants:
            return canonical
        for variant in variants:
            if variant in norm or norm in variant:
                return canonical
    return raw


def slug_identifier(name: str) -> str:
    value = unicodedata.normalize("NFKD", name)
    value = "".join(c for c in value if not unicodedata.combining(c))
    value = re.sub(r"[^a-zA-Z0-9]+", "", value).upper()[:12]
    return value or "PROJ"
