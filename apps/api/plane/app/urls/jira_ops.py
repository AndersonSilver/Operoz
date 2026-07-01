# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

from django.urls import path

from plane.app.views import JiraOpsOAuthCallbackEndpoint

urlpatterns = [
    path(
        "jira-ops/oauth/callback/",
        JiraOpsOAuthCallbackEndpoint.as_view(),
        name="jira-ops-oauth-callback",
    ),
]
