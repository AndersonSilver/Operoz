from rest_framework import status
from rest_framework.response import Response

from operis.app.permissions import ROLE, allow_permission
from operis.app.serializers.intake_form import IntakeFormSerializer, IntakeFormWriteSerializer
from operis.app.views.base import BaseAPIView
from operis.db.models import IntakeForm, Project


class IntakeFormListCreateEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def get(self, request, slug, project_id):
        project = Project.objects.get(workspace__slug=slug, pk=project_id)
        forms = IntakeForm.objects.filter(project_id=project.id, workspace__slug=slug).order_by("-created_at")
        return Response(IntakeFormSerializer(forms, many=True, context={"request": request}).data)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    def post(self, request, slug, project_id):
        project = Project.objects.get(workspace__slug=slug, pk=project_id)
        serializer = IntakeFormWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        form = serializer.save(project=project, workspace_id=project.workspace_id, created_by=request.user)
        return Response(
            IntakeFormSerializer(form, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class IntakeFormDetailEndpoint(BaseAPIView):
    def _get_form(self, slug, project_id, form_id):
        return IntakeForm.objects.get(
            pk=form_id,
            project_id=project_id,
            workspace__slug=slug,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def get(self, request, slug, project_id, form_id):
        form = self._get_form(slug, project_id, form_id)
        return Response(IntakeFormSerializer(form, context={"request": request}).data)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    def patch(self, request, slug, project_id, form_id):
        form = self._get_form(slug, project_id, form_id)
        serializer = IntakeFormWriteSerializer(form, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        form = serializer.save(updated_by=request.user)
        return Response(IntakeFormSerializer(form, context={"request": request}).data)

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    def delete(self, request, slug, project_id, form_id):
        form = self._get_form(slug, project_id, form_id)
        form.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
