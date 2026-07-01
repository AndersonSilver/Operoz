from rest_framework import serializers

from operoz.db.models import WorkspaceClient360ScenarioPlaybook


class Client360QbrDraftWriteSerializer(serializers.Serializer):
    human_edited_md = serializers.CharField(required=False, allow_blank=True)
    regenerate = serializers.BooleanField(required=False, default=False)


class Client360SuggestedActionDismissSerializer(serializers.Serializer):
    action_key = serializers.CharField(max_length=64)


class Client360SuggestedActionFeedbackSerializer(serializers.Serializer):
    action_key = serializers.CharField(max_length=64)
    helpful = serializers.BooleanField()


class WorkspaceClient360ScenarioPlaybookWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkspaceClient360ScenarioPlaybook
        fields = (
            "scenario_key",
            "playbook_code",
            "title",
            "markdown",
            "locale",
            "is_active",
        )

    def update(self, instance, validated_data):
        if any(key in validated_data for key in ("title", "markdown", "scenario_key")):
            instance.version = (instance.version or 1) + 1
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance
