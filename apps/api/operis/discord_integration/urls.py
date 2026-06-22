from django.urls import path

from operis.discord_integration.views.interactions import DiscordInteractionsEndpoint

urlpatterns = [
    path("interactions/", DiscordInteractionsEndpoint.as_view(), name="discord-interactions"),
]
