from __future__ import annotations

from decimal import Decimal

import pytest

from operoz.db.models import Client360Customer, Project, WorkspaceClient360EnterpriseSettings
from operoz.utils.client_360_enterprise import (
    group_clients_by_customer,
    is_phase_enabled,
    load_enterprise_settings,
    run_crm_sync,
)


@pytest.mark.unit
class TestClient360EnterpriseUtils:
    def test_default_enterprise_settings(self):
        settings = load_enterprise_settings(None)
        assert settings["phase_flags"]["4"] is True
        assert settings["list_grouping_mode"] == WorkspaceClient360EnterpriseSettings.GROUPING_PROJECT
        assert settings["is_custom"] is False

    def test_is_phase_enabled(self):
        settings = {"phase_flags": {"4": False, "5": True}}
        assert is_phase_enabled(settings, 4) is False
        assert is_phase_enabled(settings, "5") is True

    def test_group_clients_by_customer(self, db, workspace, workspace_board, create_user):
        customer = Client360Customer.objects.create(workspace=workspace, name="Acme Corp")
        project_a = Project.objects.create(
            name="Acme A",
            identifier="ACMA",
            workspace=workspace,
            board=workspace_board,
            created_by=create_user,
            client360_customer=customer,
        )
        project_b = Project.objects.create(
            name="Acme B",
            identifier="ACMB",
            workspace=workspace,
            board=workspace_board,
            created_by=create_user,
            client360_customer=customer,
        )
        clients = [
            {
                "project_id": str(project_a.id),
                "name": "Acme A",
                "health": "ok",
                "issues": {"overdue": 1},
                "support": {"open_count": 0},
            },
            {
                "project_id": str(project_b.id),
                "name": "Acme B",
                "health": "critical",
                "issues": {"overdue": 0},
                "support": {"open_count": 2},
            },
        ]
        groups = group_clients_by_customer(clients, [project_a, project_b])
        acme = next(g for g in groups if g.get("customer_id") == str(customer.id))
        assert len(acme["projects"]) == 2
        assert acme["rollup"]["health_critical"] == 1
        assert acme["rollup"]["total_overdue"] == 1

    def test_run_crm_sync_updates_revenue(self, db, workspace):
        customer = Client360Customer.objects.create(
            workspace=workspace,
            name="CRM Client",
            external_crm_id="crm-1",
        )
        row, _ = WorkspaceClient360EnterpriseSettings.objects.get_or_create(workspace=workspace)
        row.crm_enabled = True
        row.crm_config = {"accounts": {"crm-1": {"revenue": "250000.50", "name": "CRM Client Updated"}}}
        row.save()
        result = run_crm_sync(workspace.id)
        assert result["ok"] is True
        assert result["customers_updated"] == 1
        customer.refresh_from_db()
        assert customer.revenue_contract == Decimal("250000.50")
        assert customer.name == "CRM Client Updated"
