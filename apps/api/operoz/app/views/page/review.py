from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions.page_review import PageReviewPermission
from operoz.app.views.base import BaseAPIView
from operoz.db.models import Issue, PageReviewComment, PageReviewEvent, PageReviewInvite, PageReviewSession, PageVersion
from operoz.utils.page_review_guest import (
    create_page_version_snapshot,
    create_review_invites,
    get_accessible_project,
    get_project_page,
    parse_prd_review_ttl_days,
    serialize_review_invite,
    serialize_review_session,
)
from operoz.utils.page_review_sync import sync_review_comments_to_issue, user_can_sync_review
from operoz.utils.page_review_export import export_review_session_pdf, safe_export_filename


class PageReviewSessionListCreateEndpoint(BaseAPIView):
    permission_classes = [PageReviewPermission]

    def get(self, request, slug, project_id, page_id):
        page = get_project_page(slug, project_id, page_id)
        if not page:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)

        sessions = (
            PageReviewSession.objects.filter(page=page, project_id=project_id)
            .order_by("-created_at")[:50]
        )
        return Response([serialize_review_session(s) for s in sessions], status=status.HTTP_200_OK)

    def post(self, request, slug, project_id, page_id):
        project = get_accessible_project(slug, project_id, request.user)
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        page = get_project_page(slug, project_id, page_id)
        if not page:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)

        page_version = None
        page_version_id = request.data.get("page_version_id")
        if page_version_id:
            page_version = PageVersion.objects.filter(pk=page_version_id, page=page).first()
            if not page_version:
                return Response({"error": "Page version not found"}, status=status.HTTP_404_NOT_FOUND)
        elif bool(request.data.get("snapshot_version")):
            page_version = create_page_version_snapshot(page, request.user)

        mark_sent = bool(request.data.get("send"))
        previous_session_id = (request.data.get("previous_session_id") or "").strip() or None
        session = PageReviewSession.objects.create(
            workspace=project.workspace,
            project=project,
            page=page,
            page_version=page_version,
            status=PageReviewSession.STATUS_SENT if mark_sent else PageReviewSession.STATUS_DRAFT,
            sent_at=timezone.now() if mark_sent else None,
            created_by=request.user,
        )
        if mark_sent:
            payload = {}
            if previous_session_id:
                payload["previous_session_id"] = previous_session_id
            if page_version:
                payload["page_version_id"] = str(page_version.id)
            if bool(request.data.get("snapshot_version")):
                payload["via"] = "new_round"
            PageReviewEvent.objects.create(
                session=session,
                event_type=PageReviewEvent.EVENT_SESSION_SENT,
                payload=payload,
            )

        return Response(serialize_review_session(session), status=status.HTTP_201_CREATED)


