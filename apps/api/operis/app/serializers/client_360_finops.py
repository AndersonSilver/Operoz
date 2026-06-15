from rest_framework import serializers

from operis.db.models import (
    Client360ConsultantAllocation,
    Client360ProjectFinopsProfile,
    WorkspaceClient360FinopsSettings,
)


class WorkspaceClient360FinopsSettingsSerializer(serializers.ModelSerializer):
    is_custom = serializers.SerializerMethodField()

    class Meta:
        model = WorkspaceClient360FinopsSettings
        fields = [
            "variance_alert_pct",
            "margin_alert_pct",
            "squad_weekly_capacity_hours",
            "is_custom",
        ]
        read_only_fields = ["is_custom"]

    def get_is_custom(self, obj) -> bool:
        return True


class WorkspaceClient360FinopsSettingsWriteSerializer(serializers.Serializer):
    variance_alert_pct = serializers.IntegerField(min_value=1, max_value=100, required=False)
    margin_alert_pct = serializers.IntegerField(min_value=0, max_value=100, required=False)
    squad_weekly_capacity_hours = serializers.IntegerField(min_value=1, max_value=168, required=False)


class Client360ProjectFinopsProfileWriteSerializer(serializers.Serializer):
    hours_allocated = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    capacity_hours = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    harness_project_tag = serializers.CharField(max_length=120, required=False, allow_blank=True)
    harness_cost_mtd = serializers.DecimalField(max_digits=14, decimal_places=2, required=False, allow_null=True)
    budget_planned = serializers.DecimalField(max_digits=14, decimal_places=2, required=False, allow_null=True)
    budget_actual = serializers.DecimalField(max_digits=14, decimal_places=2, required=False, allow_null=True)
    revenue_contract = serializers.DecimalField(max_digits=14, decimal_places=2, required=False, allow_null=True)


def serialize_finops_profile(row: Client360ProjectFinopsProfile) -> dict:
    return {
        "project_id": str(row.project_id),
        "period_month": row.period_month.isoformat(),
        "hours_allocated": float(row.hours_allocated),
        "capacity_hours": float(row.capacity_hours),
        "harness_cost_mtd": float(row.harness_cost_mtd) if row.harness_cost_mtd is not None else None,
        "harness_project_tag": row.harness_project_tag,
        "harness_last_sync_at": row.harness_last_sync_at.isoformat() if row.harness_last_sync_at else None,
        "budget_planned": float(row.budget_planned) if row.budget_planned is not None else None,
        "budget_actual": float(row.budget_actual) if row.budget_actual is not None else None,
        "revenue_contract": float(row.revenue_contract) if row.revenue_contract is not None else None,
    }
