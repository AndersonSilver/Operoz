from django.urls import path, include
from rest_framework.routers import DefaultRouter

from operoz.api.views import StickyViewSet


router = DefaultRouter()
router.register(r"stickies", StickyViewSet, basename="workspace-stickies")

urlpatterns = [
    path("workspaces/<str:slug>/", include(router.urls)),
]
