import pytest

from operoz.assistant.llm.anthropic_client import to_anthropic_messages


@pytest.mark.unit
class TestAnthropicClient:
    def test_to_anthropic_messages_splits_system_and_tool_results(self):
        system, messages = to_anthropic_messages(
            [
                {"role": "system", "content": "You are Operoz"},
                {"role": "user", "content": "Olá"},
                {
                    "role": "assistant",
                    "content": "",
                    "tool_calls": [
                        {
                            "id": "toolu_1",
                            "type": "function",
                            "function": {"name": "search_issues", "arguments": '{"query": "bug"}'},
                        }
                    ],
                },
                {"role": "tool", "tool_call_id": "toolu_1", "content": '{"issues": []}'},
            ]
        )

        assert "You are Operoz" in system
        assert messages[0] == {"role": "user", "content": "Olá"}
        assert messages[1]["role"] == "assistant"
        assert messages[1]["content"][0]["type"] == "tool_use"
        assert messages[2]["content"][0]["type"] == "tool_result"
