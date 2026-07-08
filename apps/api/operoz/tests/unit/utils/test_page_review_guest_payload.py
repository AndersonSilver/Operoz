from __future__ import annotations

from datetime import timedelta
from unittest.mock import patch

import pytest
from django.utils import timezone

from operoz.assistant.page_content import collect_html_document_embeds_from_content
from operoz.db.models import Page, PageReviewInvite, PageReviewSession, Project, ProjectMember, ProjectPage
from operoz.utils.page_review_guest import (
    build_guest_prd_review_payload,
    strip_legacy_prd_review_scripts,
)


@pytest.mark.unit
class TestStripLegacyPrdReviewScripts:
    def test_removes_legacy_review_script_definitions(self):
        html = (
            "<html><body><p>PRD</p>"
            "<script>function safeStorageSet(v) {} window.initApprovalAndComments = function() {}</script>"
            "</body></html>"
        )
        stripped = strip_legacy_prd_review_scripts(html)
        assert "safeStorageSet" not in stripped
        assert "initApprovalAndComments" not in stripped
        assert "<p>PRD</p>" in stripped

    def test_preserves_main_render_script_that_only_invokes_legacy_hook(self):
        html = (
            '<html><body><div id="content"></div>'
            "<script>function renderDoc() { document.getElementById('content').textContent = 'Tech4Humans'; }"
            "if (window.initApprovalAndComments) window.initApprovalAndComments();</script>"
            "</body></html>"
        )
        stripped = strip_legacy_prd_review_scripts(html)
        assert "renderDoc" in stripped
        assert "Tech4Humans" in stripped

    def test_preserves_prd_md_embed_bootstrap_script(self):
        html = (
            "<html><body>"
            '<script>window.__PRD_MD_EMBED__="# Title\\n\\nBody";</script>'
            "<script>function render() { /* calls */ if (window.initApprovalAndComments) window.initApprovalAndComments(); }</script>"
            "</body></html>"
        )
        stripped = strip_legacy_prd_review_scripts(html)
        assert "__PRD_MD_EMBED__" in stripped
        assert "function render" in stripped


@pytest.mark.unit
class TestInjectGuestPrdReviewSdk:
    def test_sdk_injection_does_not_break_on_regex_escapes_in_bundle(self):
        invite = type("Invite", (), {"token": "guest-token", "session_id": "session-id"})()
        html = "<html><body><p>Tech4Humans</p></body></html>"
        with patch("operoz.utils.page_review_guest.read_prd_review_sdk_bundle") as mock_sdk:
            mock_sdk.return_value = "function demo() { return /\\d+/.test('1'); }"
            injected = __import__(
                "operoz.utils.page_review_guest", fromlist=["inject_guest_prd_review_sdk"]
            ).inject_guest_prd_review_sdk(
                html,
                invite=invite,
                page_name="PRD",
                read_only=False,
            )
        assert "initPrdReview" in injected
        assert "Tech4Humans" in injected
        assert "\\d+" in injected

    def test_merges_html_and_json_sources(self):
        embeds = collect_html_document_embeds_from_content(
            '<p class="editor-paragraph-block"></p>',
            {
                "type": "doc",
                "content": [
                    {
                        "type": "htmlDocumentEmbed",
                        "attrs": {"src": "asset-from-json", "title": "PRD Magalu"},
                    }
                ],
            },
        )
        assert embeds == [("asset-from-json", "PRD Magalu")]


@pytest.mark.unit
@pytest.mark.django_db
class TestBuildGuestPrdReviewPayload:
    def _create_invite(self, workspace, workspace_board, create_user, *, page_kwargs: dict | None = None):
        project = Project.objects.create(
            name="PRD Client",
            identifier="PRDC",
            workspace=workspace,
            board=workspace_board,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        page = Page.objects.create(
            name="PRD Magalu",
            workspace=workspace,
            owned_by=create_user,
            **(page_kwargs or {}),
        )
        ProjectPage.objects.create(project=project, page=page, workspace=workspace, created_by=create_user)
        session = PageReviewSession.objects.create(
            workspace=workspace,
            project=project,
            page=page,
            status=PageReviewSession.STATUS_SENT,
            created_by=create_user,
        )
        invite = PageReviewInvite.objects.create(
            session=session,
            email="client@example.com",
            expires_at=timezone.now() + timedelta(days=7),
            created_by=create_user,
        )
        return invite

    @patch("operoz.assistant.page_content.read_html_document_asset_html")
    def test_render_html_uses_embed_from_description_json(
        self, mock_read_html, workspace, workspace_board, create_user
    ):
        prd_html = (
            "<!DOCTYPE html><html><head><title>PRD</title></head><body>"
            "<header>Tech4Humans</header>"
            '<div id="content">Full PRD body with Magalu stakeholders and objectives.</div>'
            "<script>function renderDoc() { /* main */ if (window.initApprovalAndComments) window.initApprovalAndComments(); }</script>"
            "<script>function safeStorageSet(v) {} window.initApprovalAndComments = function() {}</script>"
            "</body></html>"
        )
        mock_read_html.return_value = prd_html

        invite = self._create_invite(
            workspace,
            workspace_board,
            create_user,
            page_kwargs={
                "description_html": '<p class="editor-paragraph-block"></p>',
                "description_json": {
                    "type": "doc",
                    "content": [
                        {
                            "type": "htmlDocumentEmbed",
                            "attrs": {"src": "asset-uuid-prd", "title": "PRD Magalu"},
                        }
                    ],
                },
            },
        )

        payload = build_guest_prd_review_payload(invite)
        render_html = payload["page"]["render_html"]

        assert payload["page"]["render_mode"] == "html_embed"
        assert len(render_html) > 1000
        assert "Tech4Humans" in render_html
        assert "Full PRD body" in render_html
        assert "function renderDoc" in render_html
        assert "initPrdReview" in render_html
        mock_read_html.assert_called_once_with("asset-uuid-prd")

    @patch("operoz.assistant.page_content.read_html_document_asset_html")
    def test_inject_guest_sdk_preserves_substantive_prd_body(
        self, mock_read_html, workspace, workspace_board, create_user
    ):
        mock_read_html.return_value = "<html><body><h1>Tech4Humans</h1><p>" + ("x" * 1200) + "</p></body></html>"
        invite = self._create_invite(
            workspace,
            workspace_board,
            create_user,
            page_kwargs={
                "description_html": '<html-document-embed src="asset-1" title="PRD"></html-document-embed>',
            },
        )
        payload = build_guest_prd_review_payload(invite)
        assert "Tech4Humans" in payload["page"]["render_html"]
        assert len(payload["page"]["render_html"]) > 1000
