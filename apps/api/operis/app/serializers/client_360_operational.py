from rest_framework import serializers

from operis.db.models import BoardClient360IntakeType, Client360WorkspaceSharedView


class BoardClient360IntakeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardClient360IntakeType
        fields = [
            "id",
            "board",
            "workspace",
            "name",
            "slug",
            "type_name_pattern",
            "is_active",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "board", "workspace", "created_at", "updated_at"]


class BoardClient360IntakeTypeWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    slug = serializers.SlugField(max_length=80, required=False, allow_blank=True, default="")
    type_name_pattern = serializers.CharField(max_length=120, required=False, allow_blank=True, default="")
    is_active = serializers.BooleanField(required=False, default=True)
    sort_order = serializers.IntegerField(required=False, min_value=0, max_value=32767, default=0)

    def validate(self, attrs):
        from django.utils.text import slugify

        slug = (attrs.get("slug") or "").strip()
        if not slug:
            slug = slugify(attrs["name"])[:80] or "intake"
        attrs["slug"] = slug
        return attrs


class Client360SharedViewSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Client360WorkspaceSharedView
        fields = [
            "id",
            "workspace",
            "name",
            "payload",
            "is_shared",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace", "created_by", "created_by_name", "created_at", "updated_at"]

    def get_created_by_name(self, obj) -> str | None:
        if obj.created_by_id and obj.created_by:
            return obj.created_by.display_name
        return None


class Client360SharedViewWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=48)
    payload = serializers.DictField()
    is_shared = serializers.BooleanField(required=False, default=True)
