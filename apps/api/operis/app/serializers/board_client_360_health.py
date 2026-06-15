from rest_framework import serializers

from operis.db.models import BoardClient360HealthSettings
from operis.utils.client_360_health_settings import (
    default_health_settings_payload,
    validate_health_thresholds,
    validate_health_weights,
    validate_score_alert_threshold,
)


class HealthScoreWeightsSerializer(serializers.Serializer):
    report = serializers.IntegerField(min_value=0, max_value=100)
    overdue = serializers.IntegerField(min_value=0, max_value=100)
    support = serializers.IntegerField(min_value=0, max_value=100)

    def validate(self, attrs):
        err = validate_health_weights(attrs["report"], attrs["overdue"], attrs["support"])
        if err:
            raise serializers.ValidationError(err)
        return attrs


class HealthScoreThresholdsSerializer(serializers.Serializer):
    ok_min = serializers.IntegerField(min_value=0, max_value=100)
    warning_min = serializers.IntegerField(min_value=0, max_value=100)

    def validate(self, attrs):
        err = validate_health_thresholds(attrs["ok_min"], attrs["warning_min"])
        if err:
            raise serializers.ValidationError(err)
        return attrs


class BoardClient360HealthSettingsSerializer(serializers.ModelSerializer):
    is_custom = serializers.SerializerMethodField()
    weights = serializers.SerializerMethodField()
    thresholds = serializers.SerializerMethodField()

    class Meta:
        model = BoardClient360HealthSettings
        fields = [
            "id",
            "board",
            "workspace",
            "is_custom",
            "weights",
            "thresholds",
            "score_alert_threshold",
            "status_report_reminder_enabled",
            "status_report_reminder_email",
            "support_sla_days",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "board", "workspace", "created_at", "updated_at"]

    def get_is_custom(self, obj: BoardClient360HealthSettings) -> bool:
        return True

    def get_weights(self, obj: BoardClient360HealthSettings) -> dict:
        return {
            "report": obj.weight_report,
            "overdue": obj.weight_overdue,
            "support": obj.weight_support,
        }

    def get_thresholds(self, obj: BoardClient360HealthSettings) -> dict:
        return {
            "ok_min": obj.threshold_ok_min,
            "warning_min": obj.threshold_warning_min,
        }


class BoardClient360HealthSettingsUpdateSerializer(serializers.Serializer):
    weights = HealthScoreWeightsSerializer(required=False)
    thresholds = HealthScoreThresholdsSerializer(required=False)
    score_alert_threshold = serializers.IntegerField(min_value=0, max_value=100, required=False)
    status_report_reminder_enabled = serializers.BooleanField(required=False)
    status_report_reminder_email = serializers.BooleanField(required=False)
    support_sla_days = serializers.IntegerField(min_value=1, max_value=90, required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError(
                "At least one of weights, thresholds, score_alert_threshold, or reminder settings is required."
            )
        threshold = attrs.get("score_alert_threshold")
        if threshold is not None:
            err = validate_score_alert_threshold(threshold)
            if err:
                raise serializers.ValidationError({"score_alert_threshold": err})
        return attrs


def serialize_health_settings(row: BoardClient360HealthSettings | None) -> dict:
    if row is None:
        return default_health_settings_payload()
    data = BoardClient360HealthSettingsSerializer(row).data
    data["is_custom"] = True
    return data
