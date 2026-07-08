"""
ViewSets for Workflow Engine
"""

from rest_framework import status
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone

from operoz.app.views.base import BaseViewSet
from operoz.app.permissions.base import ROLE, allow_permission
from operoz.app.serializers.workflow import (
    WorkflowSerializer,
    WorkflowGraphSerializer,
    WorkflowSchemeSerializer,
    IssueTransitionSerializer,
    TransitionExecuteSerializer,
    TransitionScreenSerializer,
    WorkflowSchemeWriteSerializer,
    BootstrapSchemeSerializer,
    AssignSchemeProjectsSerializer,
)
from operoz.db.models import (
    Workflow,
    WorkflowTransition,
    WorkflowScheme,
    WorkflowSchemeEntry,
    TransitionScreen,
    Issue,
    State,
    IssueType,
    Project,
    Workspace,
)
from operoz.workflow.engine import (
    execute_transition,
    get_available_transitions,
    resolve_issue_workflow,
    ConditionNotSatisfiedError,
    ValidationError as WorkflowValidationError,
    ConcurrentStateChangeError,
    WorkflowExecutionError,
)
from operoz.workflow.graph import graph_to_models, models_to_graph, validate_graph
from operoz.workflow.bootstrap import create_workflow_from_project


class WorkflowViewSet(BaseViewSet):
    """ViewSet for Workflow CRUD operations"""

    serializer_class = WorkflowSerializer
    model = Workflow

    def get_queryset(self):
        return Workflow.objects.filter(workspace__slug=self.workspace_slug).select_related("initial_state", "workspace")

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = WorkflowSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        workflow = serializer.save(workspace=workspace, created_by=request.user)
        return Response(WorkflowSerializer(workflow).data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def partial_update(self, request, slug, pk):
        workflow = self.get_object()
        serializer = WorkflowSerializer(workflow, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(serializer.data)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        workflow = self.get_object()
        workflow.delete(soft=True)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def graph(self, request, slug, pk):
        """GET /workflows/{id}/graph/ - Get workflow as graph"""
        workflow = self.get_object()
        graph = models_to_graph(workflow)
        return Response(graph)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def save_graph(self, request, slug, pk):
        """PUT /workflows/{id}/graph/ - Save workflow from graph"""
        workflow = self.get_object()
        serializer = WorkflowGraphSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Convert graph to models
        try:
            graph_to_models(workflow, serializer.validated_data, request.user)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        workflow.refresh_from_db()
        return Response(models_to_graph(workflow))

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def publish(self, request, slug, pk):
        """POST /workflows/{id}/publish/ - Publish draft workflow"""
        workflow = self.get_object()

        if not workflow.is_draft:
            return Response({"error": "Workflow is already published"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate workflow consistency
        errors = self._validate_workflow(workflow)
        if errors:
            return Response(
                {"error": "Workflow validation failed", "errors": errors}, status=status.HTTP_400_BAD_REQUEST
            )

        # Publish workflow
        workflow.is_draft = False
        workflow.is_active = True
        workflow.published_at = timezone.now()
        workflow.published_version += 1
        workflow.published_graph = models_to_graph(workflow)
        workflow.save()

        return Response(WorkflowSerializer(workflow).data)

    def _validate_workflow(self, workflow):
        """Validate workflow consistency before publishing"""
        errors = []

        if not workflow.initial_state:
            errors.append("Initial state must be set")

        state_ids = set()
        for transition in workflow.transitions.all():
            if transition.from_state:
                state_ids.add(transition.from_state.id)
            if transition.to_state:
                state_ids.add(transition.to_state.id)

        for state_id in state_ids:
            try:
                state = State.objects.get(id=state_id)
                if state.project.workspace_id != workflow.workspace_id:
                    errors.append(f"State {state.name} belongs to a different workspace")
            except State.DoesNotExist:
                errors.append(f"State with id {state_id} does not exist")

        graph = models_to_graph(workflow)
        errors.extend(validate_graph(graph))

        return errors


class WorkflowSchemeViewSet(BaseViewSet):
    """ViewSet for WorkflowScheme CRUD operations"""

    serializer_class = WorkflowSchemeSerializer
    model = WorkflowScheme

    def get_queryset(self):
        return (
            WorkflowScheme.objects.filter(workspace__slug=self.workspace_slug)
            .select_related("workspace")
            .prefetch_related(
                "entries",
                "entries__workflow",
                "entries__issue_type",
            )
        )

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = WorkflowSchemeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        scheme = serializer.save(workspace=workspace, created_by=request.user)
        return Response(WorkflowSchemeSerializer(scheme).data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def partial_update(self, request, slug, pk):
        scheme = self.get_object()
        serializer = WorkflowSchemeSerializer(scheme, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(serializer.data)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        scheme = self.get_object()
        scheme.delete(soft=True)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def save_entries(self, request, slug, pk):
        """PUT /workflow-schemes/{id}/entries/ — replace scheme entries."""
        scheme = self.get_object()
        serializer = WorkflowSchemeWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        entries_data = serializer.validated_data.get("entries", [])

        with transaction.atomic():
            if "name" in serializer.validated_data:
                scheme.name = serializer.validated_data["name"]
            if "is_default" in serializer.validated_data:
                if serializer.validated_data["is_default"]:
                    WorkflowScheme.objects.filter(
                        workspace=scheme.workspace,
                        is_default=True,
                    ).exclude(id=scheme.id).update(is_default=False)
                scheme.is_default = serializer.validated_data["is_default"]
            scheme.save()

            scheme.entries.all().delete()

            for entry_data in entries_data:
                workflow = Workflow.objects.get(
                    id=entry_data["workflow"],
                    workspace=scheme.workspace,
                )
                issue_type = None
                if entry_data.get("issue_type"):
                    issue_type = IssueType.objects.get(
                        id=entry_data["issue_type"],
                        workspace=scheme.workspace,
                    )
                WorkflowSchemeEntry.objects.create(
                    scheme=scheme,
                    issue_type=issue_type,
                    workflow=workflow,
                )

        scheme.refresh_from_db()
        return Response(WorkflowSchemeSerializer(scheme).data)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def bootstrap_from_project(self, request, slug, pk):
        """POST /workflow-schemes/{id}/bootstrap/ — workflow from project states."""
        scheme = self.get_object()
        serializer = BootstrapSchemeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            project = Project.objects.get(
                id=data["project_id"],
                workspace__slug=slug,
            )
        except Project.DoesNotExist:
            return Response({"error": "project_not_found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            workflow = create_workflow_from_project(
                project,
                scheme.workspace,
                request.user,
                mode=data.get("mode", "linear"),
                allow_back_transitions=data.get("allow_back_transitions", False),
                back_transition_mode=data.get("back_transition_mode"),
            )
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        issue_type = None
        if data.get("issue_type"):
            issue_type = IssueType.objects.get(
                id=data["issue_type"],
                workspace=scheme.workspace,
            )

        with transaction.atomic():
            WorkflowSchemeEntry.objects.filter(
                scheme=scheme,
                issue_type=issue_type,
            ).delete()
            WorkflowSchemeEntry.objects.create(
                scheme=scheme,
                issue_type=issue_type,
                workflow=workflow,
            )

            if data.get("assign_project", True):
                project.workflow_scheme = scheme
                project.save(update_fields=["workflow_scheme", "updated_at"])

        scheme.refresh_from_db()
        return Response(
            {
                "scheme": WorkflowSchemeSerializer(scheme).data,
                "workflow_id": str(workflow.id),
                "project_id": str(project.id),
            }
        )

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def assign_projects(self, request, slug, pk):
        """PUT /workflow-schemes/{id}/projects/ — assign scheme to projects."""
        scheme = self.get_object()
        serializer = AssignSchemeProjectsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project_ids = serializer.validated_data["project_ids"]

        with transaction.atomic():
            Project.objects.filter(
                workspace__slug=slug,
                workflow_scheme=scheme,
            ).update(workflow_scheme=None)

            if project_ids:
                Project.objects.filter(
                    id__in=project_ids,
                    workspace__slug=slug,
                ).update(workflow_scheme=scheme)

        assigned = Project.objects.filter(
            workspace__slug=slug,
            workflow_scheme=scheme,
        ).values_list("id", flat=True)

        return Response({"project_ids": [str(pid) for pid in assigned]})


class IssueTransitionViewSet(BaseViewSet):
    """ViewSet for Issue transition operations"""

    serializer_class = IssueTransitionSerializer
    model = WorkflowTransition

    def get_queryset(self):
        # This is not used directly; we override list to get available transitions
        return WorkflowTransition.objects.none()

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def list(self, request, slug, project_id, issue_id):
        """GET /issues/{id}/transitions/ - Get available transitions for issue"""
        issue = Issue.objects.get(id=issue_id, project_id=project_id, workspace__slug=slug)

        transitions = get_available_transitions(issue, request.user)
        workflow = resolve_issue_workflow(issue)

        data = []
        for transition in transitions:
            screen_data = None
            try:
                screen_data = TransitionScreenSerializer(transition.screen).data
            except TransitionScreen.DoesNotExist:
                pass

            data.append(
                {
                    "id": str(transition.id),
                    "name": transition.name,
                    "to_state_id": str(transition.to_state.id),
                    "to_state_name": transition.to_state.name,
                    "to_state_group": transition.to_state.group,
                    "screen": screen_data,
                }
            )

        return Response(
            {
                "workflow_configured": workflow is not None,
                "transitions": data,
            }
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def execute(self, request, slug, project_id, issue_id, tid):
        """POST /issues/{id}/transitions/{tid}/execute/ - Execute a transition"""
        issue = Issue.objects.select_related("project", "state", "type").get(
            id=issue_id,
            project_id=project_id,
            workspace__slug=slug,
        )

        workflow = resolve_issue_workflow(issue)
        if not workflow:
            return Response(
                {"error": "no_workflow_configured"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            transition = WorkflowTransition.objects.get(id=tid, workflow=workflow)
        except WorkflowTransition.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        available_ids = {str(t.id) for t in get_available_transitions(issue, request.user)}
        if str(transition.id) not in available_ids:
            return Response(
                {"error": "transition_not_available"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Validate request data
        serializer = TransitionExecuteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            updated_issue = execute_transition(issue, transition, request.user, data)

            # Return updated issue
            from operoz.app.serializers import IssueSerializer

            return Response(IssueSerializer(updated_issue).data)

        except ConditionNotSatisfiedError as e:
            return Response({"error": "condition_not_satisfied", "message": str(e)}, status=status.HTTP_403_FORBIDDEN)

        except WorkflowValidationError as e:
            return Response(
                {"error": "validation_failed", "fields": e.errors}, status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        except ConcurrentStateChangeError as e:
            return Response({"error": "concurrent_state_change", "message": str(e)}, status=status.HTTP_409_CONFLICT)

        except WorkflowExecutionError as e:
            return Response(
                {"error": "execution_failed", "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
