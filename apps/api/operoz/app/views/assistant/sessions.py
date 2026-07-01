import json
import os

from django.http import StreamingHttpResponse
from rest_framework import status
from rest_framework.renderers import BaseRenderer, JSONRenderer
from rest_framework.response import Response

from operoz.app.permissions import ROLE, allow_permission
from operoz.app.serializers.assistant import (
    AssistantChatJobSerializer,
    AssistantChatRequestSerializer,
    AssistantMessageFeedbackSerializer,
    AssistantMessageSerializer,
    AssistantQualityReviewReadSerializer,
    AssistantQualityReviewSerializer,
    AssistantSessionCreateSerializer,
    AssistantSessionSerializer,
    AssistantSessionUpdateSerializer,
)
from operoz.db.models import AssistantChatJob, AssistantMessage, AssistantQualityReview, AssistantSession, Workspace
from operoz.app.views.base import BaseAPIView
from operoz.assistant.chat_jobs import enqueue_chat_job_safe, iter_job_events, new_client_message_id
from operoz.assistant.service import AssistantServiceError, confirm_assistant_action, iter_chat_events, run_chat
from operoz.assistant.quality import get_assistant_quality_dashboard
from operoz.assistant.usage import get_usage_summary
from operoz.automation.quality import build_workspace_automation_quality


def _wants_async_chat(request, validated_data: dict) -> bool:
    if validated_data.get("sync") or request.query_params.get("sync") == "1":
        return False
    if validated_data.get("async_mode"):
        return True
    if (request.headers.get("X-Assistant-Async") or "").lower() in ("1", "true", "yes"):
        return True
    return os.environ.get("ASSISTANT_ASYNC_CHAT_DEFAULT", "0") == "1"


class ServerSentEventRenderer(BaseRenderer):
    """Permite Accept: text/event-stream no chat SSE (DRF content negotiation)."""

    media_type = "text/event-stream"
    format = "event-stream"
    charset = "utf-8"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data


def _service_error_response(exc: AssistantServiceError) -> Response:
    status_code = status.HTTP_429_TOO_MANY_REQUESTS if "rate_limit" in exc.code or exc.code == "llm_capacity" else status.HTTP_400_BAD_REQUEST
    if exc.code == "forbidden":
        status_code = status.HTTP_403_FORBIDDEN
    if exc.code in ("llm_not_configured", "llm_request_failed", "llm_connection_failed"):
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    response = Response({"error": exc.code, "message": exc.message}, status=status_code)
    if status_code == status.HTTP_429_TOO_MANY_REQUESTS and exc.retry_after:
        response["Retry-After"] = str(exc.retry_after)
    return response


class AssistantSessionListCreateEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        sessions = AssistantSession.objects.filter(
            workspace__slug=slug,
            user=request.user,
        ).order_by("-updated_at")[:50]
        return Response(AssistantSessionSerializer(sessions, many=True).data)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        ser = AssistantSessionCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        session = AssistantSession.objects.create(
            workspace=workspace,
            user=request.user,
            title=(data.get("title") or "")[:255],
            context=data.get("context") or {},
        )
        return Response(AssistantSessionSerializer(session).data, status=status.HTTP_201_CREATED)


class AssistantSessionDetailEndpoint(BaseAPIView):
    def _get_owned_session(self, slug: str, session_id: str) -> AssistantSession | None:
        return AssistantSession.objects.filter(
            pk=session_id,
            workspace__slug=slug,
            user=self.request.user,
        ).first()

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, session_id):
        session = self._get_owned_session(slug, session_id)
        if not session:
            return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(AssistantSessionSerializer(session).data)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def patch(self, request, slug, session_id):
        session = self._get_owned_session(slug, session_id)
        if not session:
            return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)

        ser = AssistantSessionUpdateSerializer(data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        if "title" in data:
            session.title = (data["title"] or "")[:255]
        if "context" in data:
            session.context = data["context"] or {}

        session.save(update_fields=["title", "context", "updated_at"])
        return Response(AssistantSessionSerializer(session).data)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def delete(self, request, slug, session_id):
        session = self._get_owned_session(slug, session_id)
        if not session:
            return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AssistantSessionMessagesEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, session_id):
        session = AssistantSession.objects.filter(
            pk=session_id,
            workspace__slug=slug,
            user=request.user,
        ).first()
        if not session:
            return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)

        messages = session.messages.order_by("created_at")
        visible = [
            message
            for message in messages
            if message.role != AssistantMessage.ROLE_TOOL
            and not (
                message.role == AssistantMessage.ROLE_ASSISTANT
                and not (message.content or "").strip()
            )
        ]
        return Response(AssistantMessageSerializer(visible, many=True).data)


class AssistantMessageFeedbackEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def patch(self, request, slug, session_id, message_id):
        session = AssistantSession.objects.filter(
            pk=session_id,
            workspace__slug=slug,
            user=request.user,
        ).first()
        if not session:
            return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)

        message = AssistantMessage.objects.filter(pk=message_id, session=session).first()
        if not message:
            return Response({"error": "Message not found"}, status=status.HTTP_404_NOT_FOUND)
        if message.role != AssistantMessage.ROLE_ASSISTANT:
            return Response({"error": "Only assistant messages accept feedback"}, status=status.HTTP_400_BAD_REQUEST)

        ser = AssistantMessageFeedbackSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        rating = ser.validated_data["rating"]

        from operoz.assistant.quality import adjust_feedback_daily

        metadata = dict(message.metadata or {})
        old_rating = metadata.get("feedback_rating")
        if rating == "clear":
            metadata.pop("feedback_rating", None)
            metadata.pop("feedback_at", None)
        else:
            from django.utils import timezone

            metadata["feedback_rating"] = rating
            metadata["feedback_at"] = timezone.now().isoformat()

        adjust_feedback_daily(
            session.workspace,
            old_rating=old_rating if old_rating in ("up", "down") else None,
            new_rating=None if rating == "clear" else rating,
        )
        message.metadata = metadata
        message.save(update_fields=["metadata", "updated_at"])
        return Response(AssistantMessageSerializer(message).data)


class AssistantSessionChatEndpoint(BaseAPIView):
    renderer_classes = [JSONRenderer, ServerSentEventRenderer]

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request, slug, session_id):
        session = AssistantSession.objects.filter(
            pk=session_id,
            workspace__slug=slug,
            user=request.user,
        ).first()
        if not session:
            return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)

        ser = AssistantChatRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        message = ser.validated_data["message"]

        accept = (request.headers.get("Accept") or "").lower()
        wants_stream = ser.validated_data.get("stream") or "text/event-stream" in accept
        use_async = _wants_async_chat(request, ser.validated_data)

        if use_async and wants_stream:
            client_message_id = (ser.validated_data.get("client_message_id") or "").strip()
            if not client_message_id:
                client_message_id = new_client_message_id()
            try:
                job = enqueue_chat_job_safe(
                    session,
                    user=request.user,
                    message=message,
                    client_message_id=client_message_id,
                )
            except AssistantServiceError as exc:
                return _service_error_response(exc)

            payload = AssistantChatJobSerializer(job).data
            payload["job_id"] = str(job.id)
            return Response(payload, status=status.HTTP_202_ACCEPTED)

        if wants_stream:

            def event_stream():
                for event in iter_chat_events(session, message, stream=True):
                    yield f"data: {json.dumps(event, default=str)}\n\n"

            response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
            response["Cache-Control"] = "no-cache"
            response["X-Accel-Buffering"] = "no"
            return response

        try:
            assistant_message = run_chat(session, message)
        except AssistantServiceError as exc:
            return _service_error_response(exc)

        return Response(
            {
                "message": AssistantMessageSerializer(assistant_message).data,
                "session": AssistantSessionSerializer(session).data,
            },
            status=status.HTTP_200_OK,
        )


class AssistantChatJobStreamEndpoint(BaseAPIView):
    renderer_classes = [ServerSentEventRenderer]

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, job_id):
        job = AssistantChatJob.objects.filter(
            pk=job_id,
            session__workspace__slug=slug,
            user=request.user,
        ).first()
        if not job:
            return Response({"error": "Job not found"}, status=status.HTTP_404_NOT_FOUND)

        last_event_id = request.headers.get("Last-Event-ID") or request.query_params.get("last_event_id") or "0-0"

        def event_stream():
            for event in iter_job_events(str(job.id), last_id=last_event_id):
                yield f"data: {json.dumps(event, default=str)}\n\n"

        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response


class AssistantConfirmActionEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, session_id):
        session = AssistantSession.objects.filter(
            pk=session_id,
            workspace__slug=slug,
            user=request.user,
        ).first()
        if not session:
            return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)

        proposal = request.data.get("proposal")
        if not isinstance(proposal, dict):
            return Response({"error": "proposal_required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = confirm_assistant_action(session, proposal)
        except AssistantServiceError as exc:
            return _service_error_response(exc)

        return Response({"ok": True, "result": result}, status=status.HTTP_200_OK)


class AssistantUsageEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        days = int(request.query_params.get("days", 7))
        return Response(get_usage_summary(workspace, days=min(max(days, 1), 30)))


class AssistantQualityEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        days = int(request.query_params.get("days", 7))
        days = min(max(days, 1), 30)
        return Response(
            {
                "assistant": get_assistant_quality_dashboard(workspace, days=days),
                "automation": build_workspace_automation_quality(workspace, days=days),
            }
        )


class AssistantQualityReviewEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        limit = min(max(int(request.query_params.get("limit", 20)), 1), 100)
        reviews = AssistantQualityReview.objects.filter(workspace=workspace).select_related("reviewer", "message")[
            :limit
        ]
        return Response(AssistantQualityReviewReadSerializer(reviews, many=True).data)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        ser = AssistantQualityReviewSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        message = None
        message_id = ser.validated_data.get("message_id")
        if message_id:
            message = AssistantMessage.objects.filter(pk=message_id, session__workspace=workspace).first()
            if not message:
                return Response({"error": "Message not found"}, status=status.HTTP_404_NOT_FOUND)

        review = AssistantQualityReview.objects.create(
            workspace=workspace,
            reviewer=request.user,
            message=message,
            verdict=ser.validated_data["verdict"],
            notes=ser.validated_data.get("notes") or "",
        )
        return Response(AssistantQualityReviewReadSerializer(review).data, status=status.HTTP_201_CREATED)
