from rest_framework import status
from rest_framework.response import Response

from operis.app.permissions.board_access import allow_workspace_or_board_admin
from operis.app.serializers.board_automation_assets import (
    BoardAutomationEmailTemplateSerializer,
    BoardAutomationScriptSerializer,
)
from operis.app.views.base import BaseAPIView
from operis.app.views.board.automation import _get_board
from operis.db.models import BoardAutomationEmailTemplate, BoardAutomationScript


class BoardAutomationScriptListEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        scripts = BoardAutomationScript.objects.filter(board=board, deleted_at__isnull=True).order_by("name")
        return Response(BoardAutomationScriptSerializer(scripts, many=True).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        serializer = BoardAutomationScriptSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        script = serializer.save(board=board, workspace=board.workspace)
        return Response(BoardAutomationScriptSerializer(script).data, status=status.HTTP_201_CREATED)


class BoardAutomationScriptDetailEndpoint(BaseAPIView):
    def _get_script(self, slug, board_slug, script_id):
        board = _get_board(slug, board_slug)
        return BoardAutomationScript.objects.get(pk=script_id, board=board, deleted_at__isnull=True)

    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug, script_id):
        script = self._get_script(slug, board_slug, script_id)
        return Response(BoardAutomationScriptSerializer(script).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def patch(self, request, slug, board_slug, script_id):
        script = self._get_script(slug, board_slug, script_id)
        serializer = BoardAutomationScriptSerializer(script, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        script = serializer.save()
        return Response(BoardAutomationScriptSerializer(script).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def delete(self, request, slug, board_slug, script_id):
        script = self._get_script(slug, board_slug, script_id)
        script.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BoardAutomationEmailTemplateListEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        templates = BoardAutomationEmailTemplate.objects.filter(board=board, deleted_at__isnull=True).order_by("name")
        return Response(BoardAutomationEmailTemplateSerializer(templates, many=True).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        serializer = BoardAutomationEmailTemplateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        template = serializer.save(board=board, workspace=board.workspace)
        return Response(BoardAutomationEmailTemplateSerializer(template).data, status=status.HTTP_201_CREATED)


class BoardAutomationEmailTemplateDetailEndpoint(BaseAPIView):
    def _get_template(self, slug, board_slug, template_id):
        board = _get_board(slug, board_slug)
        return BoardAutomationEmailTemplate.objects.get(pk=template_id, board=board, deleted_at__isnull=True)

    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug, template_id):
        template = self._get_template(slug, board_slug, template_id)
        return Response(BoardAutomationEmailTemplateSerializer(template).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def patch(self, request, slug, board_slug, template_id):
        template = self._get_template(slug, board_slug, template_id)
        serializer = BoardAutomationEmailTemplateSerializer(template, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        template = serializer.save()
        return Response(BoardAutomationEmailTemplateSerializer(template).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def delete(self, request, slug, board_slug, template_id):
        template = self._get_template(slug, board_slug, template_id)
        template.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
