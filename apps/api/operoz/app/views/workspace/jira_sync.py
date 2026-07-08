from dataclasses import replace

from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions import ROLE, allow_permission
from operoz.app.views.base import BaseAPIView
from operoz.bgtasks.jira_ops_sync_task import get_sync_status, start_jira_ops_sync
from operoz.db.models import Workspace
from operoz.utils.jira_ops import JiraOpsClient, preview_jira_ops_import
from operoz.utils.jira_ops.workspace_config import (
    config_to_api_dict,
    credentials_from_config,
    get_or_create_config,
    get_workspace_credentials,
    update_workspace_config,
    workspace_jira_configured,
)
from operoz.utils.jira_ops.jira_dates import set_active_jira_cloud


class WorkspaceJiraOpsSyncEndpoint(BaseAPIView):
    """Configuração e sincronização Jira OPS por workspace (somente admin)."""

    def _workspace(self, slug: str) -> Workspace:
        return Workspace.objects.get(slug=slug)

    def _response_payload(self, workspace: Workspace) -> dict:
        config = get_or_create_config(workspace)
        creds = get_workspace_credentials(workspace)
        env_fallback = creds is not None and credentials_from_config(config) is None
        payload = {
            **config_to_api_dict(config, configured=creds is not None, uses_env_fallback=env_fallback),
            **get_sync_status(workspace.slug),
        }
        return payload

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        workspace = self._workspace(slug)
        return Response(self._response_payload(workspace), status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug):
        workspace = self._workspace(slug)
        update_workspace_config(workspace, request.data)
        return Response(self._response_payload(workspace), status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = self._workspace(slug)
        if not workspace_jira_configured(workspace):
            return Response(
                {
                    "error": ("Configure Cloud ID, e-mail e token da API Jira nesta página antes de sincronizar."),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        current = get_sync_status(slug)
        if current.get("status") == "running":
            return Response(
                {"error": "Já existe uma sincronização em andamento.", **current},
                status=status.HTTP_409_CONFLICT,
            )

        creds = get_workspace_credentials(workspace)
        board_slug = request.data.get("board_slug") or (creds.board_slug if creds else "squad-as-a-service")
        payload = start_jira_ops_sync(slug, board_slug, str(request.user.id))
        return Response({**self._response_payload(workspace), **payload}, status=status.HTTP_202_ACCEPTED)


class WorkspaceJiraOpsSyncPreviewEndpoint(BaseAPIView):
    """Pré-visualização do que será criado/atualizado no Operoz (somente admin)."""

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        if not workspace_jira_configured(workspace):
            return Response(
                {"error": "Conecte o Jira e configure o destino antes de pré-visualizar."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        creds = get_workspace_credentials(workspace)
        if not creds:
            return Response(
                {"error": "Credenciais Jira indisponíveis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        board_slug = (request.data.get("board_slug") or creds.board_slug).strip() or creds.board_slug
        project_key = (request.data.get("project_key") or creds.project_key).strip() or creds.project_key
        creds = replace(creds, board_slug=board_slug, project_key=project_key)

        try:
            client = JiraOpsClient(creds)
            set_active_jira_cloud(client.cloud_id)
            epics = client.fetch_epics()
            issues = client.fetch_issues()
            preview = preview_jira_ops_import(
                workspace_slug=slug,
                board_slug=board_slug,
                epics=epics,
                issues_list=issues,
            )
            return Response(preview.to_dict(), status=status.HTTP_200_OK)
        except Exception as exc:
            return Response(
                {"error": str(exc)[:500]},
                status=status.HTTP_502_BAD_GATEWAY,
            )
