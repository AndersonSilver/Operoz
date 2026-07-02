from datetime import date

from operoz.utils.jira_ops.jira_dates import (
    jira_issue_dates,
    jira_search_date_fields,
    jira_search_date_fields_for_client,
    normalize_issue_date_range,
    register_jira_date_fields,
    score_start_date_field_name,
)


def test_jira_issue_dates_duedate():
    fields = {"duedate": "2026-06-14"}
    start, target = jira_issue_dates(fields)
    assert start is None
    assert target == date(2026, 6, 14)


def test_jira_issue_dates_start_custom_field():
    fields = {
        "customfield_10015": "2026-06-01",
        "duedate": "2026-06-20",
    }
    start, target = jira_issue_dates(fields)
    assert start == date(2026, 6, 1)
    assert target == date(2026, 6, 20)


def test_jira_search_date_fields_includes_duedate():
    assert "duedate" in jira_search_date_fields()


def test_score_start_date_field_name_prefers_data_inicio():
    assert score_start_date_field_name("Data de início") > score_start_date_field_name("Início da pendência")
    assert score_start_date_field_name("Data de início do problema") < 0
    assert score_start_date_field_name("Início da pendência") < 0


def test_jira_search_date_fields_includes_all_registered_date_fields():
    register_jira_date_fields(
        "cloud-test",
        "customfield_10015",
        "duedate",
        all_date_field_ids=["customfield_10015", "customfield_99999", "duedate"],
    )
    fields = jira_search_date_fields_for_client("cloud-test")
    assert "customfield_99999" in fields
    assert "customfield_10015" in fields


def test_jira_issue_dates_target_from_second_custom_field():
    """Épicos Jira podem ter início e limite em custom fields distintos (sem duedate)."""
    fields = {
        "customfield_10015": "2024-04-21",
        "customfield_10016": "2024-06-19",
    }
    start, target = jira_issue_dates(fields)
    assert start == date(2024, 4, 21)
    assert target == date(2024, 6, 19)


def test_jira_issue_dates_target_from_resolutiondate():
    fields = {
        "customfield_10015": "2024-04-21",
        "resolutiondate": "2024-06-19T10:00:00.000+0000",
    }
    start, target = jira_issue_dates(fields)
    assert start == date(2024, 4, 21)
    assert target == date(2024, 6, 19)


def test_jira_issue_dates_fallback_when_start_field_empty():
    register_jira_date_fields("cloud-fallback", "customfield_empty", "duedate")
    fields = {
        "customfield_empty": None,
        "customfield_10015": "2026-04-27",
        "duedate": "2026-06-01",
    }
    start, target = jira_issue_dates(fields)
    assert start == date(2026, 4, 27)
    assert target == date(2026, 6, 1)


def test_jira_issue_dates_swaps_when_start_after_target():
    """Import Jira: campos de data invertidos não devem quebrar o serializer."""
    fields = {
        "customfield_10015": "2026-06-20",
        "duedate": "2026-06-01",
    }
    start, target = jira_issue_dates(fields)
    assert start == date(2026, 6, 1)
    assert target == date(2026, 6, 20)


def test_normalize_issue_date_range_swaps_inverted_pair():
    start, target = normalize_issue_date_range(date(2026, 6, 20), date(2026, 6, 1))
    assert start == date(2026, 6, 1)
    assert target == date(2026, 6, 20)


def test_resolve_jira_custom_field_ids_by_name():
    from operoz.utils.jira_ops.jira_custom_fields import (
        JIRA_SYNC_CUSTOM_FIELD_SPECS,
        resolve_jira_custom_field_ids,
    )

    metadata = [
        {
            "id": "customfield_10100",
            "name": "Data de início do problema",
            "schema": {"type": "date"},
        },
        {
            "id": "customfield_10101",
            "name": "SLA do chamado",
            "schema": {"type": "date"},
        },
        {
            "id": "customfield_10015",
            "name": "Data de início",
            "schema": {"type": "date"},
        },
    ]
    resolved = resolve_jira_custom_field_ids(metadata, JIRA_SYNC_CUSTOM_FIELD_SPECS)
    assert resolved["Data de início do problema"] == "customfield_10100"
    assert resolved["SLA do chamado"] == "customfield_10101"


def test_jira_custom_field_values_from_issue():
    from operoz.utils.jira_ops.jira_custom_fields import JiraCustomFieldImportContext

    ctx = JiraCustomFieldImportContext(
        operoz_fields={},
        jira_field_ids={
            "Data de início do problema": "customfield_10100",
            "SLA do chamado": "customfield_10101",
        },
    )
    values = jira_custom_field_values_from_issue(
        {
            "customfield_10100": "2026-04-01",
            "customfield_10101": None,
        },
        ctx,
    )
    assert values["Data de início do problema"] == "2026-04-01"
    assert values["SLA do chamado"] is None
