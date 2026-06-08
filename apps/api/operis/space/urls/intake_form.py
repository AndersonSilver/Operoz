from django.urls import path

from operis.space.views.intake_form import (
    IntakeFormPublicAssetEndpoint,
    IntakeFormPublicEndpoint,
    IntakeFormPublicSubmitEndpoint,
)

urlpatterns = [
    path(
        "intake-forms/<str:anchor>/",
        IntakeFormPublicEndpoint.as_view(),
        name="public-intake-form",
    ),
    path(
        "intake-forms/<str:anchor>/submit/",
        IntakeFormPublicSubmitEndpoint.as_view(),
        name="public-intake-form-submit",
    ),
    path(
        "intake-forms/<str:anchor>/assets/",
        IntakeFormPublicAssetEndpoint.as_view(),
        name="public-intake-form-asset",
    ),
    path(
        "intake-forms/<str:anchor>/assets/<uuid:pk>/",
        IntakeFormPublicAssetEndpoint.as_view(),
        name="public-intake-form-asset-detail",
    ),
]
