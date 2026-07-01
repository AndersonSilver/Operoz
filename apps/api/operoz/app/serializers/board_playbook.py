import re

from django.utils.text import slugify
from rest_framework import serializers

from operoz.db.models import BoardPlaybook


def _unique_slug(board_id, base: str, *, exclude_id=None) -> str:
    slug = slugify(base)[:120] or "playbook"
    candidate = slug
    index = 2
    while BoardPlaybook.objects.filter(board_id=board_id, slug=candidate, deleted_at__isnull=True).exclude(
        pk=exclude_id
    ).exists():
        candidate = f"{slug}-{index}"
        index += 1
    return candidate


class BoardPlaybookSerializer(serializers.ModelSerializer):
    has_unpublished_changes = serializers.SerializerMethodField()

    class Meta:
        model = BoardPlaybook
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "draft_markdown",
            "published_markdown",
            "published_version",
            "published_at",
            "is_active",
            "metadata",
            "sort_order",
            "has_unpublished_changes",
            "board",
            "workspace",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "published_markdown",
            "published_version",
            "published_at",
            "has_unpublished_changes",
            "board",
            "workspace",
            "created_at",
            "updated_at",
        ]

    def get_has_unpublished_changes(self, obj: BoardPlaybook) -> bool:
        return obj.has_unpublished_changes

    def validate_metadata(self, value):
        if value is None:
            return {}
        if not isinstance(value, dict):
            raise serializers.ValidationError("metadata deve ser um objeto JSON.")
        intents = value.get("intents")
        if intents is not None and not isinstance(intents, list):
            raise serializers.ValidationError("metadata.intents deve ser uma lista.")
        tags = value.get("tags")
        if tags is not None and not isinstance(tags, list):
            raise serializers.ValidationError("metadata.tags deve ser uma lista.")
        return value

    def create(self, validated_data):
        board = validated_data.pop("board")
        title = validated_data.get("title", "")
        slug = validated_data.get("slug") or _unique_slug(board.id, title)
        if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", slug):
            slug = _unique_slug(board.id, title)
        validated_data["slug"] = slug
        return BoardPlaybook.objects.create(board=board, workspace=board.workspace, **validated_data)

    def update(self, instance, validated_data):
        if "slug" in validated_data and not validated_data["slug"]:
            validated_data.pop("slug")
        if "slug" in validated_data:
            validated_data["slug"] = _unique_slug(
                instance.board_id,
                validated_data["slug"],
                exclude_id=instance.id,
            )
        return super().update(instance, validated_data)
