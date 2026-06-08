"""
F0 smoke automatizado — Operis (workspace → board → projeto → issue + hub board).

Substitui o checklist manual em docs/operis-f0-smoke-checklist.md para a camada API.
UI E2E fica para fase seguinte (Playwright).

Executar:
  ./scripts/run-f0-smoke.sh
"""

from __future__ import annotations

from unittest.mock import patch

import pytest
from rest_framework import status

from operis.db.models import Board, Issue, Project


def _boards_base(slug: str) -> str:
    return f"/api/workspaces/{slug}/boards/"


def _board_detail(slug: str, board_slug: str) -> str:
    return f"{_boards_base(slug)}{board_slug}/"


def _projects_base(slug: str) -> str:
    return f"/api/workspaces/{slug}/projects/"


def _issues_base(slug: str, project_id) -> str:
    return f"/api/workspaces/{slug}/projects/{project_id}/issues/"


@pytest.mark.smoke
class TestOperisF0ApiSmoke:
    """Smoke API alinhado ao checklist F0 (secções A–C + hub board B)."""

    @pytest.mark.django_db
    def test_instances_endpoint_responds(self, api_client):
        """Health: API instância responde (equiv. curl /api/instances/)."""
        response = api_client.get("/api/instances/")
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_workspace_list_for_authenticated_user(self, session_client, workspace):
        """A: utilizador autenticado vê o workspace."""
        response = session_client.get("/api/users/me/workspaces/")
        assert response.status_code == status.HTTP_200_OK
        rows = response.data if isinstance(response.data, list) else response.data.get("results", [])
        slugs = [row.get("slug") for row in rows]
        assert workspace.slug in slugs

    @pytest.mark.django_db
    def test_board_list_and_detail(self, session_client, workspace, workspace_board):
        """B1–B2: listar boards e detalhe."""
        list_resp = session_client.get(_boards_base(workspace.slug))
        assert list_resp.status_code == status.HTTP_200_OK
        results = list_resp.data.get("results", list_resp.data)
        slugs = [b["slug"] for b in results]
        assert workspace_board.slug in slugs

        detail_resp = session_client.get(_board_detail(workspace.slug, workspace_board.slug))
        assert detail_resp.status_code == status.HTTP_200_OK
        assert detail_resp.data["slug"] == workspace_board.slug

    @pytest.mark.django_db
    @patch("operis.app.views.board.base.seed_board_issue_types")
    def test_board_create_via_api(self, _mock_seed, session_client, workspace):
        """B2: criar board via API."""
        payload = {"name": "Smoke Board", "slug": "smoke-board-f0"}
        response = session_client.post(_boards_base(workspace.slug), payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert Board.objects.filter(slug="smoke-board-f0", workspace=workspace).exists()

    @pytest.mark.django_db
    def test_board_hub_endpoints(self, session_client, workspace, workspace_board):
        """B3–B9: endpoints agregados do hub (meta, issues, modules, members, roles)."""
        slug, board_slug = workspace.slug, workspace_board.slug
        endpoints = [
            (_board_detail(slug, board_slug) + "meta/", status.HTTP_200_OK),
            (_board_detail(slug, board_slug) + "issues/", status.HTTP_200_OK),
            (_board_detail(slug, board_slug) + "modules/", status.HTTP_200_OK),
            (_board_detail(slug, board_slug) + "members/", status.HTTP_200_OK),
            (_board_detail(slug, board_slug) + "roles/", status.HTTP_200_OK),
            (_board_detail(slug, board_slug) + "issue-types/", status.HTTP_200_OK),
            (_board_detail(slug, board_slug) + "permission-catalog/", status.HTTP_200_OK),
        ]
        for url, expected in endpoints:
            response = session_client.get(url)
            assert response.status_code == expected, f"GET {url} → {response.status_code}"

    @pytest.mark.django_db
    @patch("operis.app.views.issue.base.issue_activity.delay")
    def test_project_and_issue_flow(
        self,
        _mock_activity,
        session_client,
        workspace,
        workspace_board,
        create_user,
    ):
        """C1–C4: projeto no board + criar issue."""
        project_resp = session_client.post(
            _projects_base(workspace.slug),
            {
                "name": "Smoke Project F0",
                "identifier": "SMK0",
                "board_id": str(workspace_board.id),
            },
            format="json",
        )
        assert project_resp.status_code == status.HTTP_201_CREATED
        project_id = project_resp.data["id"]
        project = Project.objects.get(pk=project_id)
        assert project.board_id == workspace_board.id

        issue_resp = session_client.post(
            _issues_base(workspace.slug, project_id),
            {"name": "Smoke issue F0"},
            format="json",
        )
        assert issue_resp.status_code == status.HTTP_201_CREATED
        assert Issue.objects.filter(project=project, name="Smoke issue F0").exists()

        list_resp = session_client.get(_issues_base(workspace.slug, project_id))
        assert list_resp.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_workspace_member_cannot_leave_as_only_admin(self, session_client, workspace):
        """A / governança: único admin não pode sair do workspace."""
        url = f"/api/workspaces/{workspace.slug}/members/leave/"
        response = session_client.post(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "only admin" in response.data.get("error", "").lower()
