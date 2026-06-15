from operis.automation.catalog.actions import register_actions
from operis.automation.catalog.decisions import register_decisions
from operis.automation.catalog.filters import register_filters
from operis.automation.catalog.parallel import register_parallel
from operis.automation.catalog.registry import AutomationCatalog, catalog
from operis.automation.catalog.triggers import register_triggers

_catalog_loaded = False


def ensure_catalog() -> AutomationCatalog:
    global _catalog_loaded
    if not _catalog_loaded:
        register_triggers()
        register_filters()
        register_decisions()
        register_parallel()
        register_actions()
        _catalog_loaded = True
    return catalog


def catalog_for_board(board_id: str | None = None) -> AutomationCatalog:
    base = ensure_catalog()
    if not board_id:
        return base
    from operis.automation.packs_catalog import merge_installed_pack_catalog

    return merge_installed_pack_catalog(base, str(board_id))
