"""Operoz URL Configuration"""

from django.conf import settings
from django.urls import include, path, re_path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

handler404 = "operoz.app.views.error_404.custom_404_view"

urlpatterns = [
    path("api/", include("operoz.app.urls")),
    path("api/discord/", include("operoz.discord_integration.urls")),
    path("api/public/", include("operoz.space.urls")),
    path("api/instances/", include("operoz.license.urls")),
    path("api/v1/", include("operoz.api.urls")),
    path("auth/", include("operoz.authentication.urls")),
    path("", include("operoz.web.urls")),
]

if settings.ENABLE_DRF_SPECTACULAR:
    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path(
            "api/schema/swagger-ui/",
            SpectacularSwaggerView.as_view(url_name="schema"),
            name="swagger-ui",
        ),
        path(
            "api/schema/redoc/",
            SpectacularRedocView.as_view(url_name="schema"),
            name="redoc",
        ),
    ]

if settings.DEBUG:
    try:
        import debug_toolbar

        urlpatterns = [re_path(r"^__debug__/", include(debug_toolbar.urls))] + urlpatterns
    except ImportError:
        pass
