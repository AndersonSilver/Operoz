from __future__ import annotations

from unittest.mock import patch

import pytest
from rest_framework import status

from operoz.db.models import Board, Project


class TestBoardBase:
    def boards_url(self, workspace_slug: str) -> str:
        return f"/api/workspaces/{workspace_slug}/boards/"

    def board_url(self, workspace_slug: str, board_slug: str) -> str:
        return f"{self.boards_url(workspace_slug)}{board_slug}/"


@pytest.mark.contract
class TestBoardAPIPost(TestBoardBase):
    @pytest.mark.django_db
    def test_create_board_empty_data(self, session_client, workspace):
        response = session_client.post(self.boards_url(workspace.slug), {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    @patch("operoz.app.views.board.base.seed_board_issue_types")
    def test_create_board_valid_data(self, _mock_seed, session_client, workspace):
        payload = {"name": "Contract Board", "slug": "contract-board"}
        response = session_client.post(self.boards_url(workspace.slug), payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        board = Board.objects.get(slug="contract-board", workspace=workspace)
        assert board.name == "Contract Board"

    @pytest.mark.django_db
    @patch("operoz.app.views.board.base.seed_board_issue_types")
    def test_create_board_duplicate_slug(self, _mock_seed, session_client, workspace, workspace_board):
        response = session_client.post(
            self.boards_url(workspace.slug),
            {"name": "Other", "slug": workspace_board.slug},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
class TestBoardAPIGet(TestBoardBase):
    @pytest.mark.django_db
    def test_list_boards(self, session_client, workspace, workspace_board):
        response = session_client.get(self.boards_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        slugs = [item["slug"] for item in results]
        assert workspace_board.slug in slugs

    @pytest.mark.django_db
    def test_retrieve_board(self, session_client, workspace, workspace_board):
        response = session_client.get(self.board_url(workspace.slug, workspace_board.slug))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["slug"] == workspace_board.slug
        assert response.data["name"] == workspace_board.name

    @pytest.mark.django_db
    def test_retrieve_board_not_found(self, session_client, workspace):
        response = session_client.get(self.board_url(workspace.slug, "does-not-exist"))
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.contract
class TestBoardAPIPatch(TestBoardBase):
    @pytest.mark.django_db
    def test_patch_board_name(self, session_client, workspace, workspace_board):
        response = session_client.patch(
            self.board_url(workspace.slug, workspace_board.slug),
            {"name": "Renamed Board"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        workspace_board.refresh_from_db()
        assert workspace_board.name == "Renamed Board"


@pytest.mark.contract
class TestBoardHubAPI(TestBoardBase):
    @pytest.mark.django_db
    def test_board_hub_endpoints(self, session_client, workspace, workspace_board):
        slug, board_slug = workspace.slug, workspace_board.slug
        paths = [
            "meta/",
            "issues/",
            "modules/",
            "members/",
            "roles/",
            "issue-types/",
            "permission-catalog/",
        ]
        for suffix in paths:
            url = self.board_url(slug, board_slug) + suffix
            response = session_client.get(url)
            assert response.status_code == status.HTTP_200_OK, url

    @pytest.mark.django_db
    @patch("operoz.app.views.issue.base.issue_activity.delay")
    def test_board_issues_include_project_issues(
        self,
        _mock_activity,
        session_client,
        workspace,
        workspace_board,
    ):
        project_resp = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/",
            {
                "name": "Board Hub Project",
                "identifier": "BHP1",
                "board_id": str(workspace_board.id),
            },
            format="json",
        )
        assert project_resp.status_code == status.HTTP_201_CREATED
        project_id = project_resp.data["id"]

        issue_resp = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project_id}/issues/",
            {"name": "Hub issue"},
            format="json",
        )
        assert issue_resp.status_code == status.HTTP_201_CREATED

        hub_resp = session_client.get(self.board_url(workspace.slug, workspace_board.slug) + "issues/")
        assert hub_resp.status_code == status.HTTP_200_OK
        results = hub_resp.data.get("results", hub_resp.data)
        names = [row.get("name") for row in results]
        assert "Hub issue" in names
        assert Project.objects.filter(pk=project_id, board_id=workspace_board.id).exists()


@pytest.mark.contract
class TestBoardAutomationAPI(TestBoardBase):
    @pytest.mark.django_db
    def test_automation_catalog_and_rules_crud(self, session_client, workspace, workspace_board):
        slug, board_slug = workspace.slug, workspace_board.slug
        base = self.board_url(slug, board_slug) + "automation/"

        catalog_resp = session_client.get(base + "catalog/")
        assert catalog_resp.status_code == status.HTTP_200_OK
        assert "triggers" in catalog_resp.data
        assert "filters" in catalog_resp.data
        assert "actions" in catalog_resp.data
        assert len(catalog_resp.data["triggers"]) >= 1

        graph = {
            "nodes": [
                {
                    "id": "t1",
                    "data": {
                        "kind": "trigger",
                        "catalog_key": "issue.updated",
                        "label": "Card atualizado",
                        "config": {"event_type": "issue.updated"},
                    },
                    "position": {"x": 0, "y": 0},
                },
                {
                    "id": "a1",
                    "data": {
                        "kind": "action",
                        "catalog_key": "action.set_field",
                        "label": "Definir prioridade",
                        "config": {"field": "priority", "value": "high"},
                    },
                    "position": {"x": 200, "y": 0},
                },
            ],
            "edges": [{"id": "e1", "source": "t1", "target": "a1"}],
        }

        create_resp = session_client.post(
            base + "rules/",
            {"name": "Test rule", "enabled": False, "graph": graph},
            format="json",
        )
        assert create_resp.status_code == status.HTTP_201_CREATED
        rule_id = create_resp.data["id"]

        list_resp = session_client.get(base + "rules/")
        assert list_resp.status_code == status.HTTP_200_OK
        assert any(r["id"] == rule_id for r in list_resp.data)

        validate_resp = session_client.post(base + "validate/", {"graph": graph}, format="json")
        assert validate_resp.status_code == status.HTTP_200_OK
        assert validate_resp.data["valid"] is True

        patch_resp = session_client.patch(
            base + f"rules/{rule_id}/",
            {"enabled": True},
            format="json",
        )
        assert patch_resp.status_code == status.HTTP_200_OK
        assert patch_resp.data["enabled"] is True

        delete_resp = session_client.delete(base + f"rules/{rule_id}/")
        assert delete_resp.status_code == status.HTTP_204_NO_CONTENT

    @pytest.mark.django_db
    def test_automation_scripts_and_email_templates_crud(self, session_client, workspace, workspace_board):
        slug, board_slug = workspace.slug, workspace_board.slug
        base = self.board_url(slug, board_slug) + "automation/"

        script_resp = session_client.post(
            base + "scripts/",
            {
                "name": "Test script",
                "description": "Demo",
                "source_code": "return { ok: true };",
                "is_active": True,
            },
            format="json",
        )
        assert script_resp.status_code == status.HTTP_201_CREATED
        script_id = script_resp.data["id"]

        scripts_list = session_client.get(base + "scripts/")
        assert scripts_list.status_code == status.HTTP_200_OK
        assert any(s["id"] == script_id for s in scripts_list.data)

        template_resp = session_client.post(
            base + "email-templates/",
            {
                "name": "Test email",
                "description": "",
                "subject": "Hello",
                "html_body": "<p>{{issue.name}}</p>",
                "is_active": True,
            },
            format="json",
        )
        assert template_resp.status_code == status.HTTP_201_CREATED
        template_id = template_resp.data["id"]

        patch_script = session_client.patch(
            base + f"scripts/{script_id}/",
            {"name": "Updated script"},
            format="json",
        )
        assert patch_script.status_code == status.HTTP_200_OK
        assert patch_script.data["name"] == "Updated script"

        delete_template = session_client.delete(base + f"email-templates/{template_id}/")
        assert delete_template.status_code == status.HTTP_204_NO_CONTENT

        delete_script = session_client.delete(base + f"scripts/{script_id}/")
        assert delete_script.status_code == status.HTTP_204_NO_CONTENT

        catalog_resp = session_client.get(base + "catalog/")
        action_keys = [a["key"] for a in catalog_resp.data["actions"]]
        assert "action.run_script" in action_keys
        assert "action.send_email" in action_keys
