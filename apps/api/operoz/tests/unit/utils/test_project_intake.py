import pytest

from operoz.db.models import Intake, Project
from operoz.utils.project_intake import get_or_create_default_project_intake


@pytest.mark.django_db
class TestGetOrCreateDefaultProjectIntake:
    def test_creates_default_intake_when_missing(self, workspace, workspace_board):
        project = Project.objects.create(
            name="Porto Vida",
            identifier="PORTO",
            workspace=workspace,
            board=workspace_board,
            intake_view=True,
            support_view=True,
        )

        assert Intake.objects.filter(project=project).count() == 0

        intake = get_or_create_default_project_intake(project)

        assert intake.is_default is True
        assert intake.name == "Porto Vida Intake"
        assert Intake.objects.filter(project=project).count() == 1

    def test_returns_existing_default_intake(self, workspace, workspace_board):
        project = Project.objects.create(
            name="Porto Vida",
            identifier="PORTO2",
            workspace=workspace,
            board=workspace_board,
        )
        existing = Intake.objects.create(
            name="Existing Intake",
            project=project,
            is_default=True,
        )

        intake = get_or_create_default_project_intake(project)

        assert intake.id == existing.id
        assert Intake.objects.filter(project=project).count() == 1

    def test_promotes_existing_non_default_intake(self, workspace, workspace_board):
        project = Project.objects.create(
            name="Porto Vida",
            identifier="PORTO3",
            workspace=workspace,
            board=workspace_board,
        )
        existing = Intake.objects.create(
            name="Legacy Intake",
            project=project,
            is_default=False,
        )

        intake = get_or_create_default_project_intake(project)

        existing.refresh_from_db()
        assert intake.id == existing.id
        assert existing.is_default is True
