from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from operis.app.views.base import BaseAPIView
from operis.db.models import Client360QbrGuestLink
from operis.utils.client_360_qbr_export import qbr_to_html, qbr_to_markdown
from operis.utils.client_360_qbr_guest_link import (
    build_guest_portal_payload,
    build_guest_qbr_payload,
    log_guest_access,
    resolve_guest_link,
)
from operis.utils.client_360_enterprise import load_enterprise_settings


class Client360QbrGuestPublicEndpoint(BaseAPIView):
    """Read-only QBR view for tokenized guest links (no auth)."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, token):
        link, error_payload, error_status = resolve_guest_link(token)
        if not link:
            return Response(error_payload, status=error_status)

        log_guest_access(link, request)
        payload = build_guest_qbr_payload(link)
        enterprise = load_enterprise_settings(link.workspace_id)
        return Response(
            {
                "title": payload.get("title"),
                "workspace_name": payload.get("workspace_name"),
                "scope": payload.get("scope"),
                "period_start": payload.get("period_start"),
                "period_end": payload.get("period_end"),
                "expires_at": link.expires_at.isoformat(),
                "markdown": qbr_to_markdown(payload),
                "html": qbr_to_html(payload),
                "summary": payload.get("summary"),
                "wins": payload.get("wins"),
                "risks": payload.get("risks"),
                "chart_warnings": payload.get("chart_warnings"),
                "auth": {
                    "sso_enabled": enterprise.get("guest_sso_enabled", False),
                    "magic_link_fallback": enterprise.get("guest_magic_link_fallback", True),
                    "sso_provider": (enterprise.get("guest_sso_config") or {}).get("provider"),
                },
            },
            status=status.HTTP_200_OK,
        )


class Client360GuestPortalClientsEndpoint(BaseAPIView):
    """Read-only multi-client list for portfolio guest links."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, token):
        link, error_payload, error_status = resolve_guest_link(token)
        if not link:
            return Response(error_payload, status=error_status)
        if link.scope == Client360QbrGuestLink.SCOPE_CLIENT:
            return Response({"error": "Single-client links use the QBR endpoint"}, status=status.HTTP_400_BAD_REQUEST)
        log_guest_access(link, request)
        return Response(build_guest_portal_payload(link), status=status.HTTP_200_OK)
