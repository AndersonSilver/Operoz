from operoz.utils.jira_ops.adf_to_html import (
    adf_to_html,
    description_needs_jira_repair,
    jira_description_to_html,
    resolve_jira_description_html,
)
from operoz.utils.jira_ops.import_service import issue_description_html


def test_jira_description_plain_string():
    assert jira_description_to_html("Boa tarde!") == "<p>Boa tarde!</p>"


def test_jira_description_adf_paragraph_and_link():
    adf = {
        "type": "doc",
        "version": 1,
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "Ver protocolo: "},
                    {
                        "type": "text",
                        "text": "link",
                        "marks": [
                            {
                                "type": "link",
                                "attrs": {
                                    "href": "https://webapp.tech4h.com.br/tradicao/consorcio/protocolo/abc",
                                },
                            }
                        ],
                    },
                ],
            },
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": "Boa tarde!"}],
            },
        ],
    }
    html = adf_to_html(adf)
    assert "<p>Ver protocolo: <a href=" in html
    assert "webapp.tech4h.com.br" in html
    assert "<p>Boa tarde!</p>" in html


def test_jira_description_adf_python_repr_string():
    adf_str = "{'type': 'doc', 'version': 1, 'content': [{'type': 'paragraph', 'content': [{'type': 'text', 'text': 'Boa tarde!'}]}]}"
    html = jira_description_to_html(adf_str)
    assert "<p>Boa tarde!</p>" in html
    assert "'type': 'doc'" not in html


def test_jira_description_adf_media_single():
    adf = {
        "type": "doc",
        "version": 1,
        "content": [
            {
                "type": "mediaSingle",
                "attrs": {"layout": "align-start"},
                "content": [
                    {
                        "type": "media",
                        "attrs": {
                            "type": "file",
                            "id": "0083fd24-b25e-42c6-8376-5eb1f131270b",
                            "alt": "image-20260427-150932.png",
                        },
                    }
                ],
            }
        ],
    }
    html = adf_to_html(adf)
    assert "image-20260427-150932.png" in html
    assert "[Imagem:" in html


def test_jira_description_adf_media_with_uploaded_url():
    adf = {
        "type": "doc",
        "version": 1,
        "content": [
            {
                "type": "mediaSingle",
                "content": [
                    {
                        "type": "media",
                        "attrs": {
                            "alt": "image-20260427-150932.png",
                            "id": "0083fd24-b25e-42c6-8376-5eb1f131270b",
                        },
                    }
                ],
            }
        ],
    }
    html = adf_to_html(
        adf,
        media_urls={"image-20260427-150932.png": "/api/assets/v2/workspaces/ws/projects/p/id/"},
    )
    assert "<img src=" in html
    assert "image-20260427-150932.png" in html


def test_description_needs_jira_repair():
    broken = "<p>{'type': 'doc', 'version': 1}</p>"
    assert description_needs_jira_repair(broken)
    assert not description_needs_jira_repair("<p>Boa tarde!</p>")


def test_resolve_jira_description_html_repairs_existing_corrupt_value():
    corrupt = (
        "{'type': 'doc', 'version': 1, 'content': [{'type': 'paragraph', "
        "'content': [{'type': 'text', 'text': 'Prezado, boa tarde!'}]}]}"
    )
    html = resolve_jira_description_html(None, existing_description_html=corrupt)
    assert "<p>Prezado, boa tarde!</p>" in html
    assert "'type': 'doc'" not in html


def test_issue_description_html_repairs_from_existing_when_jira_empty():
    corrupt = (
        "{'type': 'doc', 'version': 1, 'content': [{'type': 'paragraph', "
        "'content': [{'type': 'text', 'text': 'Evidência enviada no grupo'}]}]}"
    )
    html = issue_description_html("OPS-3530", {}, existing_description_html=corrupt)
    assert "Evidência enviada no grupo" in html
    assert "Jira: OPS-3530" in html
    assert "'type': 'doc'" not in html
