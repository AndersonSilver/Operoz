from rest_framework import serializers

from operoz.app.serializers.base import BaseSerializer
from operoz.db.models import BoardIntakeForm
from operoz.db.models.board_support_sla_policy import default_support_sla_policies
from operoz.utils.board_support_sla import normalize_policies
from operoz.utils.board_intake_submission import validate_board_intake_form_fields
from operoz.utils.intake_form_anchor import unique_board_intake_form_anchor


class BoardIntakeFormSerializer(BaseSerializer):
    public_url = serializers.SerializerMethodField()

    class Meta:
        model = BoardIntakeForm
        fields = [
            "id",
            "board",
            "name",
            "description",
            "header_title",
            "anchor",
            "is_published",
            "fields",
            "defaults",
            "submit_message",
            "require_auth",
            "theme",
            "form_scope",
            "public_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "board", "anchor", "public_url", "created_at", "updated_at"]

    def get_public_url(self, obj: BoardIntakeForm) -> str | None:
        request = self.context.get("request")
        if not obj.is_published:
            return None
        if request is None:
            return f"/forms/{obj.anchor}"
        return request.build_absolute_uri(f"/forms/{obj.anchor}")


class BoardIntakeFormWriteSerializer(BaseSerializer):
    class Meta:
        model = BoardIntakeForm
        fields = [
            "name",
            "description",
            "header_title",
            "is_published",
            "fields",
            "defaults",
            "submit_message",
            "require_auth",
            "theme",
            "form_scope",
        ]

    def validate_fields(self, value):
        fields = value or []
        form_scope = self.initial_data.get("form_scope") or (
            self.instance.form_scope if self.instance else "support"
        )
        if form_scope == "demand":
            routing_types = {"circle"}
        else:
            routing_types = {"client"}
        if not any(field.get("field_type") in routing_types for field in fields):
            label = "Círculo" if form_scope == "demand" else "Cliente"
            raise serializers.ValidationError(f"O campo {label} é obrigatório em formulários do board.")
        if not any(field.get("field_type") == "name" for field in fields):
            raise serializers.ValidationError("O campo Resumo é obrigatório.")
        return fields

    def validate(self, attrs):
        if attrs.get("is_published"):
            temp = BoardIntakeForm(fields=attrs.get("fields") or getattr(self.instance, "fields", []))
            try:
                validate_board_intake_form_fields(temp)
            except Exception as exc:
                raise serializers.ValidationError({"is_published": str(exc)}) from exc
        return attrs

    def create(self, validated_data):
        board = validated_data.get("board")
        name = validated_data.get("name", "")
        if board is not None:
            validated_data["anchor"] = unique_board_intake_form_anchor(board.id, name)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        name = validated_data.get("name")
        if name and name != instance.name and not instance.is_published:
            validated_data["anchor"] = unique_board_intake_form_anchor(
                instance.board_id,
                name,
                exclude_id=instance.id,
            )
        return super().update(instance, validated_data)


class BoardIntakeFormPublicSerializer(BaseSerializer):
    form_scope = serializers.SerializerMethodField()
    clients = serializers.SerializerMethodField()
    sla_policy = serializers.SerializerMethodField()

    class Meta:
        model = BoardIntakeForm
        fields = [
            "id",
            "name",
            "header_title",
            "description",
            "fields",
            "submit_message",
            "require_auth",
            "theme",
            "form_scope",
            "clients",
            "sla_policy",
        ]
        read_only_fields = fields

    def get_form_scope(self, _obj: BoardIntakeForm) -> str:
        return "board"

    def get_clients(self, obj: BoardIntakeForm):
        clients = self.context.get("clients")
        if clients is not None:
            return clients
        from operoz.utils.board_intake_submission import (
            board_intake_client_queryset,
            serialize_board_intake_clients,
        )

        return serialize_board_intake_clients(board_intake_client_queryset(obj.board_id))

    def get_sla_policy(self, obj: BoardIntakeForm):
        board = getattr(obj, "board", None)
        policy = getattr(board, "support_sla_policy", None) if board is not None else None
        if policy and policy.deleted_at is None:
            return normalize_policies(policy.policies)
        return normalize_policies(default_support_sla_policies())
