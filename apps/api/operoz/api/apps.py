from django.apps import AppConfig


class ApiConfig(AppConfig):
    name = "operoz.api"

    def ready(self):
        # Import authentication extensions to register them with drf-spectacular
        try:
            import operoz.utils.openapi.auth  # noqa
        except ImportError:
            pass
