from django.urls import path

from operis.app.views.board.project_permissions import ProjectBoardPermissionsEndpoint
from operis.app.views.project.status_reports import (
    ProjectStatusReportDetailEndpoint,
    ProjectStatusReportEndpoint,
    ProjectStatusReportExportEndpoint,
)
from operis.app.views.project.status_report_preview import ProjectStatusReportPreviewEndpoint
from operis.app.views import (
    ProjectCustomFieldEndpoint,
    ProjectCustomFieldValueEndpoint,
    ProjectFormLayoutEndpoint,
    ProjectIssueTypeEndpoint,
    ProjectViewSet,
    DeployBoardViewSet,
    ProjectInvitationsViewset,
    ProjectMemberViewSet,
    ProjectMemberUserEndpoint,
    ProjectJoinEndpoint,
    ProjectUserViewsEndpoint,
    ProjectIdentifierEndpoint,
    ProjectFavoritesViewSet,
    UserProjectInvitationsViewset,
    UserProjectRolesEndpoint,
    ProjectArchiveUnarchiveEndpoint,
    ProjectMemberPreferenceEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/",
        ProjectViewSet.as_view({"get": "list", "post": "create"}),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/projects/details/",
        ProjectViewSet.as_view({"get": "list_detail"}),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:pk>/",
        ProjectViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/",
        ProjectIssueTypeEndpoint.as_view(),
        name="project-issue-types",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/custom-fields/",
        ProjectCustomFieldEndpoint.as_view(),
        name="project-custom-fields",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/form-layout/",
        ProjectFormLayoutEndpoint.as_view(),
        name="project-form-layout",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/custom-field-values/",
        ProjectCustomFieldValueEndpoint.as_view(),
        name="project-custom-field-values",
    ),
    path(
        "workspaces/<str:slug>/project-identifiers/",
        ProjectIdentifierEndpoint.as_view(),
        name="project-identifiers",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/invitations/",
        ProjectInvitationsViewset.as_view({"get": "list", "post": "create"}),
        name="project-member-invite",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/invitations/<uuid:pk>/",
        ProjectInvitationsViewset.as_view({"get": "retrieve", "delete": "destroy"}),
        name="project-member-invite",
    ),
    path(
        "users/me/workspaces/<str:slug>/projects/invitations/",
        UserProjectInvitationsViewset.as_view({"get": "list", "post": "create"}),
        name="user-project-invitations",
    ),
    path(
        "users/me/workspaces/<str:slug>/project-roles/",
        UserProjectRolesEndpoint.as_view(),
        name="user-project-roles",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/join/<uuid:pk>/",
        ProjectJoinEndpoint.as_view(),
        name="project-join",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/members/",
        ProjectMemberViewSet.as_view({"get": "list", "post": "create"}),
        name="project-member",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/members/<uuid:pk>/",
        ProjectMemberViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="project-member",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/members/leave/",
        ProjectMemberViewSet.as_view({"post": "leave"}),
        name="project-member",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-views/",
        ProjectUserViewsEndpoint.as_view(),
        name="project-view",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-members/me/",
        ProjectMemberUserEndpoint.as_view(),
        name="project-member-view",
    ),
    path(
        "workspaces/<str:slug>/user-favorite-projects/",
        ProjectFavoritesViewSet.as_view({"get": "list", "post": "create"}),
        name="project-favorite",
    ),
    path(
        "workspaces/<str:slug>/user-favorite-projects/<uuid:project_id>/",
        ProjectFavoritesViewSet.as_view({"delete": "destroy"}),
        name="project-favorite",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-deploy-boards/",
        DeployBoardViewSet.as_view({"get": "list", "post": "create"}),
        name="project-deploy-board",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-deploy-boards/<uuid:pk>/",
        DeployBoardViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="project-deploy-board",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/archive/",
        ProjectArchiveUnarchiveEndpoint.as_view(),
        name="project-archive-unarchive",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/preferences/member/<uuid:member_id>/",
        ProjectMemberPreferenceEndpoint.as_view(),
        name="project-member-preference",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/board-permissions/",
        ProjectBoardPermissionsEndpoint.as_view(),
        name="project-board-permissions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/status-reports/",
        ProjectStatusReportEndpoint.as_view(),
        name="project-status-reports",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/status-reports/<uuid:pk>/",
        ProjectStatusReportDetailEndpoint.as_view(),
        name="project-status-report",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/status-reports/<uuid:pk>/export/",
        ProjectStatusReportExportEndpoint.as_view(),
        name="project-status-report-export",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/status-reports/<uuid:pk>/preview/",
        ProjectStatusReportPreviewEndpoint.as_view(),
        name="project-status-report-preview",
    ),
]
