from __future__ import annotations

import json
from typing import Any, Iterator

from operoz.assistant.llm.http_client import classify_llm_exception, ensure_ipv4_friendly_dns
from operoz.assistant.tools.registry import list_openai_tools
from operoz.utils.exception_logger import log_exception


class LLMChatResult:
    def __init__(
        self,
        *,
        content: str | None = None,
        tool_calls: list[dict[str, Any]] | None = None,
        model: str | None = None,
        error: str | None = None,
    ):
        self.content = content
        self.tool_calls = tool_calls or []
        self.model = model
        self.error = error


def _parse_tool_arguments(raw: str) -> dict[str, Any]:
    try:
        return json.loads(raw or "{}")
    except json.JSONDecodeError:
        return {}


def _openai_tools_to_anthropic(tools: list[dict[str, Any]] | None) -> list[dict[str, Any]] | None:
    if not tools:
        return None
    return [
        {
            "name": item["function"]["name"],
            "description": item["function"]["description"],
            "input_schema": item["function"]["parameters"],
        }
        for item in tools
    ]


def to_anthropic_messages(messages: list[dict[str, Any]]) -> tuple[str, list[dict[str, Any]]]:
    system_parts: list[str] = []
    api_messages: list[dict[str, Any]] = []

    for msg in messages:
        role = msg.get("role")
        if role == "system":
            if msg.get("content"):
                system_parts.append(str(msg["content"]))
            continue

        if role == "tool":
            api_messages.append(
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": msg.get("tool_call_id", ""),
                            "content": msg.get("content") or "",
                        }
                    ],
                }
            )
            continue

        if role == "assistant" and msg.get("tool_calls"):
            content_blocks: list[dict[str, Any]] = []
            if msg.get("content"):
                content_blocks.append({"type": "text", "text": msg["content"]})
            for tc in msg["tool_calls"]:
                fn = tc.get("function") or {}
                content_blocks.append(
                    {
                        "type": "tool_use",
                        "id": tc.get("id", ""),
                        "name": fn.get("name", ""),
                        "input": _parse_tool_arguments(fn.get("arguments", "{}")),
                    }
                )
            api_messages.append({"role": "assistant", "content": content_blocks})
            continue

        api_messages.append({"role": role, "content": msg.get("content") or ""})

    return "\n\n".join(system_parts), api_messages


def _tool_calls_from_anthropic_content(content_blocks: list[Any]) -> list[dict[str, Any]]:
    tool_calls: list[dict[str, Any]] = []
    for block in content_blocks:
        block_type = getattr(block, "type", None) or (block.get("type") if isinstance(block, dict) else None)
        if block_type != "tool_use":
            continue
        tool_id = getattr(block, "id", None) or block.get("id")
        name = getattr(block, "name", None) or block.get("name")
        raw_input = getattr(block, "input", None) if hasattr(block, "input") else block.get("input")
        tool_calls.append(
            {
                "id": tool_id,
                "type": "function",
                "function": {
                    "name": name,
                    "arguments": json.dumps(raw_input or {}),
                },
            }
        )
    return tool_calls


def _text_from_anthropic_content(content_blocks: list[Any]) -> str:
    parts: list[str] = []
    for block in content_blocks:
        block_type = getattr(block, "type", None) or (block.get("type") if isinstance(block, dict) else None)
        if block_type == "text":
            text = getattr(block, "text", None) if hasattr(block, "text") else block.get("text")
            if text:
                parts.append(str(text))
    return "".join(parts)


def anthropic_chat_completion(
    messages: list[dict[str, Any]],
    *,
    api_key: str,
    model: str,
    tools: list[dict[str, Any]] | None = None,
) -> LLMChatResult:
    try:
        import anthropic
    except ImportError:
        return LLMChatResult(error="llm_not_configured")

    system, api_messages = to_anthropic_messages(messages)
    anthropic_tools = _openai_tools_to_anthropic(tools or list_openai_tools())

    try:
        ensure_ipv4_friendly_dns()
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model=model,
            max_tokens=4096,
            system=system or anthropic.NOT_GIVEN,
            messages=api_messages,
            tools=anthropic_tools or anthropic.NOT_GIVEN,
        )
        tool_calls = _tool_calls_from_anthropic_content(response.content)
        text = _text_from_anthropic_content(response.content)
        return LLMChatResult(content=text, tool_calls=tool_calls, model=model)
    except Exception as exc:
        log_exception(exc)
        return LLMChatResult(error=classify_llm_exception(exc))


def anthropic_stream_chat_completion(
    messages: list[dict[str, Any]],
    *,
    api_key: str,
    model: str,
    tools: list[dict[str, Any]] | None = None,
) -> Iterator[dict[str, Any]]:
    try:
        import anthropic
    except ImportError:
        yield {"type": "error", "code": "llm_not_configured"}
        return

    system, api_messages = to_anthropic_messages(messages)
    anthropic_tools = _openai_tools_to_anthropic(tools or list_openai_tools())

    try:
        ensure_ipv4_friendly_dns()
        client = anthropic.Anthropic(api_key=api_key)
        content_parts: list[str] = []

        with client.messages.stream(
            model=model,
            max_tokens=4096,
            system=system or anthropic.NOT_GIVEN,
            messages=api_messages,
            tools=anthropic_tools or anthropic.NOT_GIVEN,
        ) as stream:
            for text in stream.text_stream:
                content_parts.append(text)
                yield {"type": "token", "content": text}

            final = stream.get_final_message()

        tool_calls = _tool_calls_from_anthropic_content(final.content)
        text = _text_from_anthropic_content(final.content) or "".join(content_parts)

        if tool_calls:
            yield {
                "type": "tool_calls",
                "tool_calls": tool_calls,
                "content": text,
                "model": model,
            }
        else:
            yield {"type": "complete", "content": text, "model": model}
    except Exception as exc:
        log_exception(exc)
        yield {"type": "error", "code": classify_llm_exception(exc)}
