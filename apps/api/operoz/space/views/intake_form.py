import uuid

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from operoz.authentication.session import BaseSessionAuthentication
from operoz.app.serializers.intake_form import IntakeFormPublicSerializer
from operoz.app.serializers.board_intake_form import BoardIntakeFormPublicSerializer
from operoz.app.views.asset.v2 import normalize_upload_mime_type
from operoz.bgtasks.storage_metadata_task import get_asset_object_metadata
from operoz.db.models import BoardIntakeForm, FileAsset, IntakeForm
from operoz.settings.storage import S3Storage
from operoz.utils.intake_submission import IntakeSubmissionError, submit_intake_form
from operoz.utils.board_intake_submission import (
    board_intake_client_queryset,
    serialize_board_intake_clients,
    submit_board_intake_form,
)
from operoz.utils.path_validator import sanitize_filename


def _client_ip(request) -> str | None:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _resolve_public_form(anchor: str):
    board_form = (
        BoardIntakeForm.objects.select_related("board", "workspace", "board__support_sla_policy")
        .filter(anchor=anchor, is_published=True, deleted_at__isnull=True)
        .first()
    )
    if board_form is not None:
        return "board", board_form

    project_form = (
        IntakeForm.objects.select_related("project")
        .filter(anchor=anchor, is_published=True, deleted_at__isnull=True)
        .first()
    )
    if project_form is not None and project_form.project.intake_view:
        return "project", project_form

    return None, None


def _get_published_intake_form(anchor: str) -> IntakeForm:
    form = IntakeForm.objects.select_related("project").get(anchor=anchor, is_published=True)
    if not form.project.intake_view:
        raise IntakeForm.DoesNotExist
    return form


class IntakeFormPublicEndpoint(APIView):
    authentication_classes = [BaseSessionAuthentication]
    permission_classes = [AllowAny]

    def get(self, request, anchor):
        scope, form = _resolve_public_form(anchor)
        if form is None:
            return Response({"error": "Form not found."}, status=status.HTTP_404_NOT_FOUND)

        if scope == "board":
            form_scope = getattr(form, "form_scope", "support") or "support"
            clients = serialize_board_intake_clients(board_intake_client_queryset(form.board_id, scope=form_scope))
            if not clients:
                error_msg = (
                    "Nenhum círculo com Intake ativo neste board."
                    if form_scope == "demand"
                    else "Nenhum cliente com Recepção ativa neste board."
                )
                return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)
            return Response(
                BoardIntakeFormPublicSerializer(form, context={"clients": clients}).data,
            )

        return Response(IntakeFormPublicSerializer(form).data)


class IntakeFormPublicSubmitEndpoint(APIView):
    authentication_classes = [BaseSessionAuthentication]
    permission_classes = [AllowAny]

    def post(self, request, anchor):
        scope, form = _resolve_public_form(anchor)
        if form is None:
            return Response({"error": "Form not found."}, status=status.HTTP_404_NOT_FOUND)

        if form.require_auth and not request.user.is_authenticated:
            return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        submission = request.data.get("fields") or request.data
        submitter_email = request.data.get("submitter_email")
        actor_id = str(request.user.id) if request.user.is_authenticated else None

        try:
            if scope == "board":
                intake_issue = submit_board_intake_form(
                    form=form,
                    submission=submission,
                    actor_id=actor_id,
                    submitter_email=submitter_email,
                    request=request,
                    client_ip=_client_ip(request),
                )
            else:
                intake_issue = submit_intake_form(
                    form=form,
                    submission=submission,
                    actor_id=actor_id,
                    submitter_email=submitter_email,
                    request=request,
                )
        except IntakeSubmissionError as exc:
            return Response(
                {"error": str(exc), "field_errors": exc.field_errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except (IntakeForm.DoesNotExist, BoardIntakeForm.DoesNotExist):
            return Response({"error": "Form not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(
            {
                "issue_id": str(intake_issue.issue_id),
                "intake_issue_id": str(intake_issue.id),
                "message": form.submit_message or "Pedido enviado com sucesso.",
            },
            status=status.HTTP_201_CREATED,
        )


class IntakeFormPublicAssetEndpoint(APIView):
    authentication_classes = [BaseSessionAuthentication]
    permission_classes = [AllowAny]

    def post(self, request, anchor):
        scope, form = _resolve_public_form(anchor)
        if form is None:
            return Response({"error": "Form not found."}, status=status.HTTP_404_NOT_FOUND)

        name = sanitize_filename(request.data.get("name")) or "unnamed"
        file_type = normalize_upload_mime_type(request.data.get("type", ""))
        if file_type not in settings.ATTACHMENT_MIME_TYPES:
            return Response({"error": "Invalid file type.", "status": False}, status=status.HTTP_400_BAD_REQUEST)

        try:
            size = int(request.data.get("size", settings.FILE_SIZE_LIMIT))
        except (TypeError, ValueError):
            return Response({"error": "Invalid file size.", "status": False}, status=status.HTTP_400_BAD_REQUEST)

        size_limit = min(size, settings.FILE_SIZE_LIMIT)
        asset_key = f"{form.workspace_id}/{uuid.uuid4().hex}-{name}"

        if scope == "board":
            asset = FileAsset.objects.create(
                attributes={"name": name, "type": file_type, "size": size_limit},
                asset=asset_key,
                size=size_limit,
                workspace_id=form.workspace_id,
                project_id=None,
                entity_type=FileAsset.EntityTypeContext.BOARD_INTAKE_FORM_ATTACHMENT,
                entity_identifier=str(form.id),
            )
        else:
            asset = FileAsset.objects.create(
                attributes={"name": name, "type": file_type, "size": size_limit},
                asset=asset_key,
                size=size_limit,
                workspace_id=form.workspace_id,
                project_id=form.project_id,
                entity_type=FileAsset.EntityTypeContext.INTAKE_FORM_ATTACHMENT,
                entity_identifier=str(form.id),
            )

        storage = S3Storage(request=request)
        presigned_url = storage.generate_presigned_post(
            object_name=asset_key,
            file_type=file_type,
            file_size=size_limit,
        )
        return Response(
            {
                "upload_data": presigned_url,
                "asset_id": str(asset.id),
                "asset_url": asset.asset_url,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, anchor, pk):
        scope, form = _resolve_public_form(anchor)
        if form is None:
            return Response({"error": "Form not found."}, status=status.HTTP_404_NOT_FOUND)

        filters = {
            "id": pk,
            "workspace_id": form.workspace_id,
            "entity_identifier": str(form.id),
            "is_deleted": False,
        }
        if scope == "board":
            filters["project_id__isnull"] = True
            filters["entity_type"] = FileAsset.EntityTypeContext.BOARD_INTAKE_FORM_ATTACHMENT
        else:
            filters["project_id"] = form.project_id
            filters["entity_type"] = FileAsset.EntityTypeContext.INTAKE_FORM_ATTACHMENT

        asset = FileAsset.objects.filter(**filters).first()
        if asset is None:
            return Response({"error": "Asset not found."}, status=status.HTTP_404_NOT_FOUND)

        asset.is_uploaded = True
        if not asset.storage_metadata:
            get_asset_object_metadata.delay(str(asset.id))
        asset.attributes = request.data.get("attributes", asset.attributes)
        asset.save(update_fields=["attributes", "is_uploaded"])
        return Response(status=status.HTTP_204_NO_CONTENT)
