from django.apps import AppConfig


class DbConfig(AppConfig):
    name = "operoz.db"

    def ready(self) -> None:
        import operoz.assistant.signals  # noqa: F401
