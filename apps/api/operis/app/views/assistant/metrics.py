from __future__ import annotations

from django.conf import settings
from django.http import HttpResponse
from rest_framework import status
from rest_framework.response import Response

from operis.app.views.base import BaseAPIView
from operis.assistant.observability import collect_assistant_metrics, render_prometheus_metrics


def _metrics_token() -> str:
    return (getattr(settings, "ASSISTANT_METRICS_TOKEN", None) or "").strip()


class AssistantOpsMetricsEndpoint(BaseAPIView):
    """Prometheus text exposition for assistant scale metrics (token-protected)."""

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        token = _metrics_token()
        if not token:
            return Response({"error": "metrics_disabled"}, status=status.HTTP_404_NOT_FOUND)

        provided = (request.headers.get("Authorization") or "").removeprefix("Bearer ").strip()
        if provided != token:
            provided = (request.headers.get("X-Metrics-Token") or "").strip()
        if provided != token:
            return Response({"error": "unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        accept = (request.headers.get("Accept") or "").lower()
        if "application/json" in accept:
            return Response(collect_assistant_metrics())

        return HttpResponse(
            render_prometheus_metrics(),
            content_type="text/plain; version=0.0.4; charset=utf-8",
        )
