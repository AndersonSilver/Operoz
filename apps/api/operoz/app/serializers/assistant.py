from rest_framework import serializers

from operoz.db.models import AssistantChatJob, AssistantMessage, AssistantQualityReview, AssistantSession


class AssistantSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssistantSession
        fields = ["id", "title", "context", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class AssistantSessionUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    context = serializers.JSONField(required=False)


class AssistantMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssistantMessage
        fields = [
            "id",
            "role",
            "content",
            "tool_calls",
            "tool_call_id",
            "citations",
            "metadata",
            "created_at",
        ]
        read_only_fields = fields


class AssistantChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=16000)
    stream = serializers.BooleanField(required=False, default=False)
    async_mode = serializers.BooleanField(required=False, default=False)
    sync = serializers.BooleanField(required=False, default=False)
    client_message_id = serializers.CharField(required=False, allow_blank=True, max_length=128)


class AssistantChatJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssistantChatJob
        fields = [
            "id",
            "status",
            "client_message_id",
            "error_code",
            "error_message",
            "queue_position",
            "estimated_wait_seconds",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class AssistantSessionCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    context = serializers.JSONField(required=False, default=dict)


class AssistantMessageFeedbackSerializer(serializers.Serializer):
    rating = serializers.ChoiceField(choices=["up", "down", "clear"])


class AssistantQualityReviewSerializer(serializers.Serializer):
    verdict = serializers.ChoiceField(choices=["ok", "hallucination", "incomplete", "unsafe"])
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    message_id = serializers.UUIDField(required=False, allow_null=True)


class AssistantQualityReviewReadSerializer(serializers.ModelSerializer):
    reviewer_email = serializers.EmailField(source="reviewer.email", read_only=True)

    class Meta:
        model = AssistantQualityReview
        fields = ["id", "verdict", "notes", "message_id", "reviewer_email", "created_at"]
        read_only_fields = fields
