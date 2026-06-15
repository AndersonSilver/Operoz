from __future__ import annotations

import json
import re
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.utils import timezone

from operis.utils.host import api_public_base_url, frontend_base_url

from operis.db.models import (
    Page,
    PageReviewComment,
    PageReviewEvent,
    PageReviewInvite,
    PageReviewSession,
    PageVersion,
    Project,
)

RESOLVED_REVIEW_SESSION_STATUSES = frozenset(
    {
        PageReviewSession.STATUS_APPROVED,
        PageReviewSession.STATUS_CHANGES_REQUESTED,
    }
)

DEFAULT_PRD_REVIEW_TTL_DAYS = 14
MAX_PRD_REVIEW_TTL_DAYS = 90
MIN_PRD_REVIEW_TTL_DAYS = 1

_PRD_REVIEW_SDK_FILES = (
    "manifest.js",
    "storage-local.js",
    "storage-api.js",
    "review-core.js",
    "init.js",
)
# Only strip scripts that *define* legacy inline review helpers — not scripts that merely invoke them.
_LEGACY_REVIEW_SCRIPT_DEF_MARKERS = (
    "window.initApprovalAndComments = function",
    "window.initApprovalAndComments=function",
    "function initApprovalAndComments(",
    "function safeStorageSet(",
)
_SDK_SCRIPT_MARKERS = ("OperozPrdManifest", "OperozPrdStorageApi", "initPrdReview")


def parse_prd_review_ttl_days(raw) -> tuple[int, str | None]:
    if raw is None or raw == "":
        return DEFAULT_PRD_REVIEW_TTL_DAYS, None
    try:
        days = int(raw)
    except (TypeError, ValueError):
        return DEFAULT_PRD_REVIEW_TTL_DAYS, "expires_in_days must be an integer"
    if days < MIN_PRD_REVIEW_TTL_DAYS or days > MAX_PRD_REVIEW_TTL_DAYS:
        return (
            DEFAULT_PRD_REVIEW_TTL_DAYS,
            f"expires_in_days must be between {MIN_PRD_REVIEW_TTL_DAYS} and {MAX_PRD_REVIEW_TTL_DAYS}",
        )
    return days, None


def build_prd_review_guest_url(token: str) -> str:
    return f"{frontend_base_url()}/guest/prd-review/{token}"


def build_prd_review_api_base() -> str:
    return api_public_base_url()


def _prd_review_sdk_root() -> Path:
    base = Path(settings.BASE_DIR).resolve()
    candidates = (
        base / "assets" / "prd-review",
        base.joinpath("..", "templates", "prd", "prd-review"),
        base.joinpath("..", "..", "..", "templates", "prd", "prd-review"),
    )
    for candidate in candidates:
        resolved = candidate.resolve()
        if resolved.is_dir():
            return resolved
    for parent in base.parents:
        resolved = (parent / "templates" / "prd" / "prd-review").resolve()
        if resolved.is_dir():
            return resolved
    return candidates[0].resolve()


def read_prd_review_sdk_bundle() -> str:
    root = _prd_review_sdk_root()
    chunks: list[str] = []
    for name in _PRD_REVIEW_SDK_FILES:
        path = root / name
        if not path.is_file():
            continue
        chunks.append(path.read_text(encoding="utf-8"))
    return "\n\n".join(chunks)


def strip_legacy_prd_review_scripts(html: str) -> str:
    """Remove inline prototype review JS so guest SDK can bind API storage once."""

    def replacer(match: re.Match[str]) -> str:
        body = match.group(1) or ""
        if any(marker in body for marker in _SDK_SCRIPT_MARKERS):
            return match.group(0)
        if any(marker in body for marker in _LEGACY_REVIEW_SCRIPT_DEF_MARKERS):
            return ""
        return match.group(0)

    return re.sub(
        r"<script\b[^>]*>(.*?)</script>",
        replacer,
        html,
        flags=re.IGNORECASE | re.DOTALL,
    )


