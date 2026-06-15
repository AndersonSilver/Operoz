from django.urls import path

from operis.app.views.guest.client_360_qbr import (
    Client360GuestPortalClientsEndpoint,
    Client360QbrGuestPublicEndpoint,
)
from operis.app.views.guest.prd_review import (
    PrdReviewGuestCommentEndpoint,
    PrdReviewGuestPublicEndpoint,
    PrdReviewGuestSubmitEndpoint,
)

urlpatterns = [
    path(
        "guest/client-360/qbr/<str:token>/",
        Client360QbrGuestPublicEndpoint.as_view(),
        name="guest-client-360-qbr",
    ),
    path(
        "guest/client-360/portal/<str:token>/clients/",
        Client360GuestPortalClientsEndpoint.as_view(),
        name="guest-client-360-portal-clients",
    ),
    path(
        "guest/prd-review/<str:token>/",
        PrdReviewGuestPublicEndpoint.as_view(),
        name="guest-prd-review",
    ),
    path(
        "guest/prd-review/<str:token>/comments/",
        PrdReviewGuestCommentEndpoint.as_view(),
        name="guest-prd-review-comments",
    ),
    path(
        "guest/prd-review/<str:token>/submit/",
        PrdReviewGuestSubmitEndpoint.as_view(),
        name="guest-prd-review-submit",
    ),
]
