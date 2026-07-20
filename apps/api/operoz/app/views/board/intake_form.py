from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions.board_access import allow_workspace_or_board_admin
from operoz.app.serializers.board_intake_form import BoardIntakeFormSerializer, BoardIntakeFormWriteSerializer
from operoz.app.views.base import BaseAPIView
from operoz.app.views.board.automation import _get_board
from operoz.db.models import BoardIntakeForm
from operoz.utils.board_intake_submission import validate_board_intake_form_fields


class BoardIntakeFormListCreateEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        scope = request.query_params.get("scope", "support")
        forms = BoardIntakeForm.objects.filter(board=board, deleted_at__isnull=True, form_scope=scope).order_by("-created_at")
        return Response(BoardIntakeFormSerializer(forms, many=True, context={"request": request}).data)

    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        serializer = BoardIntakeFormWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        form = serializer.save(board=board, workspace_id=board.workspace_id, created_by=request.user)
        return Response(
            BoardIntakeFormSerializer(form, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class BoardIntakeFormDetailEndpoint(BaseAPIView):
    def _get_form(self, slug, board_slug, form_id):
        board = _get_board(slug, board_slug)
        return BoardIntakeForm.objects.get(pk=form_id, board=board, deleted_at__isnull=True)

    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug, form_id):
        form = self._get_form(slug, board_slug, form_id)
        return Response(BoardIntakeFormSerializer(form, context={"request": request}).data)

    @allow_workspace_or_board_admin
    def patch(self, request, slug, board_slug, form_id):
        form = self._get_form(slug, board_slug, form_id)
        serializer = BoardIntakeFormWriteSerializer(form, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        if serializer.validated_data.get("is_published"):
            candidate_fields = serializer.validated_data.get("fields", form.fields)
            validate_board_intake_form_fields(BoardIntakeForm(fields=candidate_fields))
        form = serializer.save(updated_by=request.user)
        return Response(BoardIntakeFormSerializer(form, context={"request": request}).data)

    @allow_workspace_or_board_admin
    def delete(self, request, slug, board_slug, form_id):
        form = self._get_form(slug, board_slug, form_id)
        form.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