def inject_guest_prd_review_sdk(
    html: str,
    *,
    invite: PageReviewInvite,
    page_name: str,
    read_only: bool,
) -> str:
    body = strip_legacy_prd_review_scripts(html or "")
    sdk_js = read_prd_review_sdk_bundle()
    if not sdk_js.strip():
        return body

    init_config = {
        "mode": "guest",
        "docTitle": page_name or "PRD",
        "apiBase": build_prd_review_api_base(),
        "guestToken": invite.token,
        "reviewSessionId": str(invite.session_id),
        "embeddedGuest": True,
        "readOnly": read_only,
        "autoInit": True,
    }
    bootstrap = (
        "<script>\n"
        f"{sdk_js}\n"
        f"initPrdReview({json.dumps(init_config)});\n"
        "</script>"
    )

    if re.search(r"</body>", body, flags=re.IGNORECASE):
        return re.sub(
            r"</body>",
            lambda _match: bootstrap + "\n</body>",
            body,
            count=1,
            flags=re.IGNORECASE,
        )
    return body + bootstrap


def resolve_prd_review_invite(token: str) -> tuple[PageReviewInvite | None, dict | None, int]:
    invite = (
        PageReviewInvite.objects.filter(token=token)
        .select_related(
            "session",
            "session__page",
            "session__project",
            "session__workspace",
            "session__page_version",
        )
        .first()
    )
    if not invite:
        return None, {"error": "Link not found"}, 404
    if invite.revoked_at:
        return None, {"error": "This guest link was revoked"}, 403
    if invite.expires_at <= timezone.now():
        return None, {"error": "This guest link has expired"}, 410
    return invite, None, 200


def log_prd_review_access(invite: PageReviewInvite, request) -> None:
    PageReviewInvite.objects.filter(pk=invite.pk).update(
        access_count=invite.access_count + 1,
        last_access_at=timezone.now(),
    )
    PageReviewEvent.objects.create(
        session=invite.session,
        event_type=PageReviewEvent.EVENT_OPENED,
        actor_email=invite.email,
        payload={"invite_id": str(invite.id)},
    )


def is_session_resolved(session: PageReviewSession) -> bool:
    return session.status in RESOLVED_REVIEW_SESSION_STATUSES


def create_page_version_snapshot(page: Page, user) -> PageVersion:
    return PageVersion.objects.create(
        page_id=page.id,
        workspace_id=page.workspace_id,
        description_json=page.description_json,
        description_html=page.description_html,
        description_binary=page.description_binary,
        description_stripped=page.description_stripped,
        owned_by=user,
        last_saved_at=timezone.now(),
        sub_pages_data={},
    )


def session_has_comments(session: PageReviewSession) -> bool:
    return PageReviewComment.objects.filter(session=session).exists()


def build_section_comments_map(session: PageReviewSession) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for comment in PageReviewComment.objects.filter(
        session=session,
        comment_type=PageReviewComment.TYPE_SECTION,
    ).order_by("created_at"):
        out[comment.section_id] = {
            "id": str(comment.id),
            "title": comment.section_id,
            "text": comment.body,
            "author_email": comment.author_email,
        }
    return out


def build_inline_comments_list(session: PageReviewSession) -> list[dict]:
    return [
        {
            "id": str(comment.id),
            "sectionId": comment.section_id,
            "sectionTitle": comment.section_id,
            "quote": comment.quote,
            "text": comment.body,
            "anchor": comment.anchor or {},
            "author_email": comment.author_email,
        }
        for comment in PageReviewComment.objects.filter(
            session=session,
            comment_type=PageReviewComment.TYPE_INLINE,
        ).order_by("created_at")
    ]


