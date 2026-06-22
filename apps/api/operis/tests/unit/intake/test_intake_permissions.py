from unittest.mock import Mock, patch

import pytest

from operis.utils.intake_permissions import (
    SUPPORT_TICKET_DELETE_ERROR,
    user_can_delete_support_ticket,
    user_is_workspace_admin,
)


@pytest.mark.unit
class TestSupportTicketDeleteErrorConstant:
    def test_error_message_is_stable(self):
        assert SUPPORT_TICKET_DELETE_ERROR == "Only board admin can delete the support ticket"


@pytest.mark.unit
@pytest.mark.django_db
class TestUserIsWorkspaceAdmin:
    def test_workspace_owner_fixture_is_admin(self, create_user, workspace):
        assert user_is_workspace_admin(create_user, workspace.slug) is True

    def test_non_member_is_not_admin(self, create_user, workspace):
        assert user_is_workspace_admin(create_user, "other-workspace") is False


@pytest.mark.unit
class TestUserCanDeleteSupportTicket:
    def _project(self, board_id="board-1"):
        project = Mock()
        project.board_id = board_id
        return project

    @patch("operis.utils.intake_permissions.user_is_workspace_admin", return_value=True)
    def test_workspace_admin_can_delete(self, _mock_ws_admin):
        user = Mock()
        assert user_can_delete_support_ticket(user, self._project(), workspace_slug="ws") is True

    @patch("operis.utils.intake_permissions.user_is_workspace_admin", return_value=False)
    def test_no_board_id_denies_delete(self, _mock_ws_admin):
        user = Mock()
        project = self._project(board_id=None)
        assert user_can_delete_support_ticket(user, project, workspace_slug="ws") is False

    @patch("operis.utils.intake_permissions.user_is_workspace_admin", return_value=False)
    @patch("operis.utils.intake_permissions.user_can_administer_board", return_value=False)
    @patch("operis.utils.intake_permissions.get_effective_board_permission_keys", return_value=None)
    def test_project_admin_without_board_role_cannot_delete(self, *_mocks):
        user = Mock()
        assert user_can_delete_support_ticket(user, self._project(), workspace_slug="ws") is False

    @patch("operis.utils.intake_permissions.user_is_workspace_admin", return_value=False)
    @patch("operis.utils.intake_permissions.user_can_administer_board", return_value=False)
    @patch(
        "operis.utils.intake_permissions.get_effective_board_permission_keys",
        return_value={"items.edit"},
    )
    def test_board_member_without_administer_cannot_delete(self, *_mocks):
        user = Mock()
        assert user_can_delete_support_ticket(user, self._project(), workspace_slug="ws") is False

    @patch("operis.utils.intake_permissions.user_is_workspace_admin", return_value=False)
    @patch(
        "operis.utils.intake_permissions.get_effective_board_permission_keys",
        return_value={"board.administer"},
    )
    def test_board_administrator_can_delete(self, *_mocks):
        user = Mock()
        assert user_can_delete_support_ticket(user, self._project(), workspace_slug="ws") is True

    @patch("operis.utils.intake_permissions.user_is_workspace_admin", return_value=False)
    @patch("operis.utils.intake_permissions.get_effective_board_permission_keys", return_value=None)
    @patch("operis.utils.intake_permissions.user_can_administer_board", return_value=True)
    def test_legacy_board_admin_fallback(self, *_mocks):
        user = Mock()
        assert user_can_delete_support_ticket(user, self._project(), workspace_slug="ws") is True

    @patch("operis.utils.intake_permissions.user_is_workspace_admin", return_value=False)
    @patch("operis.utils.intake_permissions.user_can_administer_board", return_value=False)
    @patch("operis.utils.intake_permissions.get_effective_board_permission_keys", return_value=set())
    def test_explicit_board_roles_without_administer(self, *_mocks):
        user = Mock()
        assert user_can_delete_support_ticket(user, self._project(), workspace_slug="ws") is False
