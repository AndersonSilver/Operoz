from unittest.mock import patch

import pytest

from operis.app.permissions import ROLE
from operis.assistant.indexing import index_entity
from operis.assistant.page_content import (
    build_page_indexable_text,
    collect_page_html_document_embeds,
    parse_editor_json_document_embeds,
    parse_html_document_embeds,
    read_html_document_asset_text,
)
from operis.db.models import Page, Project, ProjectMember, ProjectPage, SearchEmbedding, WorkspaceMember


@pytest.mark.unit
class TestParseHtmlDocumentEmbeds:
    def test_extracts_src_and_title(self):
        html = (
            '<p>Intro</p><html-document-embed src="abc-123" title="Manual da Tradição">'
            "</html-document-embed>"
        )
        assert parse_html_document_embeds(html) == [("abc-123", "Manual da Tradição")]

    def test_self_closing_embed(self):
        html = '<html-document-embed src="uuid-1" title="Guia" />'
        assert parse_html_document_embeds(html) == [("uuid-1", "Guia")]

    def test_deduplicates_repeated_src(self):
        html = (
            '<html-document-embed src="same" title="A"></html-document-embed>'
            '<html-document-embed src="same" title="B"></html-document-embed>'
        )
        assert parse_html_document_embeds(html) == [("same", "A")]

    def test_empty_html(self):
        assert parse_html_document_embeds("") == []


@pytest.mark.unit
class TestParseEditorJsonDocumentEmbeds:
    def test_extracts_src_from_html_document_embed(self):
        doc = {
            "type": "doc",
            "content": [
                {
                    "type": "htmlDocumentEmbed",
                    "attrs": {
                        "src": "3b982a5d-5f65-4487-95b9-cf9b97df82d2",
                        "title": "Manual Operacional",
                    },
                }
            ],
        }
        assert parse_editor_json_document_embeds(doc) == [
            ("3b982a5d-5f65-4487-95b9-cf9b97df82d2", "Manual Operacional")
        ]

    def test_null_title_defaults(self):
        doc = {
            "type": "doc",
            "content": [
                {
                    "type": "htmlDocumentEmbed",
                    "attrs": {"src": "asset-1", "title": None},
                }
            ],
        }
        assert parse_editor_json_document_embeds(doc) == [("asset-1", "Documento HTML")]


@pytest.mark.unit
@pytest.mark.django_db
class TestBuildPageIndexableText:
    @patch("operis.assistant.page_content.read_html_document_asset_text")
    def test_includes_embed_from_description_json(self, mock_read_asset, create_user, workspace):
        mock_read_asset.return_value = "Conteudo completo do manual HTML embutido."
        page = Page.objects.create(
            name="TESTE INDEXACAO",
            description_html='<p class="editor-paragraph-block"></p>',
            description_json={
                "type": "doc",
                "content": [
                    {
                        "type": "htmlDocumentEmbed",
                        "attrs": {"src": "asset-from-json", "title": None},
                    }
                ],
            },
            workspace=workspace,
            owned_by=create_user,
        )

        assert collect_page_html_document_embeds(page) == [("asset-from-json", "Documento HTML")]
        text = build_page_indexable_text(page)
        assert "Conteudo completo do manual HTML embutido." in text
        mock_read_asset.assert_called_once_with("asset-from-json")

    @patch("operis.assistant.page_content.read_html_document_asset_text")
    def test_includes_embedded_html_asset(self, mock_read_asset, create_user, workspace):
        mock_read_asset.return_value = (
            "Processos da Tradicao\n\nRitual semanal e governanca operacional."
        )
        page = Page.objects.create(
            name="Manual da Tradição",
            description_html=(
                '<html-document-embed src="asset-uuid-1" title="Manual da Tradição"></html-document-embed>'
            ),
            workspace=workspace,
            owned_by=create_user,
        )

        text = build_page_indexable_text(page)
        assert "Manual da Tradição" in text
        assert "Processos da Tradicao" in text
        assert "Ritual semanal" in text
        mock_read_asset.assert_called_once_with("asset-uuid-1")

    @patch("operis.assistant.page_content.read_html_document_asset_text")
    @patch("operis.assistant.indexing.embed_texts")
    def test_index_page_with_html_embed(self, mock_embed, mock_read_asset, create_user, workspace, workspace_board):
        mock_read_asset.return_value = "Conteudo exclusivo sobre tradicao operacional."
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=create_user,
            defaults={"role": ROLE.ADMIN.value},
        )
        project = Project.objects.create(
            name="Operoz",
            identifier="OPZ",
            workspace=workspace,
            board=workspace_board,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=ROLE.ADMIN.value)
        page = Page.objects.create(
            name="Manual da Tradição",
            description_html="<p></p>",
            workspace=workspace,
            owned_by=create_user,
        )
        ProjectPage.objects.create(project=project, page=page, workspace=workspace)
        page.description_html = (
            '<html-document-embed src="asset-uuid-2" title="Manual da Tradição"></html-document-embed>'
        )
        page.save()

        mock_embed.return_value = [[0.1] * 1536]

        result = index_entity(SearchEmbedding.ENTITY_PAGE, str(page.id))
        assert result["ok"] is True
        assert result["indexed"] >= 1

        row = SearchEmbedding.objects.get(entity_type=SearchEmbedding.ENTITY_PAGE, entity_id=page.id)
        assert "tradicao operacional" in row.content.lower()

    def test_read_missing_asset_returns_none(self):
        assert read_html_document_asset_text("00000000-0000-0000-0000-000000000000") is None

    @patch("operis.assistant.page_content._read_storage_object_bytes")
    def test_read_asset_uses_storage_object_reader(self, mock_read_bytes, create_user, workspace):
        from operis.db.models import FileAsset

        page = Page.objects.create(
            name="Pagina",
            description_html="<p></p>",
            workspace=workspace,
            owned_by=create_user,
        )
        asset = FileAsset.objects.create(
            workspace=workspace,
            page=page,
            entity_type=FileAsset.EntityTypeContext.PAGE_DESCRIPTION,
            attributes={},
        )
        asset.asset.name = "workspace/file.html"
        asset.save(update_fields=["asset"])

        mock_read_bytes.return_value = b"<html><body><p>Conteudo HTML</p></body></html>"
        text = read_html_document_asset_text(str(asset.id))
        assert text == "Conteudo HTML"
        mock_read_bytes.assert_called_once_with("workspace/file.html", max_bytes=2_000_000)
