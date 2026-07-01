from unittest.mock import MagicMock, patch

from operoz.utils.jira_ops.import_service import resolve_module_status_for_module


def test_resolve_module_status_for_module_uses_issue_inference_when_jira_missing():
    module = MagicMock()
    fields: dict = {}

    with patch(
        "operoz.utils.jira_ops.import_service.infer_module_status_from_linked_issues",
        return_value="completed",
    ):
        assert resolve_module_status_for_module(module, fields) == "completed"


def test_resolve_module_status_for_module_prefers_jira_in_progress():
    module = MagicMock()
    fields = {"status": {"name": "Em andamento", "statusCategory": {"key": "indeterminate"}}}

    with patch(
        "operoz.utils.jira_ops.import_service.infer_module_status_from_linked_issues",
        return_value="completed",
    ):
        assert resolve_module_status_for_module(module, fields) == "in-progress"
