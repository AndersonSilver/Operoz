from django.urls import path

from operoz.api.views import WorkspaceSemanticSearchAPIEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/search/semantic/",
        WorkspaceSemanticSearchAPIEndpoint.as_view(http_method_names=["post"]),
        name="workspace-semantic-search",
    ),
]
