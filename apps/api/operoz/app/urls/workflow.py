"""
URL configuration for Workflow Engine
"""

from django.urls import path
from operoz.app.views.workflow.base import (
    WorkflowViewSet,
    WorkflowSchemeViewSet,
    IssueTransitionViewSet,
)

urlpatterns = [
    # Workflows
    path(
        "workspaces/<str:slug>/workflows/",
        WorkflowViewSet.as_view({"get": "list", "post": "create"}),
        name="workflow-list"
    ),
    path(
        "workspaces/<str:slug>/workflows/<uuid:pk>/",
        WorkflowViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="workflow-detail"
    ),
    path(
        "workspaces/<str:slug>/workflows/<uuid:pk>/graph/",
        WorkflowViewSet.as_view({"get": "graph", "put": "save_graph"}),
        name="workflow-graph"
    ),
    path(
        "workspaces/<str:slug>/workflows/<uuid:pk>/publish/",
        WorkflowViewSet.as_view({"post": "publish"}),
        name="workflow-publish"
    ),
    
    # Workflow Schemes
    path(
        "workspaces/<str:slug>/workflow-schemes/",
        WorkflowSchemeViewSet.as_view({"get": "list", "post": "create"}),
        name="workflow-scheme-list"
    ),
    path(
        "workspaces/<str:slug>/workflow-schemes/<uuid:pk>/",
        WorkflowSchemeViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="workflow-scheme-detail"
    ),
    
    path(
        "workspaces/<str:slug>/workflow-schemes/<uuid:pk>/entries/",
        WorkflowSchemeViewSet.as_view({"put": "save_entries"}),
        name="workflow-scheme-entries"
    ),
    path(
        "workspaces/<str:slug>/workflow-schemes/<uuid:pk>/bootstrap/",
        WorkflowSchemeViewSet.as_view({"post": "bootstrap_from_project"}),
        name="workflow-scheme-bootstrap"
    ),
    path(
        "workspaces/<str:slug>/workflow-schemes/<uuid:pk>/projects/",
        WorkflowSchemeViewSet.as_view({"put": "assign_projects"}),
        name="workflow-scheme-projects"
    ),
    
    # Issue Transitions
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/transitions/",
        IssueTransitionViewSet.as_view({"get": "list"}),
        name="issue-transitions-list"
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/transitions/<uuid:tid>/execute/",
        IssueTransitionViewSet.as_view({"post": "execute"}),
        name="issue-transition-execute"
    ),
]
