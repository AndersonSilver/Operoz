from __future__ import annotations

import pytest

from operis.assistant.tools.handlers import handle_get_prd_review_summary
from operis.assistant.types import AssistantActorContext
from operis.db.models import Page, PageReviewComment, PageReviewSession, Project, ProjectMember, ProjectPage, Workspace


@pytest.mark.unit
@pytest.mark.django_db
class TestGetPrdReviewSummaryTool:
    def test_returns_comments_with_citations(self, create_user, workspace, workspace_board):
        project = Project.objects.create(
            name="PRD Tool",
            identifier="PRTL",
            workspace=workspace,
            board=workspace_board,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        page = Page.objects.create(
            name="PRD Tool Doc",
            workspace=workspace,
            owned_by=create_user,
            description_html="<p>Body</p>",
        )
        ProjectPage.objects.create(project=project, page=page, workspace=workspace, created_by=create_user)
        session = PageReviewSession.objects.create(
            workspace=workspace,
            project=project,
            page=page,
            status=PageReviewSession.STATUS_CHANGES_REQUESTED,
            created_by=create_user,
        )
        PageReviewComment.objects.create(
            session=session,
            comment_type=PageReviewComment.TYPE_INLINE,
            section_id="sec-1",
            quote="Trecho citado",
            body="Pedido de ajuste",
            author_email="client@example.com",
            created_by=create_user,
        )

        ctx = AssistantActorContext(
            user=create_user,
            workspace=workspace,
            board_slug=workspace_board.slug,
            project_id=str(project.id),
        )
        result = handle_get_prd_review_summary(ctx, {"session_id": str(session.id)})
        assert result.ok is True
        assert result.data["comment_count"] == 1
        assert result.data["comments"][0]["quote"] == "Trecho citado"
        assert len(result.citations) == 1

    def test_forbidden_for_non_member(self, create_user, workspace, workspace_board):
        from operis.db.models import User

        other = User.objects.create(email="other@test.com", username="other@test.com")
        project = Project.objects.create(
            name="PRD Forbidden",
            identifier="PRFB",
            workspace=workspace,
            board=workspace_board,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        page = Page.objects.create(name="Doc", workspace=workspace, owned_by=create_user)
        session = PageReviewSession.objects.create(
            workspace=workspace,
            project=project,
            page=page,
            status=PageReviewSession.STATUS_SENT,
            created_by=create_user,
        )

        ctx = AssistantActorContext(user=other, workspace=workspace, board_slug=workspace_board.slug)
        result = handle_get_prd_review_summary(ctx, {"session_id": str(session.id)})
        assert result.ok is False
        assert result.error == "review_session_not_found"
