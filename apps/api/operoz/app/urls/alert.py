from django.urls import path

from operoz.app.views.alerts.external_accounts import UserExternalAccountDeleteView, UserExternalAccountView
from operoz.app.views.alerts.discord_oauth import (
    DiscordOAuthDisconnectView,
    DiscordOAuthCallbackView,
    DiscordOAuthStartView,
)
from operoz.app.views.alerts.google_calendar_oauth import (
    GoogleCalendarDisconnectView,
    GoogleCalendarOAuthCallbackView,
    GoogleCalendarOAuthStartView,
)
from operoz.app.views.alerts.logs import AlertLogViewSet, IssueAlertLogViewSet
from operoz.app.views.alerts.preferences import UserAlertPreferenceView
from operoz.app.views.alerts.rules import AlertRuleViewSet

urlpatterns = [
    path(
        "workspaces/<str:slug>/alert-rules/",
        AlertRuleViewSet.as_view({"get": "list", "post": "create"}),
        name="alert-rules",
    ),
    path(
        "workspaces/<str:slug>/alert-rules/<uuid:pk>/",
        AlertRuleViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="alert-rule-detail",
    ),
    path(
        "workspaces/<str:slug>/me/alert-preferences/",
        UserAlertPreferenceView.as_view(),
        name="user-alert-preferences",
    ),
    path(
        "workspaces/<str:slug>/me/external-accounts/",
        UserExternalAccountView.as_view(),
        name="user-external-accounts",
    ),
    path(
        "workspaces/<str:slug>/me/external-accounts/<str:provider>/",
        UserExternalAccountDeleteView.as_view(),
        name="user-external-account-delete",
    ),
    path(
        "workspaces/<str:slug>/alert-logs/",
        AlertLogViewSet.as_view({"get": "list"}),
        name="alert-logs",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:iid>/alert-logs/",
        IssueAlertLogViewSet.as_view({"get": "list"}),
        name="issue-alert-logs",
    ),
    path(
        "workspaces/<str:slug>/integrations/google-calendar/auth/start/",
        GoogleCalendarOAuthStartView.as_view(),
        name="google-calendar-oauth-start",
    ),
    path(
        "integrations/google-calendar/auth/callback/",
        GoogleCalendarOAuthCallbackView.as_view(),
        name="google-calendar-oauth-callback",
    ),
    path(
        "workspaces/<str:slug>/integrations/google-calendar/disconnect/",
        GoogleCalendarDisconnectView.as_view(),
        name="google-calendar-disconnect",
    ),
    path(
        "workspaces/<str:slug>/integrations/discord/auth/start/",
        DiscordOAuthStartView.as_view(),
        name="discord-oauth-start",
    ),
    path(
        "integrations/discord/auth/callback/",
        DiscordOAuthCallbackView.as_view(),
        name="discord-oauth-callback",
    ),
    path(
        "workspaces/<str:slug>/integrations/discord/disconnect/",
        DiscordOAuthDisconnectView.as_view(),
        name="discord-disconnect",
    ),
]
