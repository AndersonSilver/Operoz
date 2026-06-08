from operis.automation.catalog.actions import register_actions
from operis.automation.catalog.decisions import register_decisions
from operis.automation.catalog.filters import register_filters
from operis.automation.catalog.registry import AutomationCatalog, catalog
from operis.automation.catalog.triggers import register_triggers

_catalog_loaded = False


def ensure_catalog() -> AutomationCatalog:
    global _catalog_loaded
    if not _catalog_loaded:
        register_triggers()
        register_filters()
        register_decisions()
        register_actions()
        _catalog_loaded = True
    return catalog
