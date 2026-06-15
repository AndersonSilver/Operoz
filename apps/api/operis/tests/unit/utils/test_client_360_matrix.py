from __future__ import annotations

from datetime import date

import pytest
from django.utils import timezone

from operis.utils.client_360 import WeekPeriod, compute_report_coverage
from operis.utils.client_360_matrix import (
    aggregate_status_reports_matrix,
    build_client360_matrix_payload,
    build_matrix_cell,
    week_periods_ending_at,
)


class TestWeekPeriodsEndingAt:
    def test_eight_weeks_ordered(self):
        anchor = WeekPeriod(start=date(2026, 6, 9), end=date(2026, 6, 15))
        periods = week_periods_ending_at(anchor, 8)
        assert len(periods) == 8
        assert periods[-1] == anchor
        starts = [period.start for period in periods]
        assert starts == sorted(starts)


class TestBuildMatrixCell:
    def test_complete_coverage(self):
        period = WeekPeriod(start=date(2026, 6, 9), end=date(2026, 6, 15))
        cell = build_matrix_cell(
            period=period,
            modules_total=2,
            report_stats={
                "modules_published": 2,
                "modules_draft_only": 0,
                "has_project_level_published": False,
            },
        )
        assert cell["coverage"] == "complete"
        assert cell["module_breakdown"] is None

    def test_partial_includes_breakdown_when_modules_provided(self):
        period = WeekPeriod(start=date(2026, 6, 9), end=date(2026, 6, 15))

        class FakeModule:
            def __init__(self, module_id: str, name: str):
                self.id = module_id
                self.name = name

        modules = [FakeModule("m1", "Alpha"), FakeModule("m2", "Beta")]
        cell = build_matrix_cell(
            period=period,
            modules_total=2,
            report_stats={
                "modules_published": 1,
                "modules_draft_only": 0,
                "has_project_level_published": False,
            },
            modules=modules,
            raw_reports=[
                {"module_id": "m1", "published_at": date(2026, 6, 10)},
            ],
        )
        assert cell["coverage"] == "partial"
        assert cell["module_breakdown"] == [
            {"module_id": "m1", "module_name": "Alpha", "status": "published"},
            {"module_id": "m2", "module_name": "Beta", "status": "missing"},
        ]


@pytest.mark.django_db
class TestAggregateStatusReportsMatrix:
    def test_ten_clients_eight_weeks(
        self,
        db,
        workspace,
        workspace_board,
        create_user,
    ):
        from operis.db.models import BoardStatusReport, Module, Project, ProjectMember

        anchor = WeekPeriod(start=date(2026, 6, 9), end=date(2026, 6, 15))
        periods = week_periods_ending_at(anchor, 8)
        projects = []
        for index in range(10):
            project = Project.objects.create(
                name=f"Cliente {index}",
                identifier=f"C{index}",
                workspace=workspace,
                board=workspace_board,
                created_by=create_user,
            )
            ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
            Module.objects.create(
                name=f"Mod {index}",
                project=project,
                workspace=workspace,
                created_by=create_user,
            )
            projects.append(project)

        project_ids = [project.id for project in projects]
        for project_index, project in enumerate(projects):
            for week_index, period in enumerate(periods):
                published = (project_index + week_index) % 3 != 0
                BoardStatusReport.objects.create(
                    project=project,
                    workspace=workspace,
                    board=workspace_board,
                    period_start=period.start,
                    period_end=period.end,
                    created_by=create_user,
                    published_at=timezone.now() if published else None,
                    module=Module.objects.filter(project=project).first(),
                )

        stats_map = aggregate_status_reports_matrix(project_ids, periods)
        assert len(stats_map) == 80

        module_counts = {str(project.id): 1 for project in projects}
        payload = build_client360_matrix_payload(
            projects,
            anchor_period=anchor,
            weeks=8,
            module_counts=module_counts,
            page=1,
            page_size=50,
            include_board=True,
        )
        assert payload["pagination"]["total"] == 10
        assert len(payload["clients"]) == 10
        assert len(payload["clients"][0]["cells"]) == 8

        cell_count = sum(len(client["cells"]) for client in payload["clients"])
        assert cell_count == 80

        for client in payload["clients"]:
            for cell in client["cells"]:
                expected = compute_report_coverage(
                    cell["modules_total"],
                    cell["modules_published"],
                    cell["modules_draft"],
                    False,
                )
                assert cell["coverage"] == expected
