from __future__ import annotations

import pytest

from operis.automation.templates_registry import (
    build_rule_from_template,
    get_automation_template,
    instantiate_template_graph,
    list_automation_templates,
    validate_all_pack_templates,
    _dummy_parameters,
)


@pytest.mark.unit
class TestAutomationTemplatesRegistry:
    def test_lists_five_official_templates(self):
        templates = list_automation_templates()
        assert len(templates) >= 5
        ids = {item["id"] for item in templates}
        assert "weekly-status-report" in ids
        assert "intake-welcome" in ids

    def test_validate_all_pack_templates(self):
        errors = validate_all_pack_templates()
        assert errors == []

    def test_instantiate_weekly_status_report(self):
        template = get_automation_template("weekly-status-report")
        assert template is not None
        params = _dummy_parameters(template)
        params["template_id"] = "00000000-0000-0000-0000-000000000001"
        graph = instantiate_template_graph(template, params)
        trigger = next(n for n in graph["nodes"] if n["data"]["kind"] == "trigger")
        assert trigger["data"]["catalog_key"] == "schedule.cron"
        action = next(n for n in graph["nodes"] if n["data"]["kind"] == "action")
        assert action["data"]["catalog_key"] == "action.send_email"

    def test_build_rule_from_template(self):
        template = get_automation_template("sla-sustentacao-reminder")
        assert template is not None
        payload = build_rule_from_template(template)
        assert payload["name"]
        assert payload["graph"]["nodes"]


@pytest.mark.django_db
class TestAutomationTemplateInstallAPI:
    def test_install_template_creates_rule(self, api_client, workspace, workspace_board, create_user):
        user = create_user
        api_client.force_authenticate(user=user)
        from operis.db.models import WorkspaceMember

        WorkspaceMember.objects.get_or_create(workspace=workspace, member=user, defaults={"role": 20})

        response = api_client.post(
            f"/api/workspaces/{workspace.slug}/boards/{workspace_board.slug}/automation/templates/sla-sustentacao-reminder/install/",
            {"parameters": {"message": "Teste SLA"}, "dry_run": True},
            format="json",
        )
        assert response.status_code == 201
        body = response.json()
        assert body["rule"]["name"]
        assert body["template_id"] == "sla-sustentacao-reminder"
        assert "dry_run" in body
