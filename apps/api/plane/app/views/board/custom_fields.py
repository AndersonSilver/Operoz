# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.permissions.board_access import allow_workspace_or_board_admin
from plane.app.serializers import (
    BoardCustomFieldBulkAddSerializer,
    BoardCustomFieldCreateSerializer,
    BoardCustomFieldSerializer,
    BoardStandardFieldSerializer,
    BoardStandardFieldUpdateSerializer,
    WorkspaceCustomFieldSerializer,
)
from plane.app.views.base import BaseAPIView
from plane.db.models import (
    Board,
    BoardCustomField,
    BoardStandardField,
    CustomFieldType,
    Workspace,
    WorkspaceCustomField,
)
from plane.utils.board_custom_fields import (
    delete_workspace_custom_field,
    slugify_field_key,
    sync_board_custom_fields_to_all_board_projects,
    sync_board_custom_fields_to_project,
    unique_field_key,
)
from plane.utils.board_standard_fields import ensure_board_standard_fields


class WorkspaceCustomFieldEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        fields = WorkspaceCustomField.objects.filter(
            workspace__slug=slug, deleted_at__isnull=True, is_active=True
        ).order_by("name")
        return Response(WorkspaceCustomFieldSerializer(fields, many=True).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = WorkspaceCustomFieldSerializer(
            data=request.data, context={"workspace_id": workspace.id}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        name = data["name"].strip()
        field_type = data["field_type"]
        settings = data.get("settings") or {}

        existing = WorkspaceCustomField.objects.filter(
            workspace=workspace, name=name, deleted_at__isnull=True
        ).first()

        if existing:
            if existing.field_type != field_type:
                return Response(
                    {"name": "FIELD_NAME_ALREADY_EXISTS", "field_type": "FIELD_TYPE_MISMATCH"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            update_fields = []
            if data.get("description") is not None and existing.description != data.get("description", ""):
                existing.description = data.get("description", "")
                update_fields.append("description")
            if field_type in CustomFieldType.option_field_types() and settings.get("options"):
                existing.settings = settings
                update_fields.append("settings")
            if update_fields:
                existing.save(update_fields=[*update_fields, "updated_at"])
            return Response(
                WorkspaceCustomFieldSerializer(existing).data,
                status=status.HTTP_200_OK,
            )

        deleted_match = (
            WorkspaceCustomField.objects.filter(workspace=workspace, name=name)
            .exclude(deleted_at__isnull=True)
            .order_by("-created_at")
            .first()
        )
        if deleted_match:
            deleted_match.deleted_at = None
            deleted_match.is_active = True
            deleted_match.field_type = field_type
            deleted_match.description = data.get("description", "")
            deleted_match.settings = settings
            deleted_match.save(
                update_fields=[
                    "deleted_at",
                    "is_active",
                    "field_type",
                    "description",
                    "settings",
                    "updated_at",
                ]
            )
            return Response(
                WorkspaceCustomFieldSerializer(deleted_match).data,
                status=status.HTTP_200_OK,
            )

        field = serializer.save(workspace=workspace, created_by=request.user)
        return Response(WorkspaceCustomFieldSerializer(field).data, status=status.HTTP_201_CREATED)


class WorkspaceCustomFieldDetailEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def patch(self, request, slug, pk):
        field = WorkspaceCustomField.objects.get(
            workspace__slug=slug, pk=pk, deleted_at__isnull=True
        )
        serializer = WorkspaceCustomFieldSerializer(
            field, data=request.data, partial=True, context={"workspace_id": field.workspace_id}
        )
        if serializer.is_valid():
            serializer.save()
            from plane.db.models import Project

            board_ids = (
                BoardCustomField.objects.filter(
                    custom_field_id=field.pk,
                    is_enabled=True,
                    deleted_at__isnull=True,
                    board__workspace__slug=slug,
                    board__deleted_at__isnull=True,
                )
                .values_list("board_id", flat=True)
                .distinct()
            )
            for project in Project.objects.filter(
                board_id__in=board_ids,
                archived_at__isnull=True,
                deleted_at__isnull=True,
            ):
                sync_board_custom_fields_to_project(project, request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_workspace_or_board_admin
    def delete(self, request, slug, pk):
        field = WorkspaceCustomField.objects.get(
            workspace__slug=slug, pk=pk, deleted_at__isnull=True
        )
        delete_workspace_custom_field(field, request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class BoardCustomFieldEndpoint(BaseAPIView):
    def _get_board(self, slug: str, board_slug: str):
        return Board.objects.get(workspace__slug=slug, slug=board_slug, deleted_at__isnull=True)

    def _queryset(self, board):
        return (
            BoardCustomField.objects.filter(board=board, deleted_at__isnull=True)
            .select_related("custom_field")
            .order_by("sort_order", "custom_field__name")
        )

    def _standard_queryset(self, board):
        return BoardStandardField.objects.filter(board=board, deleted_at__isnull=True).order_by(
            "sort_order", "field_key"
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, board_slug):
        board = self._get_board(slug, board_slug)
        ensure_board_standard_fields(board, request.user)
        standard = BoardStandardFieldSerializer(self._standard_queryset(board), many=True).data
        custom = BoardCustomFieldSerializer(self._queryset(board), many=True).data
        combined = sorted([*standard, *custom], key=lambda row: (row.get("sort_order") or 0, row.get("name") or ""))
        return Response(combined, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug):
        board = self._get_board(slug, board_slug)
        serializer = BoardCustomFieldCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        workspace_id = board.workspace_id

        if data.get("custom_field_id"):
            custom_field = WorkspaceCustomField.objects.get(
                pk=data["custom_field_id"], workspace_id=workspace_id, deleted_at__isnull=True
            )
        else:
            if not data.get("name") or not data.get("field_type"):
                return Response(
                    {"error": "NAME_AND_FIELD_TYPE_REQUIRED"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            name = data["name"].strip()
            field_type = data["field_type"]
            settings = data.get("settings") or {}

            existing_field = WorkspaceCustomField.objects.filter(
                workspace_id=workspace_id, name=name, deleted_at__isnull=True
            ).first()

            if existing_field:
                if existing_field.field_type != field_type:
                    return Response(
                        {"name": "FIELD_NAME_ALREADY_EXISTS", "field_type": "FIELD_TYPE_MISMATCH"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                custom_field = existing_field
                update_fields = []
                if data.get("description") is not None and existing_field.description != data.get(
                    "description", ""
                ):
                    existing_field.description = data.get("description", "")
                    update_fields.append("description")
                if field_type in CustomFieldType.option_field_types() and settings.get("options"):
                    existing_field.settings = settings
                    update_fields.append("settings")
                if update_fields:
                    existing_field.save(update_fields=[*update_fields, "updated_at"])
            else:
                base_key = slugify_field_key(name)
                custom_field = WorkspaceCustomField.objects.create(
                    workspace_id=workspace_id,
                    name=name,
                    key=unique_field_key(workspace_id, base_key),
                    description=data.get("description", ""),
                    field_type=field_type,
                    settings=settings,
                    created_by=request.user,
                )

        board_link = (
            BoardCustomField.objects.filter(board=board, custom_field=custom_field)
            .order_by("-created_at")
            .first()
        )

        if board_link:
            if board_link.deleted_at is not None:
                board_link.deleted_at = None
                board_link.is_enabled = True
                board_link.save(update_fields=["deleted_at", "is_enabled", "updated_at"])
                sync_board_custom_fields_to_all_board_projects(board, request.user)
                return Response(
                    BoardCustomFieldSerializer(board_link).data,
                    status=status.HTTP_200_OK,
                )
            if not board_link.is_enabled:
                board_link.is_enabled = True
                board_link.save(update_fields=["is_enabled", "updated_at"])
                sync_board_custom_fields_to_all_board_projects(board, request.user)
                return Response(
                    BoardCustomFieldSerializer(board_link).data,
                    status=status.HTTP_200_OK,
                )
            return Response({"error": "FIELD_ALREADY_ON_BOARD"}, status=status.HTTP_400_BAD_REQUEST)

        max_order = (
            BoardCustomField.objects.filter(board=board, deleted_at__isnull=True)
            .order_by("-sort_order")
            .values_list("sort_order", flat=True)
            .first()
        )
        sort_order = data.get("sort_order")
        if sort_order is None:
            sort_order = (max_order or 0) + 1000

        board_field = BoardCustomField.objects.create(
            board=board,
            workspace_id=workspace_id,
            custom_field=custom_field,
            sort_order=sort_order,
            is_enabled=data.get("is_enabled", True),
            created_by=request.user,
        )
        sync_board_custom_fields_to_all_board_projects(board, request.user)
        return Response(
            BoardCustomFieldSerializer(board_field).data,
            status=status.HTTP_201_CREATED,
        )


class BoardCustomFieldBulkAddEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug):
        board = Board.objects.get(workspace__slug=slug, slug=board_slug, deleted_at__isnull=True)
        serializer = BoardCustomFieldBulkAddSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        workspace_id = board.workspace_id
        max_order = (
            BoardCustomField.objects.filter(board=board, deleted_at__isnull=True)
            .order_by("-sort_order")
            .values_list("sort_order", flat=True)
            .first()
        )
        order = max_order or 0
        created = []

        for field_id in serializer.validated_data["custom_field_ids"]:
            existing_link = (
                BoardCustomField.objects.filter(board=board, custom_field_id=field_id)
                .order_by("-created_at")
                .first()
            )
            if existing_link and existing_link.deleted_at is None:
                if not existing_link.is_enabled:
                    existing_link.is_enabled = True
                    order += 1000
                    existing_link.sort_order = order
                    existing_link.save(update_fields=["is_enabled", "sort_order", "updated_at"])
                    created.append(existing_link)
                continue
            custom_field = WorkspaceCustomField.objects.filter(
                pk=field_id, workspace_id=workspace_id, deleted_at__isnull=True, is_active=True
            ).first()
            if not custom_field:
                continue
            order += 1000
            if existing_link and existing_link.deleted_at is not None:
                existing_link.deleted_at = None
                existing_link.is_enabled = True
                existing_link.sort_order = order
                existing_link.save(update_fields=["deleted_at", "is_enabled", "sort_order", "updated_at"])
                created.append(existing_link)
                continue
            board_field = BoardCustomField.objects.create(
                board=board,
                workspace_id=workspace_id,
                custom_field=custom_field,
                sort_order=order,
                is_enabled=True,
                created_by=request.user,
            )
            created.append(board_field)

        sync_board_custom_fields_to_all_board_projects(board, request.user)
        return Response(
            BoardCustomFieldSerializer(created, many=True).data,
            status=status.HTTP_201_CREATED,
        )


class BoardCustomFieldDetailEndpoint(BaseAPIView):
    def _get_board(self, slug: str, board_slug: str):
        return Board.objects.get(workspace__slug=slug, slug=board_slug, deleted_at__isnull=True)

    def _queryset(self, board):
        return (
            BoardCustomField.objects.filter(board=board, deleted_at__isnull=True)
            .select_related("custom_field")
            .order_by("sort_order", "custom_field__name")
        )

    @allow_workspace_or_board_admin
    def patch(self, request, slug, board_slug, pk):
        board = self._get_board(slug, board_slug)
        standard_field = BoardStandardField.objects.filter(board=board, deleted_at__isnull=True, pk=pk).first()
        if standard_field:
            serializer = BoardStandardFieldUpdateSerializer(
                standard_field, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(
                    BoardStandardFieldSerializer(standard_field).data,
                    status=status.HTTP_200_OK,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        board_field = self._queryset(board).get(pk=pk)
        update_fields = []
        if "is_enabled" in request.data:
            board_field.is_enabled = bool(request.data["is_enabled"])
            update_fields.append("is_enabled")
        if "sort_order" in request.data:
            board_field.sort_order = float(request.data["sort_order"])
            update_fields.append("sort_order")
        if "form_span" in request.data and request.data["form_span"] in ("half", "full"):
            board_field.form_span = request.data["form_span"]
            update_fields.append("form_span")
        if update_fields:
            board_field.save(update_fields=[*update_fields, "updated_at"])
            if board_field.is_enabled:
                sync_board_custom_fields_to_all_board_projects(board, request.user)
        return Response(BoardCustomFieldSerializer(board_field).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def delete(self, request, slug, board_slug, pk):
        board = self._get_board(slug, board_slug)
        standard_field = BoardStandardField.objects.filter(board=board, deleted_at__isnull=True, pk=pk).first()
        if standard_field:
            standard_field.is_enabled = False
            standard_field.save(update_fields=["is_enabled", "updated_at"])
            return Response(status=status.HTTP_204_NO_CONTENT)

        board_field = self._queryset(board).get(pk=pk)
        board_field.is_enabled = False
        board_field.delete(soft=True)
        sync_board_custom_fields_to_all_board_projects(board, request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
