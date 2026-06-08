import pytest
from unittest.mock import MagicMock, patch

from operis.automation.domain import DomainEvent
from operis.automation.matching import extract_trigger_from_graph, rule_trigger_matches_event
from operis.automation.secrets import redact_for_storage, resolve_config_value
from operis.automation.governance import check_dispatch_allowed, is_circuit_open, record_rule_failure


@pytest.mark.unit
class TestTriggerMatching:
    def test_extract_trigger_from_graph(self):
        graph = {
            "nodes": [
                {
                    "id": "t1",
                    "data": {
                        "kind": "trigger",
                        "catalog_key": "issue.created",
                        "config": {"event_type": "issue.created"},
                    },
                }
            ]
        }
        assert extract_trigger_from_graph(graph) == ("issue.created", {"event_type": "issue.created"})

    def test_rule_trigger_matches_event(self):
        rule = MagicMock()
        graph = {
            "nodes": [
                {
                    "id": "t1",
                    "data": {
                        "kind": "trigger",
                        "catalog_key": "issue.created",
                        "config": {"event_type": "issue.created"},
                    },
                }
            ]
        }
        rule.graph = graph
        rule.published_graph = graph
        event = DomainEvent.create(
            event_type="issue.created",
            workspace_id="ws-1",
            board_id="board-1",
            actor_id="user-1",
            entity_type="issue",
            entity_id="issue-1",
            project_id="proj-1",
            payload={},
        )
        assert rule_trigger_matches_event(rule, event) is True

    def test_rule_trigger_skips_wrong_event(self):
        rule = MagicMock()
        graph = {
            "nodes": [
                {
                    "id": "t1",
                    "data": {
                        "kind": "trigger",
                        "catalog_key": "issue.updated",
                        "config": {"event_type": "issue.updated"},
                    },
                }
            ]
        }
        rule.graph = graph
        rule.published_graph = graph
        event = DomainEvent.create(
            event_type="issue.created",
            workspace_id="ws-1",
            board_id="board-1",
            actor_id=None,
            entity_type="issue",
            entity_id="issue-1",
            project_id="proj-1",
            payload={},
        )
        assert rule_trigger_matches_event(rule, event) is False


@pytest.mark.unit
class TestSecrets:
    def test_redact_sensitive_keys(self):
        payload = {"url": "https://x.com", "api_key": "secret123", "nested": {"token": "abc"}}
        redacted = redact_for_storage(payload)
        assert redacted["api_key"] == "[REDACTED]"
        assert redacted["nested"]["token"] == "[REDACTED]"
        assert redacted["url"] == "https://x.com"

    @patch("operis.db.models.BoardAutomationSecret")
    @patch("operis.automation.secrets.decrypt_data")
    def test_resolve_secret_ref(self, mock_decrypt, mock_secret_model):
        secret = MagicMock()
        secret.value_encrypted = "enc"
        mock_secret_model.objects.filter.return_value.first.return_value = secret
        mock_decrypt.return_value = "resolved-value"

        result = resolve_config_value("Bearer {{secret:webhook_token}}", workspace_id="ws-1")
        assert result == "Bearer resolved-value"


@pytest.mark.unit
class TestGovernance:
    @patch("operis.automation.governance.redis_instance")
    def test_circuit_opens_after_failures(self, mock_redis_factory):
        ri = MagicMock()
        mock_redis_factory.return_value = ri
        ri.incr.return_value = 10
        ri.exists.return_value = True

        record_rule_failure("rule-1")
        assert is_circuit_open("rule-1") is True

    @patch("operis.automation.governance.redis_instance")
    def test_rate_limit_blocks_dispatch(self, mock_redis_factory):
        ri = MagicMock()
        mock_redis_factory.return_value = ri
        ri.get.side_effect = lambda key: b"99999"

        rule = MagicMock()
        rule.id = "rule-1"
        event = DomainEvent.create(
            event_type="issue.created",
            workspace_id="ws-1",
            board_id="board-1",
            actor_id=None,
            entity_type="issue",
            entity_id="issue-1",
            project_id="proj-1",
            payload={},
        )

        allowed, reason = check_dispatch_allowed(rule, event)
        assert allowed is False
        assert reason in ("board_rate_limit", "workspace_rate_limit")
