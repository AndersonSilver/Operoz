from __future__ import annotations

import json
from typing import Any, Iterator

from operoz.assistant.llm.anthropic_client import anthropic_chat_completion, anthropic_stream_chat_completion
from operoz.assistant.llm.config import (
    SUPPORTED_PROVIDERS,
    get_configured_llm_base_url,
    get_llm_base_url,
    get_llm_config,
)
from operoz.assistant.llm.http_client import (
    classify_llm_exception,
    create_openai_client,
    is_retryable_llm_error,
    llm_exception_detail,
)
from operoz.assistant.llm.key_pool import iter_available_keys, record_key_failure, record_key_success
from operoz.utils.exception_logger import log_exception


class LLMChatResult:
    def __init__(
        self,
        *,
        content: str | None = None,
        tool_calls: list[dict[str, Any]] | None = None,
        model: str | None = None,
        error: str | None = None,
        error_detail: str | None = None,
        degraded_mode: bool = False,
    ):
        self.content = content
        self.tool_calls = tool_calls or []
        self.model = model
        self.error = error
        self.error_detail = error_detail
        self.degraded_mode = degraded_mode


def _openai_messages(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for msg in messages:
        entry: dict[str, Any] = {"role": msg["role"], "content": msg.get("content") or ""}
        if msg.get("tool_calls"):
            entry["tool_calls"] = msg["tool_calls"]
        if msg.get("tool_call_id"):
            entry["tool_call_id"] = msg["tool_call_id"]
        out.append(entry)
    return out


def _max_key_attempts() -> int:
    keys = iter_available_keys()
    return max(1, len(keys))


def chat_completion(
    messages: list[dict[str, Any]],
    *,
    tools: list[dict[str, Any]] | None = None,
    workspace=None,
) -> LLMChatResult:
    last_error = "llm_not_configured"
    last_detail: str | None = None
    for _ in range(_max_key_attempts()):
        api_key, model, provider_key, degraded_mode = get_llm_config(workspace=workspace)
        if not api_key or not model or not provider_key:
            return LLMChatResult(error="llm_not_configured")

        provider_cls = SUPPORTED_PROVIDERS.get(provider_key.lower())
        if not provider_cls or not provider_cls.supports_tools:
            result = _legacy_completion(messages, api_key, model, provider_key)
            result.degraded_mode = degraded_mode
            if not result.error:
                record_key_success(api_key)
            return result

        if provider_key.lower() == "anthropic":
            result = anthropic_chat_completion(messages, api_key=api_key, model=model, tools=tools)
            if result.error:
                last_error = result.error
                if is_retryable_llm_error(result.error):
                    record_key_failure(api_key)
                    continue
                return LLMChatResult(error=result.error, degraded_mode=degraded_mode)
            record_key_success(api_key)
            return LLMChatResult(
                content=result.content,
                tool_calls=result.tool_calls,
                model=result.model,
                degraded_mode=degraded_mode,
            )

        try:
            client = create_openai_client(
                api_key,
                base_url=get_llm_base_url(provider_key=provider_key),
            )
            kwargs: dict[str, Any] = {
                "model": model,
                "messages": _openai_messages(messages),
            }
            if tools:
                kwargs["tools"] = tools
                kwargs["tool_choice"] = "auto"

            response = client.chat.completions.create(**kwargs)
            choice = response.choices[0].message
            tool_calls: list[dict[str, Any]] = []
            if choice.tool_calls:
                for tc in choice.tool_calls:
                    tool_calls.append(
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments,
                            },
                        }
                    )
            record_key_success(api_key)
            return LLMChatResult(
                content=choice.content,
                tool_calls=tool_calls,
                model=model,
                degraded_mode=degraded_mode,
            )
        except Exception as exc:
            log_exception(exc)
            last_error = classify_llm_exception(exc)
            last_detail = llm_exception_detail(exc)
            record_key_failure(api_key)
            if not is_retryable_llm_error(last_error):
                break
    return LLMChatResult(error=last_error, error_detail=last_detail)


