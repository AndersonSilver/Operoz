from django.apps import AppConfig


class ApiConfig(AppConfig):
    name = "operis.api"

    def ready(self):
        # Import authentication extensions to register them with drf-spectacular
        try:
            import operis.utils.openapi.auth  # noqa
        except ImportError:
            pass
