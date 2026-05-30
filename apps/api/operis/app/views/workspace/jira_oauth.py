from django.conf import settings
from django.http import HttpResponseRedirect
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from operis.app.permissions import ROLE, allow_permission
from operis.app.views.base import BaseAPIView
from operis.db.models import Workspace
from operis.utils.jira_ops.oauth import (
    apply_token_response,
    build_authorize_url,
    create_oauth_state,
    exchange_code_for_tokens,
    fetch_accessible_resources,
    fetch_jira_myself,
    fetch_jira_projects,
    get_pending_clouds,
    pop_oauth_state,
    store_pending_clouds,
    workspace_oauth_app_ready,
)
from operis.utils.jira_ops.workspace_config import (
    config_to_api_dict,
    credentials_from_config,
    get_or_create_config,
    get_workspace_credentials,
    workspace_jira_configured,
)


def _settings_redirect(workspace_slug: str, **query) -> str:
    # Volta ao SPA (ex.: :3000), não à API Django (:8000).
    base = (settings.APP_BASE_URL or settings.WEB_URL or "http://localhost:3000").rstrip("/")
    path = f"{base}/{workspace_slug}/settings/jira"
    if query:
        params = "&".join(f"{k}={v}" for k, v in query.items() if v is not None)
        return f"{path}?{params}"
    return path


class WorkspaceJiraOpsOAuthStartEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        config = get_or_create_config(workspace)
        if not workspace_oauth_app_ready(config):
            return Response(
                {
                    "error": (
                        "Informe o Client ID e o Client Secret do app OAuth Atlassian "
                        "(Developer Console) e salve antes de conectar."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        state = create_oauth_state(slug, str(request.user.id))
        return Response({"authorize_url": build_authorize_url(state, config)}, status=status.HTTP_200_OK)


class JiraOpsOAuthCallbackEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def get(self, request):
        error = request.GET.get("error")
        state = request.GET.get("state")
        code = request.GET.get("code")

        if error or not state or not code:
            return HttpResponseRedirect(_settings_redirect("", jira_error=error or "missing_code"))

        payload = pop_oauth_state(state)
        if not payload:
            return HttpResponseRedirect(_settings_redirect("", jira_error="invalid_state"))

        workspace_slug = payload["workspace_slug"]
        try:
            workspace = Workspace.objects.get(slug=workspace_slug)
            config = get_or_create_config(workspace)
            tokens = exchange_code_for_tokens(code, config)
            access = tokens.get("access_token")
            if not access:
                raise ValueError("Token de acesso não retornado pelo Atlassian")

            resources = fetch_accessible_resources(access)

            if len(resources) == 1:
                resource = resources[0]
                apply_token_response(config, tokens)
                config.cloud_id = resource.get("id") or ""
                config.jira_site_name = resource.get("name") or ""
                try:
                    myself = fetch_jira_myself(access, config.cloud_id)
                    config.email = myself.get("emailAddress") or config.email
                except Exception:
                    pass
                config.save()
                return HttpResponseRedirect(_settings_redirect(workspace_slug, jira_connected="1"))

            store_pending_clouds(workspace_slug, resources, tokens)
            return HttpResponseRedirect(_settings_redirect(workspace_slug, jira_pick_cloud="1"))
        except Exception as exc:
            return HttpResponseRedirect(_settings_redirect(workspace_slug, jira_error=str(exc)[:200]))


class WorkspaceJiraOpsOAuthSitesEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        pending = get_pending_clouds(slug)
        if not pending:
            config = get_or_create_config(Workspace.objects.get(slug=slug))
            if config.cloud_id:
                return Response(
                    {
                        "sites": [
                            {
                                "id": config.cloud_id,
                                "name": config.jira_site_name or config.cloud_id,
                                "url": "",
                            }
                        ],
                        "pending": False,
                    }
                )
            return Response({"sites": [], "pending": False})
        sites = [
            {"id": r.get("id"), "name": r.get("name"), "url": r.get("url")}
            for r in pending.get("resources", [])
        ]
        return Response({"sites": sites, "pending": True})


class WorkspaceJiraOpsOAuthCompleteEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        config = get_or_create_config(workspace)
        cloud_id = (request.data.get("cloud_id") or "").strip()
        if not cloud_id:
            return Response({"error": "cloud_id é obrigatório"}, status=status.HTTP_400_BAD_REQUEST)

        pending = get_pending_clouds(slug)
        if pending:
            tokens = pending.get("tokens") or {}
            apply_token_response(config, tokens)
            for resource in pending.get("resources", []):
                if resource.get("id") == cloud_id:
                    config.jira_site_name = resource.get("name") or ""
                    break
            from operis.utils.jira_ops.oauth import pop_pending_clouds

            pop_pending_clouds(slug)

        config.cloud_id = cloud_id
        if request.data.get("project_key"):
            config.project_key = str(request.data["project_key"]).strip() or config.project_key
        if request.data.get("board_slug"):
            config.board_slug = str(request.data["board_slug"]).strip() or config.board_slug

        try:
            from operis.utils.jira_ops.oauth import ensure_fresh_oauth_token

            if config.oauth_access_token_encrypted:
                token = ensure_fresh_oauth_token(config)
                myself = fetch_jira_myself(token, cloud_id)
                config.email = myself.get("emailAddress") or config.email
        except Exception:
            pass

        config.save()

        creds = get_workspace_credentials(workspace)
        env_fallback = creds is not None and credentials_from_config(config) is None
        return Response(
            config_to_api_dict(config, configured=creds is not None, uses_env_fallback=env_fallback),
            status=status.HTTP_200_OK,
        )


class WorkspaceJiraOpsJiraProjectsEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        creds = get_workspace_credentials(workspace)
        if not creds or creds.auth_mode != "oauth":
            return Response(
                {"error": "Conecte-se ao Jira via OAuth antes de listar projetos."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        projects = fetch_jira_projects(creds.api_token, creds.cloud_id)
        items = [
            {"key": p.get("key"), "name": p.get("name"), "id": p.get("id")}
            for p in projects
            if p.get("key")
        ]
        items.sort(key=lambda x: (x.get("name") or "").lower())
        return Response({"projects": items})
