from __future__ import annotations

from datetime import date

import pytest
from django.utils import timezone

from operis.db.models import Intake, IntakeIssue, Issue, Project, ProjectMember, State
from operis.db.models.intake import IntakeIssueStatus, IntakeTicketKind
from operis.utils.client_360 import aggregate_client360_issue_stats, merge_support_hub_stats
from operis.utils.client_360_support_hub import (
    aggregate_support_hub_stats,
    aggregate_support_metrics_analytics,
)


@pytest.mark.unit
class TestMergeSupportHubStats:
    def test_merge_support_hub_stats_fills_zeros(self):
        merged = merge_support_hub_stats(
            {"p1": {"total": 3, "pending": 2, "overdue": 1}},
            {},
        )
        assert merged["p1"]["support_open"] == 0
        assert merged["p1"]["overdue"] == 1


@pytest.mark.unit
@pytest.mark.django_db
class TestClient360SupportHubStats:
    def _create_project(self, workspace, workspace_board, create_user):
        project = Project.objects.create(
            name="Cliente Teste",
            identifier="CLT360",
            workspace=workspace,
            board=workspace_board,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        return project

    def test_counts_active_support_hub_tickets(self, workspace, workspace_board, create_user):
        user = create_user
        project = self._create_project(workspace, workspace_board, user)
        intake = Intake.objects.create(name="Sustentação", project=project, workspace=workspace, created_by=user)
        state = State.objects.filter(project=project).first()

        def make_issue(name: str):
            return Issue.objects.create(
                name=name,
                project=project,
                workspace=workspace,
                state=state,
                created_by=user,
            )

        IntakeIssue.objects.create(
            intake=intake,
            issue=make_issue("Chamado aberto"),
            project=project,
            workspace=workspace,
            created_by=user,
            ticket_kind=IntakeTicketKind.SUPPORT,
            status=IntakeIssueStatus.PENDING,
        )
        IntakeIssue.objects.create(
            intake=intake,
            issue=make_issue("Chamado em andamento"),
            project=project,
            workspace=workspace,
            created_by=user,
            ticket_kind=IntakeTicketKind.SUPPORT,
            status=IntakeIssueStatus.ACCEPTED,
        )
        IntakeIssue.objects.create(
            intake=intake,
            issue=make_issue("Chamado encerrado"),
            project=project,
            workspace=workspace,
            created_by=user,
            ticket_kind=IntakeTicketKind.SUPPORT,
            status=IntakeIssueStatus.CLOSED,
        )
        IntakeIssue.objects.create(
            intake=intake,
            issue=make_issue("Pedido intake"),
            project=project,
            workspace=workspace,
            created_by=user,
            ticket_kind=IntakeTicketKind.INTAKE,
            status=IntakeIssueStatus.PENDING,
        )

        today = timezone.now().date()
        pid = str(project.id)
        stats = aggregate_support_hub_stats(
            [project.id],
            today,
            project_board_map={pid: str(workspace_board.id)},
            sla_map={str(workspace_board.id): 7},
        )

        assert stats[pid]["support_open"] == 2
        assert stats[pid]["support_overdue"] == 0

    def test_merged_stats_include_hub_support(self, workspace, workspace_board, create_user):
        user = create_user
        project = self._create_project(workspace, workspace_board, user)
        intake = Intake.objects.create(name="Sustentação", project=project, workspace=workspace, created_by=user)
        state = State.objects.filter(project=project).first()
        issue = Issue.objects.create(
            name="Chamado aberto",
            project=project,
            workspace=workspace,
            state=state,
            created_by=user,
        )
        IntakeIssue.objects.create(
            intake=intake,
            issue=issue,
            project=project,
            workspace=workspace,
            created_by=user,
            ticket_kind=IntakeTicketKind.SUPPORT,
            status=IntakeIssueStatus.PENDING,
        )

        issue_qs = Issue.issue_objects.filter(project=project)
        today = date.today()
        pid = str(project.id)

        merged = aggregate_client360_issue_stats(
            issue_qs,
            today,
            project_ids=[project.id],
            project_board_map={pid: str(workspace_board.id)},
            sla_map={str(workspace_board.id): 7},
        )

        assert merged[pid]["total"] >= 1
        assert merged[pid]["support_open"] == 1
        assert "support_overdue" in merged[pid]

    def test_support_metrics_analytics_median_by_criticality(self, workspace, workspace_board, create_user):
        user = create_user
        project = self._create_project(workspace, workspace_board, user)
        intake = Intake.objects.create(name="Sustentação", project=project, workspace=workspace, created_by=user)
        state = State.objects.filter(project=project).first()
        now = timezone.now()
        closed_at = now.isoformat()
        accepted_at = (now - timezone.timedelta(minutes=30)).isoformat()
        opened_at = now - timezone.timedelta(hours=2)

        issue = Issue.objects.create(
            name="Chamado encerrado",
            project=project,
            workspace=workspace,
            state=state,
            created_by=user,
        )
        intake_issue = IntakeIssue.objects.create(
            intake=intake,
            issue=issue,
            project=project,
            workspace=workspace,
            created_by=user,
            ticket_kind=IntakeTicketKind.SUPPORT,
            status=IntakeIssueStatus.CLOSED,
            extra={
                "accepted_at": accepted_at,
                "closed_at": closed_at,
                "support": {"criticality": "p1"},
            },
        )
        IntakeIssue.objects.filter(pk=intake_issue.pk).update(created_at=opened_at)

        today = now.date()
        analytics = aggregate_support_metrics_analytics(
            [project.id],
            period_start=today,
            period_end=today,
        )

        bucket = analytics["by_criticality"]["p1"]
        assert bucket["count"] == 1
        assert bucket["median_tta_seconds"] == 5400
        assert bucket["median_ttr_seconds"] == 7200
        assert str(project.id) in analytics["by_client"]
