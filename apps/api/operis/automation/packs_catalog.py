from __future__ import annotations

from functools import lru_cache

from operis.automation.catalog.registry import AutomationCatalog, CatalogEntry
from operis.automation.packs_sandbox import catalog_entry_from_pack


@lru_cache(maxsize=256)
def _pack_overlay_entries(board_id: str) -> tuple[CatalogEntry, ...]:
    from operis.db.models import BoardAutomationPackInstall

    entries: list[CatalogEntry] = []
    from operis.automation.catalog import ensure_catalog

    base = ensure_catalog()
    installs = BoardAutomationPackInstall.objects.filter(
        board_id=board_id,
        deleted_at__isnull=True,
    ).only("catalog_overlay")

    for install in installs:
        overlay = install.catalog_overlay or []
        for raw in overlay:
            if not isinstance(raw, dict):
                continue
            try:
                entries.append(catalog_entry_from_pack(raw, base))
            except ValueError:
                continue
    return tuple(entries)


def merge_installed_pack_catalog(base: AutomationCatalog, board_id: str) -> AutomationCatalog:
    overlay = _pack_overlay_entries(board_id)
    if not overlay:
        return base
    return base.merge(list(overlay))


def clear_pack_catalog_cache(board_id: str | None = None) -> None:
    if board_id is None:
        _pack_overlay_entries.cache_clear()
        return
    _pack_overlay_entries.cache_clear()
