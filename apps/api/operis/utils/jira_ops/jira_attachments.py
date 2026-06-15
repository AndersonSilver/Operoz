"""Baixa anexos de imagem do Jira e publica como assets de descrição no Operoz."""

from __future__ import annotations

import logging
import mimetypes
import uuid
from io import BytesIO
from typing import TYPE_CHECKING, Any

from operis.db.models import FileAsset, Issue, Project, User, Workspace
from operis.settings.storage import S3Storage
from operis.utils.path_validator import sanitize_filename

if TYPE_CHECKING:
    from .jira_client import JiraOpsClient

logger = logging.getLogger(__name__)

IMAGE_MIME_PREFIX = "image/"


def _is_image_attachment(attachment: dict[str, Any]) -> bool:
    mime = (attachment.get("mimeType") or "").lower()
    if mime.startswith(IMAGE_MIME_PREFIX):
        return True
    filename = (attachment.get("filename") or "").lower()
    guessed, _ = mimetypes.guess_type(filename)
    return bool(guessed and guessed.startswith(IMAGE_MIME_PREFIX))


def sync_jira_description_media(
    client: JiraOpsClient,
    *,
    issue: Issue,
    attachments: list[dict[str, Any]] | None,
    workspace: Workspace,
    project: Project,
    actor: User,
) -> dict[str, str]:
    """
    Faz upload de imagens anexadas no Jira para assets ISSUE_DESCRIPTION.
    Retorna mapa (filename, media_id, alt) -> asset_url relativo.
    """
    if not attachments:
        return {}

    media_urls: dict[str, str] = {}
    storage = S3Storage(is_server=True)

    for attachment in attachments:
        if not isinstance(attachment, dict) or not _is_image_attachment(attachment):
            continue

        attachment_id = str(attachment.get("id") or "").strip()
        filename = sanitize_filename(attachment.get("filename")) or "image.png"
        if not attachment_id:
            continue

        existing = FileAsset.objects.filter(
            workspace_id=workspace.id,
            project_id=project.id,
            issue_id=issue.id,
            external_source="jira",
            external_id=attachment_id,
            entity_type=FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
            deleted_at__isnull=True,
        ).first()

        if existing and existing.is_uploaded:
            url = existing.asset_url or ""
            if url:
                media_urls[filename] = url
                media_urls[attachment_id] = url
            continue

        try:
            content, content_type = client.download_attachment(attachment)
        except Exception as exc:
            logger.warning("Jira attachment download failed %s: %s", attachment_id, exc)
            continue

        if not content:
            continue

        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{filename}"
        file_obj = BytesIO(content)
        file_obj.seek(0)
        upload_ok = storage.upload_file(
            file_obj=file_obj,
            object_name=asset_key,
            content_type=content_type,
        )
        if not upload_ok:
            continue

        storage_metadata = storage.get_object_metadata(object_name=asset_key) or {}
        size = len(content)

        if existing:
            asset = existing
            asset.attributes = {"name": filename, "type": content_type, "size": size}
            asset.asset = asset_key
            asset.size = size
            asset.is_uploaded = True
            asset.storage_metadata = storage_metadata
            asset.updated_by = actor
            asset.save(
                update_fields=[
                    "attributes",
                    "asset",
                    "size",
                    "is_uploaded",
                    "storage_metadata",
                    "updated_by",
                    "updated_at",
                ]
            )
        else:
            asset = FileAsset.objects.create(
                attributes={"name": filename, "type": content_type, "size": size},
                asset=asset_key,
                size=size,
                workspace_id=workspace.id,
                project_id=project.id,
                issue_id=issue.id,
                entity_type=FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
                external_id=attachment_id,
                external_source="jira",
                is_uploaded=True,
                storage_metadata=storage_metadata,
                created_by=actor,
                updated_by=actor,
            )

        url = asset.asset_url or ""
        if url:
            media_urls[filename] = url
            media_urls[attachment_id] = url

    return media_urls
