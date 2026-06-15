"""HTTP helpers for LLM providers (Docker-friendly DNS)."""

from __future__ import annotations

import socket
from typing import Any

import httpx
from django.conf import settings
from openai import OpenAI

_IPV4_GETADDRINFO_PATCHED = False


def ensure_ipv4_friendly_dns() -> None:
    """Prefer IPv4 in getaddrinfo — evita falha DNS64/IPv6 em containers Docker."""
    global _IPV4_GETADDRINFO_PATCHED
    if _IPV4_GETADDRINFO_PATCHED:
        return

    original = socket.getaddrinfo

    def getaddrinfo_ipv4_first(
        host: Any,
        port: Any,
        family: int = 0,
        type: int = 0,
        proto: int = 0,
        flags: int = 0,
    ):
        if family in (0, socket.AF_UNSPEC):
            for fam in (socket.AF_INET, socket.AF_INET6):
                try:
                    return original(host, port, fam, type, proto, flags)
                except socket.gaierror:
                    continue
            raise socket.gaierror(socket.EAI_NONAME, f"Could not resolve {host}")
        return original(host, port, family, type, proto, flags)

    socket.getaddrinfo = getaddrinfo_ipv4_first  # type: ignore[assignment]
    _IPV4_GETADDRINFO_PATCHED = True


def llm_http_timeout() -> float:
    return float(getattr(settings, "ASSISTANT_LLM_HTTP_TIMEOUT", 90))


def create_llm_http_client() -> httpx.Client:
    ensure_ipv4_friendly_dns()
    return httpx.Client(timeout=llm_http_timeout())


def create_openai_client(api_key: str, *, base_url: str | None = None) -> OpenAI:
    ensure_ipv4_friendly_dns()
    kwargs: dict[str, object] = {
        "api_key": api_key,
        "http_client": create_llm_http_client(),
        "max_retries": 2,
    }
    if base_url:
        kwargs["base_url"] = base_url.rstrip("/")
    return OpenAI(**kwargs)


def classify_llm_exception(exc: Exception) -> str:
    name = exc.__class__.__name__
    if name in {"APIConnectionError", "ConnectError", "ConnectTimeout", "ReadTimeout", "TimeoutException"}:
        return "llm_connection_failed"
    if name in {"RateLimitError", "InternalServerError", "APIStatusError"}:
        return "llm_rate_limit"
    status_code = getattr(exc, "status_code", None)
    if status_code in (429, 500, 502, 503, 504):
        return "llm_rate_limit"
    return "llm_request_failed"


def is_retryable_llm_error(code: str) -> bool:
    return code in ("llm_rate_limit", "llm_connection_failed", "llm_request_failed")


def llm_error_message(code: str) -> str:
    if code == "llm_connection_failed":
        return (
            "Não foi possível contactar o provedor de IA (rede/DNS). "
            "Verifique conectividade do servidor com a internet."
        )
    if code == "llm_not_configured":
        return "Modelo de linguagem não configurado nesta instância."
    return "Falha ao consultar o modelo de linguagem."
