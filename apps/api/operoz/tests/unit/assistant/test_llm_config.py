from unittest.mock import patch

from operoz.assistant.llm.config import (
    GEMINI_OPENAI_BASE_URL,
    get_configured_llm_base_url,
    get_llm_base_url,
    get_llm_config,
)


def test_gemini_default_base_url_when_not_configured():
    with patch(
        "operoz.assistant.llm.config.get_configuration_value",
        return_value=(None,),
    ):
        assert get_configured_llm_base_url() is None
        assert get_llm_base_url(provider_key="gemini") == GEMINI_OPENAI_BASE_URL


def test_custom_base_url_overrides_gemini_default():
    with patch(
        "operoz.assistant.llm.config.get_configuration_value",
        return_value=("https://litellm.internal/v1",),
    ):
        assert get_configured_llm_base_url() == "https://litellm.internal/v1"
        assert get_llm_base_url(provider_key="gemini") == "https://litellm.internal/v1"


def test_gemini_model_alias_maps_deprecated_ids():
    with patch("operoz.assistant.llm.config.get_api_key", return_value="sk-test"), patch(
        "operoz.assistant.llm.config.list_api_keys",
        return_value=[],
    ), patch(
        "operoz.assistant.llm.config.get_configuration_value",
        side_effect=[
            ("gemini", "gemini-1.5-flash"),
            (None,),
        ],
    ):
        _api_key, model, provider, _ = get_llm_config()
        assert provider == "gemini"
        assert model == "gemini-2.5-flash"
