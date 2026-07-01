from django.apps import AppConfig


class DiscordIntegrationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "operoz.discord_integration"
    verbose_name = "Discord Integration"

    def ready(self) -> None:
        import operoz.discord_integration.signals  # noqa: F401
