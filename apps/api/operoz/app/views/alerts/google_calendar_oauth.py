from __future__ import annotations

from django.http import HttpResponseRedirect
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from operoz.alerts.oauth.google_calendar import (
    build_authorize_url,
    create_oauth_state,
    encrypt_tokens,
    exchange_code_for_tokens,
    oauth_configured,
    pop_oauth_state,
    token_expires_at,
    workspace_slug_from_state,
)
from operoz.app.permissions import ROLE, allow_permission
from operoz.app.views.base import BaseAPIView
from operoz.db.models import UserExternalAccount, Workspace
from operoz.db.models.external_account import UserExternalAccount as ExternalAccountModel
from operoz.utils.host import frontend_base_url


class GoogleCalendarOAuthStartView(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        if not oauth_configured():
            return Response(
                {"error": "Google Calendar OAuth is not configured on this instance"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        state = create_oauth_state(workspace_slug=slug, user_id=str(request.user.id))
        return Response({"redirect_url": build_authorize_url(state=state)}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class GoogleCalendarOAuthCallbackView(BaseAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        code = request.GET.get("code")
        state = request.GET.get("state", "")
        error = request.GET.get("error")

        workspace_slug = workspace_slug_from_state(state)
        base = frontend_base_url()
        fail_url = f"{base}/{workspace_slug}/settings/notifications/external-accounts/?gcal=error"

        if error or not code or not state:
            return HttpResponseRedirect(fail_url)

        payload = pop_oauth_state(state)
        if not payload:
            return HttpResponseRedirect(fail_url)

        workspace_slug = payload.get("workspace_slug") or workspace_slug
        user_id = payload.get("user_id")
        workspace = Workspace.objects.filter(slug=workspace_slug).first()
        if not workspace or not user_id:
            return HttpResponseRedirect(fail_url)

        try:
            tokens = exchange_code_for_tokens(code)
        except Exception:
            return HttpResponseRedirect(fail_url)

        from operoz.db.models import User

        user = User.objects.filter(pk=user_id).first()
        if not user:
            return HttpResponseRedirect(fail_url)

        external_id = tokens.get("email") or user.email
        account, _ = UserExternalAccount.objects.update_or_create(
            user_id=user.id,
            workspace_id=workspace.id,
            provider=ExternalAccountModel.Provider.GOOGLE_CALENDAR,
            defaults={
                "external_id": external_id,
                "token_data": encrypt_tokens(tokens),
                "is_active": True,
                "metadata": {
                    "calendar_id": "primary",
                    "expires_at": token_expires_at(tokens).isoformat(),
                    "auto_create_events": True,
                },
                "deleted_at": None,
            },
        )
        account.last_synced_at = None
        account.save(update_fields=["last_synced_at", "updated_at"])

        success_url = f"{base}/{workspace_slug}/settings/notifications/external-accounts/?gcal=connected"
        return HttpResponseRedirect(success_url)


class GoogleCalendarDisconnectView(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        account = UserExternalAccount.objects.filter(
            user_id=request.user.id,
            workspace_id=workspace.id,
            provider=ExternalAccountModel.Provider.GOOGLE_CALENDAR,
            deleted_at__isnull=True,
        ).first()
        if account:
            account.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
