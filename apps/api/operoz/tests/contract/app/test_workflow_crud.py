from __future__ import annotations

import pytest
from django.db.models.signals import post_save
from rest_framework import status

from operoz.db.models import User, Workflow, WorkflowScheme


@pytest.fixture(autouse=True)
def mute_user_notification_preferences_signal():
    from operoz.db.models.user import create_user_notification

    post_save.disconnect(create_user_notification, sender=User)
    yield
    post_save.connect(create_user_notification, sender=User)


@pytest.mark.contract
class TestWorkflowCrudContract:
    @pytest.mark.django_db
    def test_create_workflow_without_workspace_in_body(self, session_client, workspace):
        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/workflows/",
            {"name": "Contract workflow", "description": ""},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Contract workflow"
        assert str(response.data["workspace"]) == str(workspace.id)
        assert Workflow.objects.filter(workspace=workspace, name="Contract workflow").exists()

    @pytest.mark.django_db
    def test_create_workflow_scheme_without_workspace_in_body(self, session_client, workspace):
        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/workflow-schemes/",
            {"name": "Contract scheme", "is_default": True},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Contract scheme"
        assert response.data["is_default"] is True
        assert str(response.data["workspace"]) == str(workspace.id)
        assert WorkflowScheme.objects.filter(workspace=workspace, name="Contract scheme").exists()

    @pytest.mark.django_db
    def test_list_workflows_and_schemes(self, session_client, workspace):
        session_client.post(
            f"/api/workspaces/{workspace.slug}/workflows/",
            {"name": "Listed workflow"},
            format="json",
        )
        session_client.post(
            f"/api/workspaces/{workspace.slug}/workflow-schemes/",
            {"name": "Listed scheme"},
            format="json",
        )

        workflows = session_client.get(f"/api/workspaces/{workspace.slug}/workflows/")
        schemes = session_client.get(f"/api/workspaces/{workspace.slug}/workflow-schemes/")

        assert workflows.status_code == status.HTTP_200_OK
        assert schemes.status_code == status.HTTP_200_OK

        workflow_results = workflows.data if isinstance(workflows.data, list) else workflows.data.get("results", workflows.data)
        scheme_results = schemes.data if isinstance(schemes.data, list) else schemes.data.get("results", schemes.data)
        assert any(item["name"] == "Listed workflow" for item in workflow_results)
        assert any(item["name"] == "Listed scheme" for item in scheme_results)

    @pytest.mark.django_db
    def test_save_workflow_scheme_entries(self, session_client, workspace):
        workflow_response = session_client.post(
            f"/api/workspaces/{workspace.slug}/workflows/",
            {"name": "Scheme target workflow"},
            format="json",
        )
        assert workflow_response.status_code == status.HTTP_201_CREATED
        workflow_id = workflow_response.data["id"]

        scheme_response = session_client.post(
            f"/api/workspaces/{workspace.slug}/workflow-schemes/",
            {"name": "Scheme for entries"},
            format="json",
        )
        assert scheme_response.status_code == status.HTTP_201_CREATED
        scheme_id = scheme_response.data["id"]

        save_response = session_client.put(
            f"/api/workspaces/{workspace.slug}/workflow-schemes/{scheme_id}/entries/",
            {
                "name": "Scheme for entries",
                "is_default": False,
                "entries": [{"issue_type": None, "workflow": workflow_id}],
            },
            format="json",
        )

        assert save_response.status_code == status.HTTP_200_OK
        assert save_response.data["name"] == "Scheme for entries"
        assert len(save_response.data["entries"]) == 1
        assert str(save_response.data["entries"][0]["workflow"]) == str(workflow_id)
