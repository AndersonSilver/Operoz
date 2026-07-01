from __future__ import annotations

import html
import re
from datetime import datetime

from operoz.db.models import PageReviewComment, PageReviewSession
from operoz.utils.page_review_guest import strip_legacy_prd_review_scripts
from operoz.utils.status_report_export import content_to_pdf_bytes

_STATUS_LABELS = {
    PageReviewSession.STATUS_DRAFT: "Rascunho",
    PageReviewSession.STATUS_SENT: "Enviado",
    PageReviewSession.STATUS_APPROVED: "Aprovado",
    PageReviewSession.STATUS_CHANGES_REQUESTED: "Alterações solicitadas",
}


def resolve_session_document_html(session: PageReviewSession) -> str:
    page = session.page
    page_version = session.page_version if session.page_version_id else None
    description_html = page.description_html
    description_json = page.description_json
    if page_version:
        description_html = page_version.description_html or description_html
        description_json = page_version.description_json or description_json

    try:
        from operoz.assistant.page_content import (
            collect_html_document_embeds_from_content,
            read_html_document_asset_html,
        )

        embeds = collect_html_document_embeds_from_content(description_html, description_json)
        if embeds:
            embed_html = read_html_document_asset_html(embeds[0][0])
            if embed_html:
                return strip_legacy_prd_review_scripts(embed_html)
    except Exception:
        pass

    return strip_legacy_prd_review_scripts(description_html or "<p></p>")


def _format_dt(value) -> str:
    if not value:
        return "—"
    if isinstance(value, datetime):
        return value.strftime("%d/%m/%Y %H:%M")
    return str(value)


def _comments_appendix(session: PageReviewSession) -> str:
    comments = list(PageReviewComment.objects.filter(session=session).order_by("created_at"))
    if not comments:
        return ""

    rows: list[str] = []
    for comment in comments:
        kind = "Trecho" if comment.comment_type == "inline" else "Seção"
        quote_block = ""
        if comment.quote:
            quote_block = (
                f'<blockquote style="margin:6px 0;padding:6px 10px;border-left:3px solid #3b82f6;'
                f'color:#555;font-style:italic;">{html.escape(comment.quote)}</blockquote>'
            )
        rows.append(
            f"""
            <article style="margin-bottom:14px;padding:10px 12px;border:1px solid #e5e7eb;border-radius:6px;">
              <p style="margin:0 0 6px;font-size:11px;color:#6b7280;">
                <strong>{html.escape(comment.author_email)}</strong>
                · {kind}
                {f" · {html.escape(comment.section_id)}" if comment.section_id else ""}
              </p>
              {quote_block}
              <p style="margin:0;font-size:13px;line-height:1.45;color:#111827;">{html.escape(comment.body)}</p>
            </article>
            """
        )

    return f"""
    <section style="page-break-before:always;margin-top:24px;">
      <h2 style="font-size:16px;margin:0 0 12px;">Comentários da revisão</h2>
      {''.join(rows)}
    </section>
    """


def build_review_export_html(session: PageReviewSession, *, include_comments: bool) -> str:
    page = session.page
    status_label = _STATUS_LABELS.get(session.status, session.status)
    body_html = resolve_session_document_html(session)
    comments_html = _comments_appendix(session) if include_comments else ""

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <title>{html.escape(page.name)} — PRD Review</title>
  <style>
    body {{ font-family: system-ui, sans-serif; color: #111827; margin: 24px; }}
    .meta {{ font-size: 12px; color: #6b7280; margin-bottom: 20px; }}
    .meta strong {{ color: #374151; }}
    .doc-body img {{ max-width: 100%; height: auto; }}
  </style>
</head>
<body>
  <header>
    <h1 style="font-size:20px;margin:0 0 8px;">{html.escape(page.name)}</h1>
    <div class="meta">
      <div><strong>Status:</strong> {html.escape(status_label)}</div>
      <div><strong>Enviado:</strong> {_format_dt(session.sent_at)}</div>
      <div><strong>Resolvido:</strong> {_format_dt(session.resolved_at)}</div>
    </div>
  </header>
  <main class="doc-body">{body_html}</main>
  {comments_html}
</body>
</html>"""


def export_review_session_pdf(session: PageReviewSession, *, include_comments: bool) -> tuple[bytes | None, str]:
    """Returns (pdf_bytes, html_document). pdf_bytes is None when engine unavailable."""
    document = build_review_export_html(session, include_comments=include_comments)
    return content_to_pdf_bytes(document), document


def safe_export_filename(page_name: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", page_name, flags=re.UNICODE).strip().lower()
    slug = re.sub(r"[\s_-]+", "-", slug)[:48] or "prd-review"
    stamp = datetime.now().strftime("%Y%m%d")
    return f"prd-review-{slug}-{stamp}"
