from django.apps import AppConfig


class DbConfig(AppConfig):
    name = "operoz.db"

    def ready(self) -> None:
        import operoz.rag.signals  # noqa: F401
