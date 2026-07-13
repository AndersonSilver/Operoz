# Python imports
import uuid

# Django import
from django.http import HttpResponseRedirect
from django.views import View


# Module imports
from operoz.authentication.provider.oauth.google import GoogleOAuthProvider
from operoz.authentication.utils.login import user_login
from operoz.authentication.utils.redirection_path import get_redirection_path
from operoz.authentication.utils.user_auth_workflow import post_user_auth_workflow
from operoz.license.models import Instance
from operoz.authentication.utils.host import base_host
from operoz.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from operoz.utils.path_validator import get_safe_redirect_url


def _save_calendar_token_for_user(user, provider) -> None:
    """After Google login, persist the calendar token for all eligible workspaces."""
    refresh_token = provider.token_data.get("refresh_token")
    if not refresh_token:
        return
    try:
        from operoz.alerts.oauth.google_calendar import encrypt_tokens
        from operoz.db.models import WorkspaceMember
        from operoz.db.models.external_account import UserExternalAccount

        token_payload = {
            "access_token": provider.token_data.get("access_token", ""),
            "refresh_token": refresh_token,
            "expires_at": str(provider.token_data.get("access_token_expired_at", "")),
        }
        encrypted = encrypt_tokens(token_payload)
        external_id = provider.user_data.get("email", "")

        workspace_ids = list(
            WorkspaceMember.objects.filter(
                member=user,
                deleted_at__isnull=True,
                workspace__is_google_calendar_enabled=True,
                workspace__deleted_at__isnull=True,
            ).values_list("workspace_id", flat=True)
        )
        for workspace_id in workspace_ids:
            UserExternalAccount.objects.update_or_create(
                user=user,
                workspace_id=workspace_id,
                provider=UserExternalAccount.Provider.GOOGLE_CALENDAR,
                defaults={
                    "external_id": external_id,
                    "token_data": encrypted,
                    "is_active": True,
                    "deleted_at": None,
                },
            )
    except Exception:
        pass


class GoogleOauthInitiateEndpoint(View):
    def get(self, request):
        request.session["host"] = base_host(request=request, is_app=True)
        next_path = request.GET.get("next_path")
        if next_path:
            request.session["next_path"] = str(next_path)

        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True), next_path=next_path, params=params
            )
            return HttpResponseRedirect(url)

        try:
            state = uuid.uuid4().hex
            provider = GoogleOAuthProvider(request=request, state=state)
            request.session["state"] = state
            auth_url = provider.get_auth_url()
            return HttpResponseRedirect(auth_url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True), next_path=next_path, params=params
            )
            return HttpResponseRedirect(url)


class GoogleCallbackEndpoint(View):
    def get(self, request):
        code = request.GET.get("code")
        state = request.GET.get("state")
        next_path = request.session.get("next_path")

        if state != request.session.get("state", ""):
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["GOOGLE_OAUTH_PROVIDER_ERROR"],
                error_message="GOOGLE_OAUTH_PROVIDER_ERROR",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True), next_path=next_path, params=params
            )
            return HttpResponseRedirect(url)
        if not code:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["GOOGLE_OAUTH_PROVIDER_ERROR"],
                error_message="GOOGLE_OAUTH_PROVIDER_ERROR",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True), next_path=next_path, params=params
            )
            return HttpResponseRedirect(url)
        try:
            provider = GoogleOAuthProvider(request=request, code=code, callback=post_user_auth_workflow)
            user = provider.authenticate()
            # Login the user and record his device info
            user_login(request=request, user=user, is_app=True)
            # Auto-save calendar token for workspaces that have calendar integration enabled
            _save_calendar_token_for_user(user, provider)
            # Get the redirection path
            if next_path:
                path = next_path
            else:
                path = get_redirection_path(user=user)
            url = get_safe_redirect_url(base_url=base_host(request=request, is_app=True), next_path=path, params={})
            return HttpResponseRedirect(url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True), next_path=next_path, params=params
            )
            return HttpResponseRedirect(url)
