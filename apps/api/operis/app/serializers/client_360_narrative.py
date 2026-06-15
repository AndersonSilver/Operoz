from rest_framework import serializers


class Client360NarrativeUpdateSerializer(serializers.Serializer):
    wins_md = serializers.CharField(required=False, allow_blank=True, max_length=10000)
    risks_md = serializers.CharField(required=False, allow_blank=True, max_length=10000)
    next_steps_md = serializers.CharField(required=False, allow_blank=True, max_length=10000)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("At least one narrative field is required.")
        return attrs
