# Module imports
from .base import BaseViewSet
from operoz.app.permissions.base import allow_permission, ROLE
from operoz.app.serializers import ProjectContactSerializer
from operoz.db.models import Project, ProjectContact


class ProjectContactViewSet(BaseViewSet):
    serializer_class = ProjectContactSerializer
    model = ProjectContact

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
        )

    def perform_create(self, serializer):
        project = Project.objects.get(pk=self.kwargs.get("project_id"), workspace__slug=self.kwargs.get("slug"))
        serializer.save(project=project, workspace_id=project.workspace_id)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        return super().list(request)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        return super().create(request)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def partial_update(self, request, slug, project_id, pk):
        return super().partial_update(request)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, pk):
        return super().destroy(request)
