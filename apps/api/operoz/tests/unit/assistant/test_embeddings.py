from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from operoz.assistant.embeddings import (
    DEFAULT_GEMINI_EMBEDDING_MODEL,
    DEFAULT_OPENAI_EMBEDDING_MODEL,
    _embedding_request_kwargs,
    _resolve_embedding_model,
    _resolve_embedding_provider,
    embed_texts,
    gemini_embedding_base_url,
    get_embedding_config,
)


@pytest.mark.parametrize(
    ("provider_key", "api_key", "expected"),
    [
        ("gemini", "AIzaSy-test", "gemini"),
        ("openai", "sk-test", "openai"),
        ("openai", "AIzaSy-test", "gemini"),
        (None, None, "openai"),
    ],
)
def test_resolve_embedding_provider(provider_key, api_key, expected):
    assert _resolve_embedding_provider(provider_key, api_key) == expected


@pytest.mark.parametrize(
    ("provider_key", "configured", "expected"),
    [
        ("openai", None, DEFAULT_OPENAI_EMBEDDING_MODEL),
        ("gemini", None, DEFAULT_GEMINI_EMBEDDING_MODEL),
        ("gemini", "text-embedding-3-small", DEFAULT_GEMINI_EMBEDDING_MODEL),
        ("openai", "gemini-embedding-001", DEFAULT_OPENAI_EMBEDDING_MODEL),
        ("gemini", "gemini-embedding-001", "gemini-embedding-001"),
        ("openai", "text-embedding-3-large", "text-embedding-3-large"),
    ],
)
def test_resolve_embedding_model(provider_key, configured, expected):
    assert _resolve_embedding_model(provider_key, configured) == expected


def test_embedding_request_kwargs_gemini_query():
    kwargs = _embedding_request_kwargs("gemini", DEFAULT_GEMINI_EMBEDDING_MODEL, purpose="query")
    assert kwargs == {"dimensions": 1536}


def test_embedding_request_kwargs_openai_dimensions():
    kwargs = _embedding_request_kwargs("openai", "text-embedding-3-small", purpose="document")
    assert kwargs == {"dimensions": 1536}


@patch.dict(
    "os.environ",
    {
        "LLM_PROVIDER": "gemini",
        "LLM_API_KEY": "AIzaSy-test",
        "ASSISTANT_EMBEDDING_MODEL": "text-embedding-3-small",
    },
    clear=False,
)
@patch("operoz.assistant.embeddings.get_llm_base_url", return_value=gemini_embedding_base_url())
@patch("operoz.assistant.embeddings.get_configuration_value")
def test_get_embedding_config_gemini(mock_config, _base_url):
    mock_config.side_effect = [
        ("gemini",),
        ("AIzaSy-test",),
    ]
    api_key, model, base_url, provider_key = get_embedding_config()
    assert api_key == "AIzaSy-test"
    assert model == DEFAULT_GEMINI_EMBEDDING_MODEL
    assert base_url == gemini_embedding_base_url()
    assert provider_key == "gemini"


@patch.dict(
    "os.environ",
    {
        "LLM_PROVIDER": "openai",
        "LLM_API_KEY": "sk-test",
    },
    clear=False,
)
@patch("operoz.assistant.embeddings.get_llm_base_url", return_value=None)
@patch("operoz.assistant.embeddings.get_configuration_value")
def test_get_embedding_config_openai(mock_config, _base_url):
    mock_config.side_effect = [
        ("openai",),
        ("sk-test",),
    ]
    api_key, model, base_url, provider_key = get_embedding_config()
    assert api_key == "sk-test"
    assert model == DEFAULT_OPENAI_EMBEDDING_MODEL
    assert base_url is None
    assert provider_key == "openai"


@patch("operoz.assistant.embeddings.create_openai_client")
@patch("operoz.assistant.embeddings.get_embedding_config")
def test_embed_texts_uses_gemini_base_url(mock_config, mock_create_client):
    mock_config.return_value = (
        "AIzaSy-test",
        DEFAULT_GEMINI_EMBEDDING_MODEL,
        gemini_embedding_base_url(),
        "gemini",
    )
    mock_client = MagicMock()
    mock_create_client.return_value = mock_client
    mock_client.embeddings.create.return_value = MagicMock(data=[MagicMock(embedding=[0.1] * 1536)])

    result = embed_texts(["conteúdo da página"], use_cache=False)

    mock_create_client.assert_called_once_with("AIzaSy-test", base_url=gemini_embedding_base_url())
    mock_client.embeddings.create.assert_called_once()
    call_kwargs = mock_client.embeddings.create.call_args.kwargs
    assert call_kwargs["model"] == DEFAULT_GEMINI_EMBEDDING_MODEL
    assert call_kwargs["dimensions"] == 1536
    assert result == [[0.1] * 1536]
