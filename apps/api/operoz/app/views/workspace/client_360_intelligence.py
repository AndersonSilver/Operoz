from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions import ROLE, allow_permission
from operoz.app.serializers.client_360_intelligence import (
    Client360QbrDraftWriteSerializer,
    Client360SuggestedActionDismissSerializer,
    Client360SuggestedActionFeedbackSerializer,
    WorkspaceClient360ScenarioPlaybookWriteSerializer,
)
from operoz.app.views.base import BaseAPIView
from operoz.app.views.workspace.client_360 import WorkspaceClient360ViewSet
from operoz.db.models import (
    Client360QbrDraft,
    Client360SuggestedActionDismissal,
    Project,
    Workspace,
    WorkspaceClient360ScenarioPlaybook,
    WorkspaceClient360WeeklyBriefing,
)
from operoz.utils.client_360_health_history import build_health_history_payload
from operoz.utils.client_360_intelligence import (
    build_health_explainer,
    build_suggested_actions,
    build_weekly_briefing_facts,
    detect_scenarios,
    filter_dismissed_actions,
    generate_qbr_draft_md,
    generate_weekly_briefing_md,
    quarter_key_from_date,
    resolve_scenario_playbooks,
    serialize_qbr_draft,
    serialize_weekly_briefing,
    upsert_weekly_briefing,
    validate_briefing_qa,
    compute_facts_hash,
)
from operoz.utils.client_360_narrative import serialize_narrative
from operoz.utils.client_360_qbr_service import build_client_qbr_context


