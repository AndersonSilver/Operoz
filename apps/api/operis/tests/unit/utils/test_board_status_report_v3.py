from __future__ import annotations

from datetime import date

import pytest

from operis.db.models import (
    BoardIssueType,
    Issue,
    IssueLabel,
    IssueType,
    Label,
    Module,
    ModuleIssue,
    Project,
    ProjectMember,
    State,
)
from operis.utils.board_status_report import (
    build_entregas_root_cards_from_module_issues,
    build_project_status_report_content,
    build_sprint_module_row,
    progress_pct_from_entregas,
)


@pytest.fixture
def report_project(db, workspace, workspace_board, create_user):
    project = Project.objects.create(
        name="Cliente Report",
        identifier="REP",
        workspace=workspace,
        board=workspace_board,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def done_state(report_project):
    return State.objects.create(
        name="Done",
        project=report_project,
        group="completed",
        color="#46A758",
    )


@pytest.fixture
def todo_state(report_project):
    return State.objects.create(
        name="Todo",
        project=report_project,
        group="backlog",
        color="#60646C",
        default=True,
    )


@pytest.mark.django_db
def test_module_single_builds_root_card_rows(
    workspace,
    report_project,
    create_user,
    done_state,
    todo_state,
):
    module = Module.objects.create(
        name="Módulo Cronograma",
        project=report_project,
        workspace=workspace,
        created_by=create_user,
        start_date=date(2026, 4, 1),
        target_date=date(2026, 6, 30),
    )
    deploy_label = Label.objects.create(name="Deploy", workspace=workspace, created_by=create_user)
    root_issue = Issue.objects.create(
        name="Deploy produção",
        workspace=workspace,
        project=report_project,
        state=done_state,
        sequence_id=52150,
        start_date=date(2026, 4, 15),
        target_date=date(2026, 4, 17),
        created_by=create_user,
    )
    IssueLabel.objects.create(
        issue=root_issue,
        label=deploy_label,
        project=report_project,
        workspace=workspace,
        created_by=create_user,
    )
    ModuleIssue.objects.create(
        module=module,
        issue=root_issue,
        project=report_project,
        workspace=workspace,
        created_by=create_user,
    )

    issue_qs = Issue.issue_objects.filter(
        workspace=workspace,
        project=report_project,
        issue_module__module_id=module.id,
        issue_module__deleted_at__isnull=True,
    ).distinct()

    rows = build_entregas_root_cards_from_module_issues(issue_qs)
    assert len(rows) == 1
    assert rows[0]["item_label"].endswith("— Deploy produção")
    assert "REP-" in rows[0]["item_label"]
    assert rows[0]["etapa_atual"] == "Deploy"
    assert rows[0]["pct"] == "100"


def _board_issue_type_stage(*, board, workspace, name, color="#00b8a9", create_user=None, sort_order=1000):
    issue_type = IssueType.objects.create(
        workspace=workspace,
        name=name,
        logo_props={"in_use": "icon", "icon": {"name": "start", "color": color}},
        is_active=True,
        created_by=create_user,
    )
    return BoardIssueType.objects.create(
        board=board,
        workspace=workspace,
        issue_type=issue_type,
        sort_order=sort_order,
        is_enabled=True,
        created_by=create_user,
    )


@pytest.mark.django_db
def test_sprint_builds_module_rows_with_stage(
    workspace,
    workspace_board,
    report_project,
    create_user,
    done_state,
    todo_state,
):
    stage = _board_issue_type_stage(
        board=workspace_board,
        workspace=workspace,
        name="Homologação externa",
        color="#00b8a9",
        create_user=create_user,
    )
    module = Module.objects.create(
        name="Módulo Sprint A",
        project=report_project,
        workspace=workspace,
        stage=stage,
        created_by=create_user,
        start_date=date(2026, 4, 15),
        target_date=date(2026, 4, 17),
    )
    done_issue = Issue.objects.create(
        name="Card concluído",
        workspace=workspace,
        project=report_project,
        state=done_state,
        created_by=create_user,
    )
    open_issue = Issue.objects.create(
        name="Card aberto",
        workspace=workspace,
        project=report_project,
        state=todo_state,
        created_by=create_user,
    )
    for issue in (done_issue, open_issue):
        ModuleIssue.objects.create(
            module=module,
            issue=issue,
            project=report_project,
            workspace=workspace,
            created_by=create_user,
        )

    row = build_sprint_module_row(module)
    assert row["item_label"] == "Módulo Sprint A"
    assert row["etapa_atual"] == "Homologação externa"
    assert row["etapa_color"] == "#00b8a9"
    assert row["pct_total"] == "50"


@pytest.mark.django_db
def test_build_project_status_report_content_sprint_kind(
    workspace,
    workspace_board,
    report_project,
    create_user,
):
    stage = _board_issue_type_stage(
        board=workspace_board,
        workspace=workspace,
        name="Deploy",
        create_user=create_user,
    )
    modules = [
        Module.objects.create(
            name=f"Módulo {index}",
            project=report_project,
            workspace=workspace,
            stage=stage,
            created_by=create_user,
            sort_order=index,
        )
        for index in range(2)
    ]

    content = build_project_status_report_content(
        project=report_project,
        modules=modules,
        user=create_user,
        workspace_slug=workspace.slug,
        period_start=date(2026, 4, 13),
        period_end=date(2026, 4, 17),
    )

    assert content["schema_version"] == 3
    assert content["report_kind"] == "sprint"
    assert len(content["sections"]["entregas_sprint"]) == 2


@pytest.mark.django_db
def test_build_project_status_report_content_multi_module_kind(
    workspace,
    workspace_board,
    report_project,
    create_user,
):
    modules = [
        Module.objects.create(
            name=f"Módulo {index}",
            project=report_project,
            workspace=workspace,
            created_by=create_user,
            sort_order=index,
        )
        for index in range(2)
    ]

    content = build_project_status_report_content(
        project=report_project,
        modules=modules,
        user=create_user,
        workspace_slug=workspace.slug,
        period_start=date(2026, 4, 13),
        period_end=date(2026, 4, 17),
        report_kind="multi_module",
    )

    assert content["report_kind"] == "multi_module"
    assert "sprint" not in content["sections"]
    assert len(content["sections"]["entregas_sprint"]) == 2


def test_progress_average_from_entregas():
    entregas = [
        {"pct": "100", "mostrar_pct": True},
        {"pct": "50", "mostrar_pct": True},
        {"pct": "0", "mostrar_pct": False},
    ]
    assert progress_pct_from_entregas(entregas) == 75


def test_progress_average_from_sprint_rows():
    sprint_rows = [
        {"pct_total": "80"},
        {"pct_total": "40"},
    ]
    assert progress_pct_from_entregas(sprint_rows) == 60
