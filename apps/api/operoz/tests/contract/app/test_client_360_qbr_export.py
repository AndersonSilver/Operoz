from __future__ import annotations

import pytest
from rest_framework import status


def _qbr_url(workspace_slug: str) -> str:
    return f"/api/workspaces/{workspace_slug}/client-360/qbr/"


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceClient360QbrExportAPI:
    def test_portfolio_markdown_export(self, session_client, workspace, setup_instance):
        response = session_client.get(_qbr_url(workspace.slug), {"export_format": "md"})
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"].startswith("text/markdown")
        assert "attachment" in response["Content-Disposition"]
        body = response.content.decode("utf-8")
        assert body.startswith("# QBR")

    def test_invalid_format(self, session_client, workspace, setup_instance):
        response = session_client.get(_qbr_url(workspace.slug), {"export_format": "docx"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_invalid_weeks(self, session_client, workspace, setup_instance):
        response = session_client.get(_qbr_url(workspace.slug), {"weeks": 99})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
