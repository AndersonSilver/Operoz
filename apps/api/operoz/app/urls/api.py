from django.urls import path
from operoz.app.views import (
    ApiTokenEndpoint,
    McpConnectorAuthorizeEndpoint,
    McpConnectorDenyEndpoint,
)

urlpatterns = [
    # API Tokens
    path(
        "users/api-tokens/",
        ApiTokenEndpoint.as_view(),
        name="api-tokens",
    ),
    path(
        "users/api-tokens/<uuid:pk>/",
        ApiTokenEndpoint.as_view(),
        name="api-tokens-details",
    ),
    ## End API Tokens
    # Conectores MCP (OAuth 2.1 do operoz-mcp)
    path(
        "users/mcp-connectors/authorize/",
        McpConnectorAuthorizeEndpoint.as_view(),
        name="mcp-connector-authorize",
    ),
    path(
        "users/mcp-connectors/deny/",
        McpConnectorDenyEndpoint.as_view(),
        name="mcp-connector-deny",
    ),
    ## End Conectores MCP
]