def _legacy_completion(
    messages: list[dict[str, Any]],
    api_key: str,
    model: str,
    provider_key: str,
) -> LLMChatResult:
    try:
        provider = provider_key.lower()
        custom_base = get_configured_llm_base_url()
        base_url = get_llm_base_url(provider_key=provider_key)
        model_id = f"gemini/{model}" if provider == "gemini" and custom_base else model
        client = create_openai_client(api_key, base_url=base_url)
        response = client.chat.completions.create(
            model=model_id,
            messages=_openai_messages(messages),
        )
        text = response.choices[0].message.content or ""
        return LLMChatResult(content=text, model=model_id)
    except Exception as exc:
        log_exception(exc)
        return LLMChatResult(
            error=classify_llm_exception(exc),
            error_detail=llm_exception_detail(exc),
        )


def stream_chat_completion(
    messages: list[dict[str, Any]],
    *,
    tools: list[dict[str, Any]] | None = None,
    workspace=None,
) -> Iterator[dict[str, Any]]:
    """Yield token chunks for the final assistant turn; yields tool_calls dict if model requests tools."""
    last_error = "llm_not_configured"
    last_detail: str | None = None
    for _ in range(_max_key_attempts()):
        api_key, model, provider_key, degraded_mode = get_llm_config(workspace=workspace)
        if not api_key or not model or not provider_key:
            yield {"type": "error", "code": "llm_not_configured"}
            return

        if degraded_mode:
            yield {"type": "degraded_mode", "active": True, "model": model}

        provider_cls = SUPPORTED_PROVIDERS.get(provider_key.lower())
        if not provider_cls or not provider_cls.supports_tools:
            result = _legacy_completion(messages, api_key, model, provider_key)
            if result.error:
                last_error = result.error
                last_detail = result.error_detail
                record_key_failure(api_key)
                continue
            record_key_success(api_key)
            if result.content:
                yield {"type": "token", "content": result.content}
            yield {"type": "complete", "content": result.content or "", "model": result.model}
            return

        if provider_key.lower() == "anthropic":
            failed = False
            for event in anthropic_stream_chat_completion(messages, api_key=api_key, model=model, tools=tools):
                if event.get("type") == "error":
                    failed = True
                    last_error = str(event.get("code") or "llm_request_failed")
                yield event
            if failed:
                record_key_failure(api_key)
                continue
            record_key_success(api_key)
            return

        try:
            yield from _stream_openai(
                messages,
                api_key=api_key,
                model=model,
                tools=tools,
                provider_key=provider_key,
            )
            record_key_success(api_key)
            return
        except Exception as exc:
            log_exception(exc)
            last_error = classify_llm_exception(exc)
            last_detail = llm_exception_detail(exc)
            record_key_failure(api_key)
            if not is_retryable_llm_error(last_error):
                break

    yield {"type": "error", "code": last_error, "detail": last_detail}


def _stream_openai(
    messages: list[dict[str, Any]],
    *,
    api_key: str,
    model: str,
    tools: list[dict[str, Any]] | None,
    provider_key: str,
) -> Iterator[dict[str, Any]]:
    client = create_openai_client(api_key, base_url=get_llm_base_url(provider_key=provider_key))
    kwargs: dict[str, Any] = {
        "model": model,
        "messages": _openai_messages(messages),
        "stream": True,
    }
    if tools:
        kwargs["tools"] = tools
        kwargs["tool_choice"] = "auto"

    stream = client.chat.completions.create(**kwargs)
    content_parts: list[str] = []
    tool_calls_acc: dict[int, dict[str, Any]] = {}

    for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta
        if delta.content:
            content_parts.append(delta.content)
            yield {"type": "token", "content": delta.content}
        if delta.tool_calls:
            for tc in delta.tool_calls:
                idx = tc.index
                entry = tool_calls_acc.setdefault(
                    idx,
                    {"id": "", "type": "function", "function": {"name": "", "arguments": ""}},
                )
                if tc.id:
                    entry["id"] = tc.id
                if tc.function:
                    if tc.function.name:
                        entry["function"]["name"] = tc.function.name
                    if tc.function.arguments:
                        entry["function"]["arguments"] += tc.function.arguments

    if tool_calls_acc:
        tool_calls = [tool_calls_acc[i] for i in sorted(tool_calls_acc)]
        yield {"type": "tool_calls", "tool_calls": tool_calls, "content": "".join(content_parts), "model": model}
    else:
        yield {"type": "complete", "content": "".join(content_parts), "model": model}


def parse_tool_arguments(raw: str) -> dict[str, Any]:
    try:
        return json.loads(raw or "{}")
    except json.JSONDecodeError:
        return {}
