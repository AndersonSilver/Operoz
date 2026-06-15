from rest_framework import serializers


class WorkspaceClient360DisplaySettingsUpdateSerializer(serializers.Serializer):
    health_score_display_enabled = serializers.BooleanField()
