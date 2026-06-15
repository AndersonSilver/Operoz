from __future__ import annotations

from datetime import timedelta
from unittest.mock import patch

import pytest
from django.utils import timezone

from operis.db.models import Notification, Page, PageReviewComment, PageReviewSession, Project, ProjectMember, ProjectPage
from operis.utils.page_review_notifications import (
    ENTITY_NAME,
    create_prd_review_resolved_notifications,
)


@pytest.mark.unit
@pytest.mark.django_db
class TestPageReviewNotifications:
    def _create_session(self, workspace, workspace_board, create_user):
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
        return session

    def test_notify_page_owner_on_approve(self, workspace, workspace_board, create_user):
        session = self._create_session(workspace, workspace_board, create_user)
        count = create_prd_review_resolved_notifications(
            session,
            actor_email="client@example.com",
            status=PageReviewSession.STATUS_APPROVED,
        )
        assert count == 1
        notification = Notification.objects.get(receiver=create_user, entity_name=ENTITY_NAME)
        assert "aprovou" in notification.message_stripped
        assert notification.data["url"].endswith(f"/pages/{session.page_id}")

    def test_notify_on_changes_requested(self, workspace, workspace_board, create_user):
        session = self._create_session(workspace, workspace_board, create_user)
        create_prd_review_resolved_notifications(
            session,
            actor_email="client@example.com",
            status=PageReviewSession.STATUS_CHANGES_REQUESTED,
        )
        notification = Notification.objects.get(receiver=create_user, entity_name=ENTITY_NAME)
        assert "feedback" in notification.message_stripped.lower()
