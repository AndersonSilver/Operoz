from __future__ import annotations

from datetime import timedelta
from unittest.mock import patch

import pytest
from django.utils import timezone
from rest_framework import status

from operoz.db.models import Page, PageReviewComment, PageReviewEvent, PageReviewInvite, PageReviewSession, Project, ProjectMember, ProjectPage


@pytest.mark.contract
@pytest.mark.django_db
class TestPrdReviewGuestAPI:
    def _setup_page(self, workspace, workspace_board, create_user):
        project = Project.objects.create(
            name="PRD Client",
            identifier="PRDC",
            workspace=workspace,
            board=workspace_board,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        page = Page.objects.create(
            name="PRD Doc",
            workspace=workspace,
            owned_by=create_user,
            description_html="<p>PRD content</p>",
        )
        ProjectPage.objects.create(project=project, page=page, workspace=workspace, created_by=create_user)
        session = PageReviewSession.objects.create(
            workspace=workspace,
            project=project,
            page=page,
            status=PageReviewSession.STATUS_SENT,
            sent_at=timezone.now(),
            created_by=create_user,
        )
        invite = PageReviewInvite.objects.create(
            session=session,
            email="client@example.com",
            expires_at=timezone.now() + timedelta(days=7),
            created_by=create_user,
        )
        return project, page, session, invite

    def test_guest_prd_review_valid_token(self, api_client, workspace, workspace_board, create_user, setup_instance):
        _, page, session, invite = self._setup_page(workspace, workspace_board, create_user)

        response = api_client.get(f"/api/guest/prd-review/{invite.token}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["page"]["id"] == str(page.id)
        assert response.data["session"]["id"] == str(session.id)
        assert response.data["guest_email"] == "client@example.com"

    def test_guest_prd_review_expired(self, api_client, workspace, workspace_board, create_user, setup_instance):
        _, _, _, invite = self._setup_page(workspace, workspace_board, create_user)
        invite.expires_at = timezone.now() - timedelta(hours=1)
        invite.save(update_fields=["expires_at"])

        response = api_client.get(f"/api/guest/prd-review/{invite.token}/")
        assert response.status_code == status.HTTP_410_GONE

    def test_guest_submit_approve_without_comments(
        self, api_client, workspace, workspace_board, create_user, setup_instance
    ):
        _, _, session, invite = self._setup_page(workspace, workspace_board, create_user)

        response = api_client.post(
            f"/api/guest/prd-review/{invite.token}/submit/",
            {"action": "approve"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        session.refresh_from_db()
        assert session.status == PageReviewSession.STATUS_APPROVED

    def test_guest_submit_feedback_with_comment(
        self, api_client, workspace, workspace_board, create_user, setup_instance
    ):
        _, _, session, invite = self._setup_page(workspace, workspace_board, create_user)

        comment_response = api_client.post(
            f"/api/guest/prd-review/{invite.token}/comments/",
            {
                "type": "section",
                "section_id": "sec-1",
                "body": "Ajustar escopo",
            },
            format="json",
        )
        assert comment_response.status_code == status.HTTP_201_CREATED

        submit_response = api_client.post(
            f"/api/guest/prd-review/{invite.token}/submit/",
            {"action": "feedback"},
            format="json",
        )
        assert submit_response.status_code == status.HTTP_200_OK
        session.refresh_from_db()
        assert session.status == PageReviewSession.STATUS_CHANGES_REQUESTED
        assert PageReviewComment.objects.filter(session=session).count() == 1

    def test_guest_cannot_approve_with_comments(
        self, api_client, workspace, workspace_board, create_user, setup_instance
    ):
        _, _, session, invite = self._setup_page(workspace, workspace_board, create_user)
        PageReviewComment.objects.create(
            session=session,
            comment_type=PageReviewComment.TYPE_SECTION,
            section_id="sec-1",
            body="Needs change",
            author_email=invite.email,
            created_by=create_user,
        )

        response = api_client.post(
            f"/api/guest/prd-review/{invite.token}/submit/",
            {"action": "approve"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @patch("operoz.bgtasks.prd_review_submit_notify_task.prd_review_submit_notify.delay")
    def test_guest_submit_approve_queues_notification(
        self, mock_notify, api_client, workspace, workspace_board, create_user, setup_instance
    ):
        _, _, session, invite = self._setup_page(workspace, workspace_board, create_user)

        response = api_client.post(
            f"/api/guest/prd-review/{invite.token}/submit/",
            {"action": "approve"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        mock_notify.assert_called_once_with(str(session.id), invite.email, PageReviewSession.STATUS_APPROVED)

    def test_guest_inline_comment(
        self, api_client, workspace, workspace_board, create_user, setup_instance
    ):
        _, _, session, invite = self._setup_page(workspace, workspace_board, create_user)

        response = api_client.post(
            f"/api/guest/prd-review/{invite.token}/comments/",
            {
                "type": "inline",
                "section_id": "sec-1",
                "body": "Ajustar este trecho",
                "quote": "Texto selecionado pelo cliente",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.data["inline_comments"]) == 1
        comment = PageReviewComment.objects.get(session=session, comment_type=PageReviewComment.TYPE_INLINE)
        assert comment.quote == "Texto selecionado pelo cliente"
        assert comment.body == "Ajustar este trecho"

    def test_guest_delete_comment(
        self, api_client, workspace, workspace_board, create_user, setup_instance
    ):
        _, _, session, invite = self._setup_page(workspace, workspace_board, create_user)
        comment = PageReviewComment.objects.create(
            session=session,
            comment_type=PageReviewComment.TYPE_SECTION,
            section_id="sec-1",
            body="To delete",
            author_email=invite.email,
            created_by=create_user,
        )

        response = api_client.post(
            f"/api/guest/prd-review/{invite.token}/comments/",
            {"delete": True, "comment_id": str(comment.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["deleted"] is True
        assert not PageReviewComment.objects.filter(pk=comment.id).exists()

    def test_guest_render_html_includes_sdk(
        self, api_client, workspace, workspace_board, create_user, setup_instance
    ):
        _, _, _, invite = self._setup_page(workspace, workspace_board, create_user)

        response = api_client.get(f"/api/guest/prd-review/{invite.token}/")
        assert response.status_code == status.HTTP_200_OK
        render_html = response.data["page"]["render_html"]
        assert "initPrdReview" in render_html
        assert invite.token in render_html
        assert "OperozPrdStorageApi" in render_html

    @patch("operoz.assistant.page_content.read_html_document_asset_html")
    def test_guest_render_html_embed_from_json_has_substantive_content(
        self, mock_read_html, api_client, workspace, workspace_board, create_user, setup_instance
    ):
        prd_html = (
            "<!DOCTYPE html><html><body><header>Tech4Humans</header>"
            "<main>" + ("Magalu PRD section " * 80) + "</main>"
            "<script>if (window.initApprovalAndComments) window.initApprovalAndComments();</script>"
            "</body></html>"
        )
        mock_read_html.return_value = prd_html

        _, page, _, invite = self._setup_page(workspace, workspace_board, create_user)
        page.description_html = '<p class="editor-paragraph-block"></p>'
        page.description_json = {
            "type": "doc",
            "content": [
                {
                    "type": "htmlDocumentEmbed",
                    "attrs": {"src": "asset-prd-magalu", "title": "PRD Magalu"},
                }
            ],
        }
        page.save(update_fields=["description_html", "description_json"])

        response = api_client.get(f"/api/guest/prd-review/{invite.token}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["page"]["render_mode"] == "html_embed"
        render_html = response.data["page"]["render_html"]
        assert "Tech4Humans" in render_html
        assert len(render_html) > 1000
        assert "initPrdReview" in render_html
        mock_read_html.assert_called_once_with("asset-prd-magalu")


@pytest.mark.contract
@pytest.mark.django_db
class TestPrdReviewWorkspaceAPI:
    def test_create_session_and_invites(
        self,
        session_client,
        workspace,
        workspace_board,
        create_user,
        setup_instance,
    ):
        project = Project.objects.create(
            name="PRD WS",
            identifier="PRWS",
            workspace=workspace,
            board=workspace_board,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        page = Page.objects.create(
            name="PRD",
            workspace=workspace,
            owned_by=create_user,
            description_html="<p>Body</p>",
        )
        ProjectPage.objects.create(project=project, page=page, workspace=workspace, created_by=create_user)

        session_response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/pages/{page.id}/review-sessions/",
            {"send": True},
            format="json",
        )
        assert session_response.status_code == status.HTTP_201_CREATED
        session_id = session_response.data["id"]
        assert session_response.data["status"] == PageReviewSession.STATUS_SENT

        invite_response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/pages/{page.id}/review-sessions/{session_id}/invites/",
            {"emails": ["stakeholder@client.com"], "expires_in_days": 14},
            format="json",
        )
        assert invite_response.status_code == status.HTTP_201_CREATED
        invite_url = invite_response.data[0]["url"]
        assert invite_url.endswith(invite_response.data[0]["token"])
        assert "/guest/prd-review/" in invite_url

        detail_response = session_client.get(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/pages/{page.id}/review-sessions/{session_id}/"
        )
        assert detail_response.status_code == status.HTTP_200_OK
        assert len(detail_response.data["invites"]) >= 1

    def test_new_review_round_after_approval_snapshots_version(
        self,
        session_client,
        workspace,
        workspace_board,
        create_user,
        setup_instance,
    ):
        from operoz.db.models import PageVersion

        project = Project.objects.create(
            name="PRD Round",
            identifier="PRRD",
            workspace=workspace,
            board=workspace_board,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        page = Page.objects.create(
            name="PRD v1",
            workspace=workspace,
            owned_by=create_user,
            description_html="<p>Version 1</p>",
        )
        ProjectPage.objects.create(project=project, page=page, workspace=workspace, created_by=create_user)

        first = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/pages/{page.id}/review-sessions/",
            {"send": True},
            format="json",
        )
        assert first.status_code == status.HTTP_201_CREATED
        first_id = first.data["id"]

        PageReviewSession.objects.filter(pk=first_id).update(
            status=PageReviewSession.STATUS_APPROVED,
            resolved_at=timezone.now(),
        )

        page.description_html = "<p>Version 2 corrected</p>"
        page.save(update_fields=["description_html"])

        second = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/pages/{page.id}/review-sessions/",
            {
                "send": True,
                "snapshot_version": True,
                "previous_session_id": first_id,
            },
            format="json",
        )
        assert second.status_code == status.HTTP_201_CREATED
        assert second.data["status"] == PageReviewSession.STATUS_SENT
        assert second.data["page_version_id"] is not None

        version = PageVersion.objects.get(pk=second.data["page_version_id"])
        assert version.description_html == "<p>Version 2 corrected</p>"

        events = PageReviewEvent.objects.filter(
            session_id=second.data["id"],
            event_type=PageReviewEvent.EVENT_SESSION_SENT,
        )
        assert events.count() == 1
        assert events.first().payload.get("via") == "new_round"
        assert events.first().payload.get("previous_session_id") == first_id

    def test_workspace_prd_review_inbox_and_metrics(
        self,
        session_client,
        workspace,
        workspace_board,
        create_user,
        setup_instance,
    ):
        project = Project.objects.create(
            name="PRD Inbox",
            identifier="PRIN",
            workspace=workspace,
            board=workspace_board,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        page = Page.objects.create(
            name="PRD Inbox Doc",
            workspace=workspace,
            owned_by=create_user,
            description_html="<p>Body</p>",
        )
        ProjectPage.objects.create(project=project, page=page, workspace=workspace, created_by=create_user)
        PageReviewSession.objects.create(
            workspace=workspace,
            project=project,
            page=page,
            status=PageReviewSession.STATUS_CHANGES_REQUESTED,
            sent_at=timezone.now(),
            created_by=create_user,
        )

        inbox = session_client.get(f"/api/workspaces/{workspace.slug}/prd-review-inbox/")
        assert inbox.status_code == status.HTTP_200_OK
        assert inbox.data["count"] >= 1
        assert inbox.data["items"][0]["page_name"] == "PRD Inbox Doc"

        metrics = session_client.get(f"/api/workspaces/{workspace.slug}/prd-review-metrics/")
        assert metrics.status_code == status.HTTP_200_OK
        assert metrics.data["total_sessions"] >= 1
        assert "by_status" in metrics.data

    def test_sync_review_comments_to_issue(
        self,
        session_client,
        workspace,
        workspace_board,
        create_user,
        setup_instance,
    ):
        from operoz.db.models import Issue, IssueComment, State

        project = Project.objects.create(
            name="PRD Sync",
            identifier="PRSY",
            workspace=workspace,
            board=workspace_board,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        page = Page.objects.create(
            name="PRD Sync Doc",
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
            sent_at=timezone.now(),
            resolved_at=timezone.now(),
            created_by=create_user,
        )
        comment = PageReviewComment.objects.create(
            session=session,
            comment_type=PageReviewComment.TYPE_SECTION,
            section_id="sec-scope",
            body="Ajustar escopo",
            author_email="client@example.com",
            created_by=create_user,
        )
        state = State.objects.filter(project=project).first()
        issue = Issue.objects.create(
            name="Epic PRD",
            project=project,
            workspace=workspace,
            state=state,
            created_by=create_user,
        )

        first = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/pages/{page.id}/review-sessions/{session.id}/sync-to-issue/",
            {"issue_id": str(issue.id)},
            format="json",
        )
        assert first.status_code == status.HTTP_201_CREATED
        assert first.data["synced_count"] == 1
        assert IssueComment.objects.filter(issue=issue).count() == 1

        second = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/pages/{page.id}/review-sessions/{session.id}/sync-to-issue/",
            {"issue_id": str(issue.id)},
            format="json",
        )
        assert second.status_code == status.HTTP_201_CREATED
        assert second.data["synced_count"] == 0
        assert second.data["skipped_count"] == 1
        assert IssueComment.objects.filter(issue=issue).count() == 1

    def test_guest_cannot_create_review_session(
        self,
        session_client,
        workspace,
        workspace_board,
        create_user,
        setup_instance,
    ):
        from operoz.db.models import User

        guest_user = User.objects.create(email="guest@test.com", username="guest@test.com")
        project = Project.objects.create(
            name="PRD RBAC",
            identifier="PRRB",
            workspace=workspace,
            board=workspace_board,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        ProjectMember.objects.create(project=project, member=guest_user, role=5, is_active=True)
        page = Page.objects.create(
            name="PRD RBAC Doc",
            workspace=workspace,
            owned_by=create_user,
            description_html="<p>Body</p>",
        )
        ProjectPage.objects.create(project=project, page=page, workspace=workspace, created_by=create_user)

        session_client.force_authenticate(user=guest_user)
        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/pages/{page.id}/review-sessions/",
            {"send": True},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_session_detail_includes_page_version(
        self,
        session_client,
        workspace,
        workspace_board,
        create_user,
        setup_instance,
    ):
        from operoz.db.models import PageVersion

        project = Project.objects.create(
            name="PRD Version",
            identifier="PRVR",
            workspace=workspace,
            board=workspace_board,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        page = Page.objects.create(
            name="PRD Version Doc",
            workspace=workspace,
            owned_by=create_user,
            description_html="<p>V1</p>",
        )
        ProjectPage.objects.create(project=project, page=page, workspace=workspace, created_by=create_user)
        version = PageVersion.objects.create(
            workspace=workspace,
            page=page,
            owned_by=create_user,
            description_html="<p>V1 snapshot</p>",
        )
        session = PageReviewSession.objects.create(
            workspace=workspace,
            project=project,
            page=page,
            page_version=version,
            status=PageReviewSession.STATUS_SENT,
            sent_at=timezone.now(),
            created_by=create_user,
        )

        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/pages/{page.id}/review-sessions/{session.id}/"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["page_version_id"] == str(version.id)
        assert response.data["page_version"]["id"] == str(version.id)

    def test_export_review_session_pdf(
        self,
        session_client,
        workspace,
        workspace_board,
        create_user,
        setup_instance,
    ):
        project = Project.objects.create(
            name="PRD Export",
            identifier="PREX",
            workspace=workspace,
            board=workspace_board,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        page = Page.objects.create(
            name="PRD Export Doc",
            workspace=workspace,
            owned_by=create_user,
            description_html="<p>Export body</p>",
        )
        ProjectPage.objects.create(project=project, page=page, workspace=workspace, created_by=create_user)
        session = PageReviewSession.objects.create(
            workspace=workspace,
            project=project,
            page=page,
            status=PageReviewSession.STATUS_SENT,
            sent_at=timezone.now(),
            created_by=create_user,
        )
        PageReviewComment.objects.create(
            session=session,
            comment_type=PageReviewComment.TYPE_INLINE,
            section_id="intro",
            quote="Trecho citado",
            body="Comentário do cliente",
            author_email="cliente@example.com",
        )

        with_comments = session_client.get(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/pages/{page.id}/review-sessions/{session.id}/export/",
            {"include_comments": "true"},
        )
        assert with_comments.status_code == status.HTTP_200_OK
        disposition = with_comments["Content-Disposition"]
        assert "filename=" in disposition
        assert "prd-review-" in disposition
        content_type = with_comments["Content-Type"]
        assert "pdf" in content_type or "html" in content_type
        body = with_comments.content
        if "pdf" in content_type:
            assert body[:4] == b"%PDF"
        else:
            assert "Comentário do cliente".encode() in body
            assert with_comments.get("X-Prd-Review-Pdf-Fallback") == "html-print"

        without_comments = session_client.get(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/pages/{page.id}/review-sessions/{session.id}/export/",
            {"include_comments": "false"},
        )
        assert without_comments.status_code == status.HTTP_200_OK
        if "html" in without_comments["Content-Type"]:
            assert "Comentário do cliente".encode() not in without_comments.content
        assert b"Export body" in without_comments.content or b"Export" in without_comments.content