class WorkspaceClient360WeeklyBriefingEndpoint(BaseAPIView):
    view_set = WorkspaceClient360ViewSet()

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        period, err = self.view_set._parse_period(request)
        if err:
            return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        row = WorkspaceClient360WeeklyBriefing.objects.filter(
            workspace=workspace,
            period_start=period.start,
            deleted_at__isnull=True,
        ).first()
        return Response(serialize_weekly_briefing(row), status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        self.view_set.request = request
        list_response = self.view_set.list(request, slug=slug)
        if list_response.status_code != status.HTTP_200_OK:
            return list_response
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        period_start_raw = list_response.data.get("period_start")
        period_end_raw = list_response.data.get("period_end")
        period_start = parse_date(period_start_raw) if isinstance(period_start_raw, str) else period_start_raw
        period_end = parse_date(period_end_raw) if isinstance(period_end_raw, str) else period_end_raw
        facts = build_weekly_briefing_facts(
            summary=list_response.data.get("summary") or {},
            clients=list_response.data.get("clients") or [],
            period={"start": period_start_raw, "end": period_end_raw},
        )
        facts_hash = compute_facts_hash(facts)
        existing = WorkspaceClient360WeeklyBriefing.objects.filter(
            workspace=workspace,
            period_start=period_start,
            facts_hash=facts_hash,
            status=WorkspaceClient360WeeklyBriefing.STATUS_PUBLISHED,
            deleted_at__isnull=True,
        ).first()
        if existing and not request.data.get("force"):
            return Response(serialize_weekly_briefing(existing), status=status.HTTP_200_OK)
        content_md = generate_weekly_briefing_md(facts)
        ok, qa_issues = validate_briefing_qa(content_md, facts)
        row = upsert_weekly_briefing(
            workspace_id=workspace.id,
            period_start=period_start,
            period_end=period_end,
            content_md=content_md,
            facts_hash=facts_hash,
            qa_issues=qa_issues if not ok else [],
        )
        return Response(serialize_weekly_briefing(row), status=status.HTTP_200_OK)


class WorkspaceClient360ScenarioPlaybooksEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        scenario_keys = [s.strip() for s in (request.query_params.get("scenarios") or "").split(",") if s.strip()]
        locale = request.query_params.get("locale") or "pt-BR"
        playbooks = resolve_scenario_playbooks(workspace.id, scenario_keys, locale=locale)
        return Response({"playbooks": playbooks}, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = WorkspaceClient360ScenarioPlaybookWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        row = WorkspaceClient360ScenarioPlaybook.objects.create(
            workspace=workspace,
            **serializer.validated_data,
        )
        return Response(
            {
                "id": str(row.id),
                "scenario_key": row.scenario_key,
                "playbook_code": row.playbook_code,
                "title": row.title,
                "version": row.version,
            },
            status=status.HTTP_201_CREATED,
        )


class WorkspaceClient360ScenarioPlaybookDetailEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, playbook_id):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        row = WorkspaceClient360ScenarioPlaybook.objects.filter(
            id=playbook_id,
            workspace=workspace,
            deleted_at__isnull=True,
        ).first()
        if not row:
            return Response({"error": "Playbook not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = WorkspaceClient360ScenarioPlaybookWriteSerializer(row, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        row = serializer.save()
        return Response(
            {
                "id": str(row.id),
                "scenario_key": row.scenario_key,
                "playbook_code": row.playbook_code,
                "title": row.title,
                "version": row.version,
            },
            status=status.HTTP_200_OK,
        )


class WorkspaceClient360IntelligenceRagReindexEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        from operoz.utils.client_360_intelligence_rag import reindex_workspace_snapshots

        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        result = reindex_workspace_snapshots(workspace.id)
        return Response(result, status=status.HTTP_200_OK)


class WorkspaceClient360ProjectQbrDraftEndpoint(BaseAPIView):
    view_set = WorkspaceClient360ViewSet()

    def _project(self, request, slug, project_id):
        self.view_set.request = request
        return self.view_set._accessible_projects(slug).filter(id=project_id).first()

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, project_id):
        project = self._project(request, slug, project_id)
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
        quarter = request.query_params.get("quarter") or quarter_key_from_date(timezone.now().date())
        row = Client360QbrDraft.objects.filter(
            project=project,
            quarter_key=quarter,
            deleted_at__isnull=True,
        ).first()
        return Response(serialize_qbr_draft(row), status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, project_id):
        period, err = self.view_set._parse_period(request)
        if err:
            return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)
        project = self._project(request, slug, project_id)
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = Client360QbrDraftWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        quarter = request.query_params.get("quarter") or quarter_key_from_date(period.start)
        row = Client360QbrDraft.objects.filter(project=project, quarter_key=quarter, deleted_at__isnull=True).first()
        if row and row.human_edited_md and not serializer.validated_data.get("regenerate"):
            return Response(serialize_qbr_draft(row), status=status.HTTP_200_OK)
        workspace = project.workspace
        context_payload = build_client_qbr_context(
            workspace=workspace,
            project=project,
            period=period,
            weeks=8,
            issue_queryset=self.view_set._workspace_issues_queryset(slug, [project.id]),
            include_compare=False,
        )
        from operoz.db.models import Client360Narrative

        narrative_row = Client360Narrative.objects.filter(project=project, period_start=period.start).first()
        detail_response = self.view_set.retrieve(request, slug=slug, project_id=project_id)
        if detail_response.status_code != status.HTTP_200_OK:
            return detail_response
        draft_context = {
            "quarter_key": quarter,
            "client": detail_response.data,
            "narrative": serialize_narrative(narrative_row),
            "finops": detail_response.data.get("finops") or {},
            "health_history": build_health_history_payload(
                project,
                weeks=8,
                issue_queryset=self.view_set._workspace_issues_queryset(slug, [project.id]),
            ),
            "qbr": context_payload,
        }
        content_md = generate_qbr_draft_md(draft_context)
        facts_hash = compute_facts_hash(draft_context)
        row, _ = Client360QbrDraft.objects.update_or_create(
            workspace=workspace,
            project=project,
            quarter_key=quarter,
            defaults={
                "content_md": content_md,
                "source_facts_hash": facts_hash,
                "status": "draft",
                "generated_at": timezone.now(),
            },
        )
        return Response(serialize_qbr_draft(row), status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def patch(self, request, slug, project_id):
        project = self._project(request, slug, project_id)
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = Client360QbrDraftWriteSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        quarter = request.query_params.get("quarter") or quarter_key_from_date(timezone.now().date())
        row = Client360QbrDraft.objects.filter(project=project, quarter_key=quarter, deleted_at__isnull=True).first()
        if not row:
            return Response({"error": "Draft not found"}, status=status.HTTP_404_NOT_FOUND)
        if "human_edited_md" in serializer.validated_data:
            row.human_edited_md = serializer.validated_data["human_edited_md"]
            row.status = "human_edited"
            row.save(update_fields=["human_edited_md", "status", "updated_at"])
        return Response(serialize_qbr_draft(row), status=status.HTTP_200_OK)


class WorkspaceClient360ProjectHealthExplainerEndpoint(BaseAPIView):
    view_set = WorkspaceClient360ViewSet()

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, project_id):
        self.view_set.request = request
        detail_response = self.view_set.retrieve(request, slug=slug, project_id=project_id)
        if detail_response.status_code != status.HTTP_200_OK:
            return detail_response
        payload = build_health_explainer(detail_response.data)
        return Response(payload, status=status.HTTP_200_OK)


class WorkspaceClient360ProjectSuggestedActionsEndpoint(BaseAPIView):
    view_set = WorkspaceClient360ViewSet()

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, project_id):
        self.view_set.request = request
        detail_response = self.view_set.retrieve(request, slug=slug, project_id=project_id)
        if detail_response.status_code != status.HTTP_200_OK:
            return detail_response
        actions = build_suggested_actions(detail_response.data, workspace_slug=slug)
        actions = filter_dismissed_actions(
            actions,
            project_id=project_id,
            member_id=request.user.id,
        )
        scenarios = detect_scenarios(detail_response.data)
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        playbooks = resolve_scenario_playbooks(workspace.id, scenarios) if workspace else []
        return Response(
            {"actions": actions, "scenarios": scenarios, "playbooks": playbooks},
            status=status.HTTP_200_OK,
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, project_id):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        project = Project.objects.filter(id=project_id, workspace=workspace, archived_at__isnull=True).first()
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = Client360SuggestedActionDismissSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        Client360SuggestedActionDismissal.objects.get_or_create(
            workspace=workspace,
            project=project,
            member=request.user,
            action_key=serializer.validated_data["action_key"],
        )
        return Response({"dismissed": True}, status=status.HTTP_200_OK)


class WorkspaceClient360SuggestedActionFeedbackEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, project_id):
        serializer = Client360SuggestedActionFeedbackSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response({"logged": True}, status=status.HTTP_200_OK)
