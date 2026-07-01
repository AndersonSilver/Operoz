from operoz.utils.jira_ops.import_service import (
    infer_module_status_from_linked_issues,
    resolve_module_status,
    resolve_module_status_for_module,
)


def test_resolve_module_status_by_jira_name_concluido():
    fields = {"status": {"name": "Concluído", "statusCategory": {"key": "done"}}}
    assert resolve_module_status(fields) == "completed"


def test_resolve_module_status_uppercase_concluido():
    fields = {"status": {"name": "CONCLUÍDO", "statusCategory": {"key": "done"}}}
    assert resolve_module_status(fields) == "completed"


def test_resolve_module_status_ascii_concluido():
    fields = {"status": {"name": "CONCLUIDO"}}
    assert resolve_module_status(fields) == "completed"


def test_resolve_module_status_by_jira_name_planejado():
    fields = {"status": {"name": "Planejado", "statusCategory": {"key": "new"}}}
    assert resolve_module_status(fields) == "planned"


def test_resolve_module_status_by_status_category_done():
    fields = {"status": {"name": "Custom Done Label", "statusCategory": {"key": "done"}}}
    assert resolve_module_status(fields) == "completed"


def test_resolve_module_status_by_status_category_indeterminate():
    fields = {"status": {"name": "Em execução", "statusCategory": {"key": "indeterminate"}}}
    assert resolve_module_status(fields) == "in-progress"


def test_resolve_module_status_defaults_to_planned():
    assert resolve_module_status({}) == "planned"
    assert resolve_module_status({"status": {"name": "Unknown"}}) == "planned"
