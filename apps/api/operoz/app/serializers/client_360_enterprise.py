from rest_framework import serializers

from operoz.db.models import (
    Client360Customer,
    Client360WebhookSubscription,
    WorkspaceClient360EnterpriseSettings,
)


class Client360CustomerWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client360Customer
        fields = ("name", "external_crm_id", "segment", "account_owner", "revenue_contract")


class Client360CustomerAssignSerializer(serializers.Serializer):
    customer_id = serializers.UUIDField(required=False, allow_null=True)


class WorkspaceClient360EnterpriseSettingsWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkspaceClient360EnterpriseSettings
        fields = (
            "phase_flags",
            "list_grouping_mode",
            "crm_enabled",
            "crm_provider",
            "crm_config",
            "crm_push_enabled",
            "retention_weeks",
            "data_region",
            "bi_export_enabled",
            "guest_sso_enabled",
            "guest_sso_config",
            "guest_magic_link_fallback",
        )


class Client360WebhookSubscriptionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client360WebhookSubscription
        fields = ("url", "event_types", "is_active")