def serialize_review_session(session: PageReviewSession) -> dict:
    payload = {
        "id": str(session.id),
        "page_id": str(session.page_id),
        "page_version_id": str(session.page_version_id) if session.page_version_id else None,
        "project_id": str(session.project_id),
        "status": session.status,
        "sent_at": session.sent_at.isoformat() if session.sent_at else None,
        "resolved_at": session.resolved_at.isoformat() if session.resolved_at else None,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "comment_count": PageReviewComment.objects.filter(session=session).count(),
        "invite_count": PageReviewInvite.objects.filter(session=session, revoked_at__isnull=True).count(),
    }
    page_version = getattr(session, "page_version", None)
    if page_version is not None and session.page_version_id:
        payload["page_version"] = {
            "id": str(page_version.id),
            "last_saved_at": page_version.last_saved_at.isoformat() if page_version.last_saved_at else None,
        }
    return payload


def serialize_review_invite(invite: PageReviewInvite) -> dict:
    return {
        "id": str(invite.id),
        "email": invite.email,
        "token": invite.token,
        "url": build_prd_review_guest_url(invite.token),
        "expires_at": invite.expires_at.isoformat(),
        "revoked_at": invite.revoked_at.isoformat() if invite.revoked_at else None,
        "last_access_at": invite.last_access_at.isoformat() if invite.last_access_at else None,
        "access_count": invite.access_count,
    }


def build_guest_prd_review_payload(invite: PageReviewInvite) -> dict:
    session = invite.session
    page: Page = session.page
    page_version = session.page_version if session.page_version_id else None

    description_html = page.description_html
    description_json = page.description_json
    if page_version:
        description_html = page_version.description_html or description_html
        description_json = page_version.description_json or description_json

    html = description_html

    embed_html = None
    try:
        from operis.assistant.page_content import (
            collect_html_document_embeds_from_content,
            read_html_document_asset_html,
        )

        embeds = collect_html_document_embeds_from_content(description_html, description_json)
        if embeds:
            embed_html = read_html_document_asset_html(embeds[0][0])
    except Exception:
        embed_html = None

    render_html = embed_html or html or "<p></p>"
    read_only = session.status in {
        PageReviewSession.STATUS_APPROVED,
        PageReviewSession.STATUS_CHANGES_REQUESTED,
    }
    render_html = inject_guest_prd_review_sdk(
        render_html,
        invite=invite,
        page_name=page.name,
        read_only=read_only,
    )

    return {
        "session": serialize_review_session(session),
        "page": {
            "id": str(page.id),
            "name": page.name,
            "description_html": html,
            "render_html": render_html,
            "render_mode": "html_embed" if embed_html else "page_description",
        },
        "guest_email": invite.email,
        "expires_at": invite.expires_at.isoformat(),
        "section_comments": build_section_comments_map(session),
        "inline_comments": build_inline_comments_list(session),
    }


def get_project_page(slug: str, project_id, page_id) -> Page | None:
    return (
        Page.objects.filter(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )
        .select_related("workspace")
        .first()
    )


def get_accessible_project(slug: str, project_id, user) -> Project | None:
    return (
        Project.objects.filter(
            pk=project_id,
            workspace__slug=slug,
            archived_at__isnull=True,
            project_projectmember__member=user,
            project_projectmember__is_active=True,
        )
        .select_related("workspace")
        .distinct()
        .first()
    )


def create_review_invites(
    session: PageReviewSession,
    emails: list[str],
    expires_in_days: int,
    *,
    created_by,
) -> list[PageReviewInvite]:
    expires_at = timezone.now() + timedelta(days=expires_in_days)
    invites: list[PageReviewInvite] = []
    for raw_email in emails:
        email = (raw_email or "").strip().lower()
        if not email:
            continue
        invite = PageReviewInvite.objects.filter(
            session=session,
            email=email,
            revoked_at__isnull=True,
        ).first()
        if invite:
            invite.expires_at = expires_at
            invite.save(update_fields=["expires_at", "updated_at"])
        else:
            invite = PageReviewInvite.objects.create(
                session=session,
                email=email,
                expires_at=expires_at,
                created_by=created_by,
            )
            PageReviewEvent.objects.create(
                session=session,
                event_type=PageReviewEvent.EVENT_INVITE_CREATED,
                actor_email=email,
                payload={"invite_id": str(invite.id)},
            )
        invites.append(invite)
    return invites
