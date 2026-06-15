from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from operis.app.views.base import BaseAPIView
from operis.db.models import PageReviewComment, PageReviewEvent, PageReviewSession
from operis.utils.page_review_guest import (
    build_guest_prd_review_payload,
    log_prd_review_access,
    resolve_prd_review_invite,
    session_has_comments,
)


class PrdReviewGuestPublicEndpoint(BaseAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, token):
        invite, error_payload, error_status = resolve_prd_review_invite(token)
        if not invite:
            return Response(error_payload, status=error_status)

        log_prd_review_access(invite, request)
        return Response(build_guest_prd_review_payload(invite), status=status.HTTP_200_OK)


class PrdReviewGuestCommentEndpoint(BaseAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, token):
        invite, error_payload, error_status = resolve_prd_review_invite(token)
        if not invite:
            return Response(error_payload, status=error_status)

        session = invite.session
        if session.status in {PageReviewSession.STATUS_APPROVED, PageReviewSession.STATUS_CHANGES_REQUESTED}:
            return Response({"error": "Review session is closed"}, status=status.HTTP_409_CONFLICT)

        if request.data.get("delete"):
            comment_id = request.data.get("comment_id")
            if not comment_id:
                return Response({"error": "comment_id is required for delete"}, status=status.HTTP_400_BAD_REQUEST)
            comment = PageReviewComment.objects.filter(
                pk=comment_id,
                session=session,
                author_email=invite.email,
            ).first()
            if not comment:
                return Response({"error": "Comment not found"}, status=status.HTTP_404_NOT_FOUND)
            comment.delete()
            PageReviewEvent.objects.create(
                session=session,
                event_type=PageReviewEvent.EVENT_COMMENTED,
                actor_email=invite.email,
                payload={"comment_id": str(comment_id), "deleted": True},
            )
            payload = build_guest_prd_review_payload(invite)
            return Response(
                {
                    "deleted": True,
                    "comment_id": str(comment_id),
                    "section_comments": payload["section_comments"],
                    "inline_comments": payload["inline_comments"],
                },
                status=status.HTTP_200_OK,
            )

        comment_type = (request.data.get("type") or PageReviewComment.TYPE_SECTION).strip()
        if comment_type not in {PageReviewComment.TYPE_SECTION, PageReviewComment.TYPE_INLINE}:
            return Response({"error": "type must be section or inline"}, status=status.HTTP_400_BAD_REQUEST)

        section_id = (request.data.get("section_id") or "").strip()
        body = (request.data.get("body") or request.data.get("text") or "").strip()
        if not section_id or not body:
            return Response({"error": "section_id and body are required"}, status=status.HTTP_400_BAD_REQUEST)

        quote = (request.data.get("quote") or "").strip()
        anchor = request.data.get("anchor") if isinstance(request.data.get("anchor"), dict) else {}

        comment_id = request.data.get("comment_id")
        if comment_id:
            comment = PageReviewComment.objects.filter(pk=comment_id, session=session, author_email=invite.email).first()
            if not comment:
                return Response({"error": "Comment not found"}, status=status.HTTP_404_NOT_FOUND)
            comment.body = body
            comment.quote = quote
            comment.anchor = anchor
            comment.section_id = section_id
            comment.save(update_fields=["body", "quote", "anchor", "section_id", "updated_at"])
        elif comment_type == PageReviewComment.TYPE_SECTION:
            comment, _created = PageReviewComment.objects.update_or_create(
                session=session,
                comment_type=PageReviewComment.TYPE_SECTION,
                section_id=section_id,
                author_email=invite.email,
                defaults={"body": body, "quote": quote, "anchor": anchor},
            )
        else:
            comment = PageReviewComment.objects.create(
                session=session,
                comment_type=PageReviewComment.TYPE_INLINE,
                section_id=section_id,
                quote=quote,
                anchor=anchor,
                body=body,
                author_email=invite.email,
            )

        PageReviewEvent.objects.create(
            session=session,
            event_type=PageReviewEvent.EVENT_COMMENTED,
            actor_email=invite.email,
            payload={"comment_id": str(comment.id), "type": comment_type},
        )

        payload = build_guest_prd_review_payload(invite)
        return Response(
            {
                "comment_id": str(comment.id),
                "section_comments": payload["section_comments"],
                "inline_comments": payload["inline_comments"],
            },
            status=status.HTTP_201_CREATED,
        )


class PrdReviewGuestSubmitEndpoint(BaseAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, token):
        invite, error_payload, error_status = resolve_prd_review_invite(token)
        if not invite:
            return Response(error_payload, status=error_status)

        session = invite.session
        if session.status in {PageReviewSession.STATUS_APPROVED, PageReviewSession.STATUS_CHANGES_REQUESTED}:
            return Response({"error": "Review session already resolved"}, status=status.HTTP_409_CONFLICT)

        action = (request.data.get("action") or "").strip().lower()
        if action not in {"approve", "feedback"}:
            return Response({"error": "action must be approve or feedback"}, status=status.HTTP_400_BAD_REQUEST)

        has_comments = session_has_comments(session)
        if action == "approve" and has_comments:
            return Response(
                {"error": "Cannot approve while comments exist; use feedback action"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if action == "feedback" and not has_comments:
            return Response(
                {"error": "Add comments before submitting feedback"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        if action == "approve":
            session.status = PageReviewSession.STATUS_APPROVED
            event_type = PageReviewEvent.EVENT_APPROVED
        else:
            session.status = PageReviewSession.STATUS_CHANGES_REQUESTED
            event_type = PageReviewEvent.EVENT_FEEDBACK_SUBMITTED

        session.resolved_at = now
        session.save(update_fields=["status", "resolved_at", "updated_at"])

        PageReviewEvent.objects.create(
            session=session,
            event_type=event_type,
            actor_email=invite.email,
            payload={"summary": request.data.get("summary") or ""},
        )

        from operis.bgtasks.prd_review_submit_notify_task import prd_review_submit_notify

        prd_review_submit_notify.delay(str(session.id), invite.email, session.status)

        if session.status == PageReviewSession.STATUS_CHANGES_REQUESTED:
            from operis.automation.prd_review_hooks import emit_prd_review_feedback_submitted

            emit_prd_review_feedback_submitted(session, actor_email=invite.email)

        return Response(
            {
                "status": session.status,
                "resolved_at": session.resolved_at.isoformat(),
            },
            status=status.HTTP_200_OK,
        )
