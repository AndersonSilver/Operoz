from django.urls import path

from operoz.app.views.guest.prd_review import (
    PrdReviewGuestCommentEndpoint,
    PrdReviewGuestPublicEndpoint,
    PrdReviewGuestSubmitEndpoint,
)

urlpatterns = [
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
