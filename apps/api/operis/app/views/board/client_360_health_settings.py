from rest_framework import status
from rest_framework.response import Response

from operis.app.permissions.board_access import allow_workspace_or_board_admin
from operis.app.serializers.board_client_360_health import (
    BoardClient360HealthSettingsUpdateSerializer,
    serialize_health_settings,
)
from operis.app.views.base import BaseAPIView
from operis.app.views.board.automation import _get_board
from operis.db.models import BoardClient360HealthSettings
from operis.utils.client_360_health_settings import (
    validate_health_thresholds,
    validate_health_weights,
)
from operis.utils.client_360_health_simulation import log_board_health_settings_change


class BoardClient360HealthSettingsEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        row = BoardClient360HealthSettings.objects.filter(
            board=board,
            deleted_at__isnull=True,
        ).first()
        return Response(serialize_health_settings(row), status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def patch(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        serializer = BoardClient360HealthSettingsUpdateSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        row = BoardClient360HealthSettings.objects.filter(
            board=board,
            deleted_at__isnull=True,
        ).first()
        previous_weights = None
        if row is not None:
            previous_weights = {
                "report": row.weight_report,
                "overdue": row.weight_overdue,
                "support": row.weight_support,
            }
        if row is None:
            row = BoardClient360HealthSettings(
                board=board,
                workspace=board.workspace,
            )

        weights = serializer.validated_data.get("weights")
        if weights:
            row.weight_report = weights["report"]
            row.weight_overdue = weights["overdue"]
            row.weight_support = weights["support"]

        thresholds = serializer.validated_data.get("thresholds")
        if thresholds:
            row.threshold_ok_min = thresholds["ok_min"]
            row.threshold_warning_min = thresholds["warning_min"]

        if "score_alert_threshold" in serializer.validated_data:
            row.score_alert_threshold = serializer.validated_data["score_alert_threshold"]

        if "status_report_reminder_enabled" in serializer.validated_data:
            row.status_report_reminder_enabled = serializer.validated_data["status_report_reminder_enabled"]
        if "status_report_reminder_email" in serializer.validated_data:
            row.status_report_reminder_email = serializer.validated_data["status_report_reminder_email"]
        if "support_sla_days" in serializer.validated_data:
            row.support_sla_days = serializer.validated_data["support_sla_days"]

        combined_err = validate_health_weights(
            row.weight_report,
            row.weight_overdue,
            row.weight_support,
        )
        if combined_err is None:
            combined_err = validate_health_thresholds(
                row.threshold_ok_min,
                row.threshold_warning_min,
            )
        if combined_err:
            return Response({"error": combined_err}, status=status.HTTP_400_BAD_REQUEST)

        row.save(updated_by=request.user)
        if weights:
            log_board_health_settings_change(
                board=board,
                actor=request.user,
                previous_weights=previous_weights,
                new_weights={
                    "report": row.weight_report,
                    "overdue": row.weight_overdue,
                    "support": row.weight_support,
                },
            )
        return Response(serialize_health_settings(row), status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def delete(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        BoardClient360HealthSettings.objects.filter(board=board, deleted_at__isnull=True).delete()
        return Response(serialize_health_settings(None), status=status.HTTP_200_OK)
