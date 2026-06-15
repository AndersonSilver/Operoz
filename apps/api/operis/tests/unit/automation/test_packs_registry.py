from __future__ import annotations

import pytest

from operis.automation.catalog import catalog_for_board, ensure_catalog
from operis.automation.packs_lifecycle import install_automation_pack, uninstall_automation_pack
from operis.automation.packs_registry import (
    clear_pack_cache,
    get_automation_pack,
    list_automation_packs,
    validate_all_automation_packs,
)
from operis.automation.packs_sandbox import validate_pack_catalog_entry, validate_pack_hook
from operis.db.models import BoardAutomationHook, BoardAutomationPackInstall, BoardAutomationRule


PACK_NAME = "operis-pack-gestao-operacional"


@pytest.mark.unit
class TestAutomationPacksRegistry:
    def test_validate_all_packs(self):
        assert validate_all_automation_packs() == []

    def test_list_includes_official_pack(self):
        names = [item["name"] for item in list_automation_packs()]
        assert PACK_NAME in names

    def test_official_pack_has_hooks_and_rules(self):
        bundle = get_automation_pack(PACK_NAME)
        assert bundle is not None
        assert len(bundle.load_hooks()) >= 1
        assert len(bundle.rules()) == 3


@pytest.mark.unit
class TestAutomationPacksSandbox:
    def test_rejects_python_handler_in_catalog(self):
        base = ensure_catalog()
        errors = validate_pack_catalog_entry(
            {
                "key": "evil.action",
                "kind": "action",
                "label": "Evil",
                "handler_ref": "action.notify",
                "handler": "os.system",
            },
            base,
        )
        assert any("proibido" in err for err in errors)

    def test_rejects_unknown_handler_ref(self):
        base = ensure_catalog()
        errors = validate_pack_catalog_entry(
            {
                "key": "pack.unknown",
                "kind": "action",
                "label": "X",
                "handler_ref": "action.does_not_exist",
            },
            base,
        )
        assert any("handler_ref" in err for err in errors)

    def test_rejects_invalid_hook_handler(self):
        errors = validate_pack_hook(
            {
                "name": "Bad",
                "event": "pre_action",
                "handler_type": "run_python",
            }
        )
        assert any("handler_type" in err for err in errors)


@pytest.mark.unit
class TestAutomationPackInstall:
    def setup_method(self):
        clear_pack_cache()

    def test_install_and_uninstall(self, workspace, workspace_board, create_user):
        install = install_automation_pack(workspace_board, PACK_NAME, actor=create_user)
        assert install.pack_name == PACK_NAME
        assert BoardAutomationPackInstall.objects.filter(board=workspace_board, pack_name=PACK_NAME).count() == 1
        assert BoardAutomationHook.objects.filter(board=workspace_board).count() >= 1
        assert BoardAutomationRule.objects.filter(board=workspace_board, name__startswith="[Pack]").count() == 3

        catalog = catalog_for_board(str(workspace_board.id))
        assert catalog.to_api_list()  # merge ok

        uninstall_automation_pack(workspace_board, PACK_NAME)
        assert not BoardAutomationPackInstall.objects.filter(
            board=workspace_board, pack_name=PACK_NAME, deleted_at__isnull=True
        ).exists()
        assert BoardAutomationRule.objects.filter(board=workspace_board, name__startswith="[Pack]").count() == 0

    def test_install_twice_fails(self, workspace, workspace_board, create_user):
        install_automation_pack(workspace_board, PACK_NAME, actor=create_user)
        with pytest.raises(ValueError, match="pack_already_installed"):
            install_automation_pack(workspace_board, PACK_NAME, actor=create_user)
