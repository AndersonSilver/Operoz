from django.apps import AppConfig


class DbConfig(AppConfig):
    name = "operis.db"

    def ready(self) -> None:
        import operis.assistant.signals  # noqa: F401
