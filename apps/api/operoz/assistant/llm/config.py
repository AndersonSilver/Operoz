from __future__ import annotations

import os
from typing import List, Tuple

from operoz.assistant.llm.degraded_mode import get_fallback_model, should_use_degraded_mode
from operoz.assistant.llm.key_pool import get_api_key, list_api_keys
from operoz.license.utils.instance_value import get_configuration_value
from operoz.utils.exception_logger import log_exception


class LLMProvider:
    name: str = ""
    models: List[str] = []
    default_model: str = ""
    supports_tools: bool = False
    allows_custom_model: bool = True


class OpenAIProvider(LLMProvider):
    name = "OpenAI"
    models = [
        "gpt-4o-mini",
        "gpt-4o",
        "gpt-4.1-mini",
        "gpt-4.1",
        "gpt-3.5-turbo",
        "o1-mini",
        "o1-preview",
    ]
    default_model = "gpt-4o-mini"
    supports_tools = True


class AnthropicProvider(LLMProvider):
    name = "Anthropic"
    models = [
        "claude-3-5-sonnet-20240620",
        "claude-3-5-haiku-20241022",
        "claude-3-haiku-20240307",
        "claude-3-opus-20240229",
        "claude-3-sonnet-20240229",
    ]
    default_model = "claude-3-5-sonnet-20240620"
    supports_tools = True


class GeminiProvider(LLMProvider):
    name = "Google Gemini"
    models = [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
    ]
    default_model = "gemini-2.5-flash"
    supports_tools = False


# Modelos antigos guardados no God Mode → equivalente atual (Google descontinua IDs legados).
_GEMINI_MODEL_ALIASES: dict[str, str] = {
    "gemini-1.5-flash": "gemini-2.5-flash",
    "gemini-1.5-pro-latest": "gemini-2.5-flash",
    "gemini-1.5-pro": "gemini-2.5-flash",
    "gemini-pro": "gemini-2.0-flash",
}


class OpenAICompatibleProvider(LLMProvider):
    """Ollama, Groq, OpenRouter, Azure OpenAI, vLLM, etc."""

    name = "OpenAI-compatible"
    models = []
    default_model = ""
    supports_tools = True
    allows_custom_model = True


SUPPORTED_PROVIDERS = {
    "openai": OpenAIProvider,
    "anthropic": AnthropicProvider,
    "gemini": GeminiProvider,
    "openai_compatible": OpenAICompatibleProvider,
}

# OpenAI-compatible surface exposta pelo Google AI Studio / Gemini API.
GEMINI_OPENAI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"


def list_llm_providers() -> list[dict[str, object]]:
    return [
        {
            "key": key,
            "name": cls.name,
            "models": cls.models,
            "default_model": cls.default_model,
            "supports_tools": cls.supports_tools,
            "allows_custom_model": cls.allows_custom_model,
        }
        for key, cls in SUPPORTED_PROVIDERS.items()
    ]


def get_configured_llm_base_url() -> str | None:
    """URL explícita em LLM_BASE_URL (proxy LiteLLM, OpenRouter, etc.)."""
    (base_url,) = get_configuration_value(
        [{"key": "LLM_BASE_URL", "default": os.environ.get("LLM_BASE_URL", "") or None}]
    )
    if base_url:
        return str(base_url).strip() or None
    return None


def get_llm_base_url(*, provider_key: str | None = None) -> str | None:
    configured = get_configured_llm_base_url()
    if configured:
        return configured
    if (provider_key or "").lower() == "gemini":
        return GEMINI_OPENAI_BASE_URL
    return None


def _model_is_allowed(provider_cls: type[LLMProvider], model: str) -> bool:
    if not model:
        return False
    if provider_cls.allows_custom_model:
        return True
    return model in provider_cls.models


def get_llm_config(
    *,
    workspace=None,
    degraded: bool | None = None,
) -> Tuple[str | None, str | None, str | None, bool]:
    """Returns (api_key, model, provider_key, degraded_mode_active)."""
    api_key = get_api_key()
    if not api_key and list_api_keys():
        api_key = list_api_keys()[0]

    provider_key, model = get_configuration_value(
        [
            {"key": "LLM_PROVIDER", "default": os.environ.get("LLM_PROVIDER", "openai")},
            {"key": "LLM_MODEL", "default": os.environ.get("LLM_MODEL", None)},
        ]
    )

    if not api_key:
        (legacy_key,) = get_configuration_value(
            [{"key": "LLM_API_KEY", "default": os.environ.get("LLM_API_KEY", None)}]
        )
        api_key = legacy_key

    provider_cls = SUPPORTED_PROVIDERS.get((provider_key or "").lower())
    if not provider_cls:
        log_exception(ValueError(f"Unsupported provider: {provider_key}"))
        return None, None, None, False

    if not api_key:
        log_exception(ValueError(f"Missing API key for provider: {provider_cls.name}"))
        return None, None, None, False

    if not model:
        model = provider_cls.default_model

    if (provider_key or "").lower() == "gemini":
        model = _GEMINI_MODEL_ALIASES.get(model, model)

    degraded_active = False
    if degraded is None and workspace is not None:
        degraded = should_use_degraded_mode(workspace)
    if degraded:
        fallback = get_fallback_model(provider_key or "", model)
        if fallback:
            model = fallback
            degraded_active = True

    if not _model_is_allowed(provider_cls, model):
        log_exception(ValueError(f"Model {model} not supported by {provider_cls.name}"))
        return None, None, None, False

    return api_key, model, provider_key, degraded_active
