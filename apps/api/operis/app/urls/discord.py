from django.urls import path

from operis.discord_integration.views.commands import (
    WorkspaceDiscordSlashCommandDetailEndpoint,
    WorkspaceDiscordSlashCommandsEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/discord/slash-commands/",
        WorkspaceDiscordSlashCommandsEndpoint.as_view(),
        name="workspace-discord-slash-commands",
    ),
    path(
        "workspaces/<str:slug>/discord/slash-commands/<uuid:pk>/",
        WorkspaceDiscordSlashCommandDetailEndpoint.as_view(),
        name="workspace-discord-slash-command-detail",
    ),
]
