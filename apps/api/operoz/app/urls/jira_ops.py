from django.urls import path

from operoz.app.views import JiraOpsOAuthCallbackEndpoint

urlpatterns = [
    path(
        "jira-ops/oauth/callback/",
        JiraOpsOAuthCallbackEndpoint.as_view(),
        name="jira-ops-oauth-callback",
    ),
]