class PageReviewSessionDetailEndpoint(BaseAPIView):
    permission_classes = [PageReviewPermission]

    def get(self, request, slug, project_id, page_id, session_id):
        session = (
            PageReviewSession.objects.filter(
                pk=session_id,
                page_id=page_id,
                project_id=project_id,
                workspace__slug=slug,
            )
            .select_related("page_version")
            .first()
        )
        if not session:
            return Response({"error": "Review session not found"}, status=status.HTTP_404_NOT_FOUND)

        comments = [
            {
                "id": str(c.id),
                "type": c.comment_type,
                "section_id": c.section_id,
                "quote": c.quote,
                "anchor": c.anchor,
                "body": c.body,
                "author_email": c.author_email,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in PageReviewComment.objects.filter(session=session).order_by("created_at")
        ]
        events = [
            {
                "id": str(e.id),
                "event_type": e.event_type,
                "actor_email": e.actor_email,
                "payload": e.payload,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in PageReviewEvent.objects.filter(session=session).order_by("created_at")
        ]
        invites = [
            serialize_review_invite(i)
            for i in PageReviewInvite.objects.filter(session=session).order_by("-created_at")
        ]

        payload = serialize_review_session(session)
        payload["comments"] = comments
        payload["events"] = events
        payload["invites"] = invites
        return Response(payload, status=status.HTTP_200_OK)


class PageReviewInviteCreateEndpoint(BaseAPIView):
    permission_classes = [PageReviewPermission]

    def post(self, request, slug, project_id, page_id, session_id):
        session = PageReviewSession.objects.filter(
            pk=session_id,
            page_id=page_id,
            project_id=project_id,
            workspace__slug=slug,
        ).first()
        if not session:
            return Response({"error": "Review session not found"}, status=status.HTTP_404_NOT_FOUND)

        raw_emails = request.data.get("emails") or []
        if not isinstance(raw_emails, list) or not raw_emails:
            return Response({"error": "emails must be a non-empty list"}, status=status.HTTP_400_BAD_REQUEST)

        ttl_days, ttl_err = parse_prd_review_ttl_days(request.data.get("expires_in_days"))
        if ttl_err:
            return Response({"error": ttl_err}, status=status.HTTP_400_BAD_REQUEST)

        invites = create_review_invites(
            session,
            raw_emails,
            ttl_days,
            created_by=request.user,
        )
        if session.status == PageReviewSession.STATUS_DRAFT:
            session.status = PageReviewSession.STATUS_SENT
            session.sent_at = timezone.now()
            session.save(update_fields=["status", "sent_at", "updated_at"])
            PageReviewEvent.objects.create(
                session=session,
                event_type=PageReviewEvent.EVENT_SESSION_SENT,
                payload={"via": "invites"},
            )

        send_email = request.data.get("send_email", True)
        if send_email is not False:
            from operoz.bgtasks.prd_review_invite_task import prd_review_invite_email
            from operoz.utils.host import base_host

            current_site = base_host(request=request, is_app=True)
            for invite in invites:
                prd_review_invite_email.delay(str(invite.id), current_site)

        return Response([serialize_review_invite(i) for i in invites], status=status.HTTP_201_CREATED)


class PageReviewSessionSyncToIssueEndpoint(BaseAPIView):
    permission_classes = [PageReviewPermission]

    def post(self, request, slug, project_id, page_id, session_id):
        session = (
            PageReviewSession.objects.filter(
                pk=session_id,
                page_id=page_id,
                project_id=project_id,
                workspace__slug=slug,
            )
            .select_related("page", "project", "workspace")
            .first()
        )
        if not session:
            return Response({"error": "Review session not found"}, status=status.HTTP_404_NOT_FOUND)

        if not user_can_sync_review(request.user, session):
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        issue_id = (request.data.get("issue_id") or "").strip()
        if not issue_id:
            return Response({"error": "issue_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        issue = Issue.issue_objects.filter(
            pk=issue_id,
            project_id=project_id,
            workspace__slug=slug,
        ).first()
        if not issue:
            return Response({"error": "Issue not found"}, status=status.HTTP_404_NOT_FOUND)

        result = sync_review_comments_to_issue(session, issue, actor=request.user, request=request)
        if not result.get("ok"):
            return Response({"error": result.get("error", "sync_failed")}, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_201_CREATED)


class PageReviewSessionExportEndpoint(BaseAPIView):
    permission_classes = [PageReviewPermission]

    def get(self, request, slug, project_id, page_id, session_id):
        session = (
            PageReviewSession.objects.filter(
                pk=session_id,
                page_id=page_id,
                project_id=project_id,
                workspace__slug=slug,
            )
            .select_related("page", "page_version")
            .first()
        )
        if not session:
            return Response({"error": "Review session not found"}, status=status.HTTP_404_NOT_FOUND)

        include_comments = (request.query_params.get("include_comments") or "true").lower() not in {
            "0",
            "false",
            "no",
        }
        pdf_bytes, html_document = export_review_session_pdf(session, include_comments=include_comments)
        base_name = safe_export_filename(session.page.name)

        if pdf_bytes:
            response = HttpResponse(pdf_bytes, content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="{base_name}.pdf"'
            return response

        response = HttpResponse(html_document, content_type="text/html; charset=utf-8")
        response["Content-Disposition"] = f'inline; filename="{base_name}-print.html"'
        response["X-Prd-Review-Pdf-Fallback"] = "html-print"
        return response
