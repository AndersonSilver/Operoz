from __future__ import annotations

import csv
import hashlib
import hmac
import io
import json
import logging
from datetime import timedelta
from decimal import Decimal
from typing import Any

import requests
from django.utils import timezone

from operis.db.models import (
    Client360AuditEntry,
    Client360CrmSyncRun,
    Client360Customer,
    Client360HealthSnapshot,
    Client360WebhookDeliveryLog,
    Client360WebhookSubscription,
    Project,
    Workspace,
    WorkspaceClient360EnterpriseSettings,
)
from operis.db.models.workspace_client_360_enterprise_settings import DEFAULT_PHASE_FLAGS

logger = logging.getLogger(__name__)

CLIENT360_WEBHOOK_EVENTS = (
    "health_change",
    "report_missing",
    "sla_breach",
    "health_score_alert",
)

MAX_WEBHOOK_RETRIES = 3


def load_enterprise_settings(workspace_id) -> dict:
    if not workspace_id:
        return _default_enterprise_settings()
    row = WorkspaceClient360EnterpriseSettings.objects.filter(
        workspace_id=workspace_id,
        deleted_at__isnull=True,
    ).first()
    if not row:
        return _default_enterprise_settings()
    flags = {**DEFAULT_PHASE_FLAGS, **(row.phase_flags or {})}
    return {
        "phase_flags": flags,
        "list_grouping_mode": row.list_grouping_mode,
        "crm_enabled": row.crm_enabled,
        "crm_provider": row.crm_provider,
        "crm_stale": row.crm_stale,
        "crm_last_sync_at": row.crm_last_sync_at.isoformat() if row.crm_last_sync_at else None,
        "retention_weeks": row.retention_weeks,
        "data_region": row.data_region,
        "bi_export_enabled": row.bi_export_enabled,
        "guest_sso_enabled": row.guest_sso_enabled,
        "guest_magic_link_fallback": row.guest_magic_link_fallback,
        "is_custom": True,
    }


def _default_enterprise_settings() -> dict:
    return {
        "phase_flags": dict(DEFAULT_PHASE_FLAGS),
        "list_grouping_mode": WorkspaceClient360EnterpriseSettings.GROUPING_PROJECT,
        "crm_enabled": False,
        "crm_provider": "",
        "crm_stale": False,
        "crm_last_sync_at": None,
        "retention_weeks": 52,
        "data_region": "EU",
        "bi_export_enabled": True,
        "guest_sso_enabled": False,
        "guest_magic_link_fallback": True,
        "is_custom": False,
    }


def is_phase_enabled(settings: dict, phase: int | str) -> bool:
    key = str(phase)
    return bool((settings.get("phase_flags") or DEFAULT_PHASE_FLAGS).get(key, True))


def serialize_customer(row: Client360Customer) -> dict:
    return {
        "id": str(row.id),
        "name": row.name,
        "external_crm_id": row.external_crm_id,
        "segment": row.segment,
        "account_owner": row.account_owner,
        "revenue_contract": float(row.revenue_contract) if row.revenue_contract is not None else None,
        "project_count": row.projects.filter(archived_at__isnull=True).count(),
    }


def group_clients_by_customer(clients: list[dict], projects: list[Project]) -> list[dict]:
    customer_by_project = {
        str(p.id): str(p.client360_customer_id) if p.client360_customer_id else None for p in projects
    }
    customers = Client360Customer.objects.filter(
        id__in={cid for cid in customer_by_project.values() if cid},
        deleted_at__isnull=True,
    )
    customer_map = {str(c.id): c for c in customers}
    grouped: dict[str, dict] = {}
    orphans: list[dict] = []

    for client in clients:
        cid = customer_by_project.get(client["project_id"])
        if not cid or cid not in customer_map:
            orphans.append(client)
            continue
        bucket = grouped.setdefault(
            cid,
            {
                "customer_id": cid,
                "customer_name": customer_map[cid].name,
                "projects": [],
                "rollup": {
                    "health_critical": 0,
                    "health_warning": 0,
                    "total_overdue": 0,
                    "total_support_open": 0,
                },
            },
        )
        bucket["projects"].append(client)
        if client.get("health") == "critical":
            bucket["rollup"]["health_critical"] += 1
        elif client.get("health") == "warning":
            bucket["rollup"]["health_warning"] += 1
        bucket["rollup"]["total_overdue"] += (client.get("issues") or {}).get("overdue", 0)
        bucket["rollup"]["total_support_open"] += (client.get("support") or {}).get("open_count", 0)

    rows = list(grouped.values()) + [{"customer_id": None, "customer_name": c["name"], "projects": [c], "rollup": None} for c in orphans]
    return rows


def record_client360_audit(
    *,
    workspace_id,
    entity_type: str,
    entity_id: str,
    action: str,
    actor_id,
    snapshot: dict | None = None,
) -> Client360AuditEntry:
    return Client360AuditEntry.objects.create(
        workspace_id=workspace_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        actor_id=actor_id,
        snapshot=snapshot or {},
    )


def _sign_payload(secret: str, body: bytes) -> str:
    return hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()


def dispatch_client360_webhook(
    workspace_id,
    event_type: str,
    payload: dict[str, Any],
) -> list[dict]:
    subs = Client360WebhookSubscription.objects.filter(
        workspace_id=workspace_id,
        is_active=True,
        deleted_at__isnull=True,
    )
    results = []
    envelope = {
        "schema_version": 1,
        "event_type": event_type,
        "emitted_at": timezone.now().isoformat(),
        "payload": payload,
    }
    body = json.dumps(envelope, default=str).encode("utf-8")
    for sub in subs:
        events = sub.event_types or list(CLIENT360_WEBHOOK_EVENTS)
        if event_type not in events:
            continue
        result = {"subscription_id": str(sub.id), "event_type": event_type, "status": "success"}
        for attempt in range(1, MAX_WEBHOOK_RETRIES + 1):
            log = Client360WebhookDeliveryLog.objects.create(
                subscription=sub,
                event_type=event_type,
                payload=envelope,
                attempt=attempt,
            )
            try:
                response = requests.post(
                    sub.url,
                    data=body,
                    headers={
                        "Content-Type": "application/json",
                        "X-Operoz-Signature": _sign_payload(sub.secret, body),
                        "X-Operoz-Event": event_type,
                    },
                    timeout=10,
                )
                log.response_code = response.status_code
                if response.ok:
                    log.status = Client360WebhookDeliveryLog.STATUS_SUCCESS
                    log.save(update_fields=["response_code", "status", "updated_at"])
                    break
                log.status = Client360WebhookDeliveryLog.STATUS_FAILED
                log.error_message = response.text[:500]
                log.save(update_fields=["response_code", "status", "error_message", "updated_at"])
            except requests.RequestException as exc:
                log.status = Client360WebhookDeliveryLog.STATUS_FAILED
                log.error_message = str(exc)[:500]
                log.save(update_fields=["status", "error_message", "updated_at"])
            if attempt == MAX_WEBHOOK_RETRIES:
                result["status"] = "failed"
        results.append(result)
    return results


def run_crm_sync(workspace_id) -> dict:
    row, _ = WorkspaceClient360EnterpriseSettings.objects.get_or_create(workspace_id=workspace_id)
    if not row.crm_enabled:
        return {"ok": False, "error": "crm_disabled"}
    config = row.crm_config or {}
    updated = 0
    for customer in Client360Customer.objects.filter(workspace_id=workspace_id, deleted_at__isnull=True):
        crm_key = customer.external_crm_id or str(customer.id)
        remote = (config.get("accounts") or {}).get(crm_key, {})
        if remote.get("revenue") is not None:
            customer.revenue_contract = Decimal(str(remote["revenue"]))
            if remote.get("name"):
                customer.name = remote["name"]
            customer.save(update_fields=["revenue_contract", "name", "updated_at"])
            updated += 1
    row.crm_last_sync_at = timezone.now()
    row.crm_stale = False
    row.save(update_fields=["crm_last_sync_at", "crm_stale", "updated_at"])
    run = Client360CrmSyncRun.objects.create(
        workspace_id=workspace_id,
        status=Client360CrmSyncRun.STATUS_OK,
        customers_updated=updated,
        details={"provider": row.crm_provider or "manual"},
    )
    return {"ok": True, "customers_updated": updated, "run_id": str(run.id)}


def build_bi_fact_rows(clients: list[dict], *, workspace_slug: str) -> list[dict]:
    rows = []
    for client in clients:
        finops = client.get("finops") or {}
        rows.append(
            {
                "workspace_slug": workspace_slug,
                "project_id": client["project_id"],
                "client_name": client["name"],
                "health": client.get("health"),
                "health_score": client.get("health_score"),
                "overdue": (client.get("issues") or {}).get("overdue", 0),
                "support_open": (client.get("support") or {}).get("open_count", 0),
                "report_coverage": (client.get("status_report") or {}).get("coverage"),
                "margin_pct": finops.get("margin_pct"),
                "utilization_pct": (finops.get("utilization") or {}).get("pct"),
            }
        )
    return rows


def build_bi_csv_content(rows: list[dict]) -> str:
    if not rows:
        return "workspace_slug,project_id,client_name\n"
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)
    return buffer.getvalue()


def build_instance_rollup(workspaces: list[Workspace]) -> dict:
    from operis.utils.client_360 import (
        aggregate_client360_issue_stats,
        aggregate_module_counts,
        aggregate_status_reports,
        build_client_row,
        current_week_period,
    )
    from operis.utils.client_360_health_alerts import build_client360_list_summary
    from operis.utils.client_360_health_settings import (
        load_board_health_config_map,
        load_board_score_alert_threshold_map,
    )
    from operis.utils.client_360_operational import load_board_support_sla_map
    from operis.db.models import Issue

    period = current_week_period()
    items = []
    totals = {
        "workspaces": 0,
        "clients": 0,
        "health_critical": 0,
        "total_overdue": 0,
    }
    for workspace in workspaces:
        projects = list(
            Project.objects.filter(
                workspace=workspace,
                archived_at__isnull=True,
                board_id__isnull=False,
            ).select_related("board")[:500]
        )
        if not projects:
            continue
        project_ids = [p.id for p in projects]
        today = timezone.now().date()
        issue_qs = Issue.issue_objects.filter(workspace=workspace, project_id__in=project_ids)
        board_ids = list({p.board_id for p in projects if p.board_id})
        project_board_map = {str(p.id): str(p.board_id) if p.board_id else None for p in projects}
        issue_stats_map = aggregate_client360_issue_stats(
            issue_qs,
            today,
            project_ids=project_ids,
            project_board_map=project_board_map,
            sla_map=load_board_support_sla_map(board_ids),
        )
        module_counts = aggregate_module_counts(project_ids)
        report_stats_map = aggregate_status_reports(project_ids, period)
        health_config_map = load_board_health_config_map(board_ids)
        alert_threshold_map = load_board_score_alert_threshold_map(board_ids)
        clients = [
            build_client_row(
                project,
                period=period,
                modules_total=module_counts.get(str(project.id), 0),
                issue_stats=issue_stats_map.get(str(project.id)),
                report_stats=report_stats_map.get(str(project.id)),
                board=project.board,
                health_config=health_config_map.get(str(project.board_id)) if project.board_id else None,
                score_alert_threshold=alert_threshold_map.get(str(project.board_id)) if project.board_id else None,
            )
            for project in projects
        ]
        summary = build_client360_list_summary(clients)
        items.append(
            {
                "workspace_slug": workspace.slug,
                "workspace_name": workspace.name,
                "summary": summary,
            }
        )
        totals["workspaces"] += 1
        totals["clients"] += summary["total_clients"]
        totals["health_critical"] += summary["health_critical"]
        totals["total_overdue"] += summary["total_overdue"]
    return {"period": {"start": period.start.isoformat(), "end": period.end.isoformat()}, "totals": totals, "workspaces": items}


def purge_retention_data(workspace_id, retention_weeks: int) -> dict:
    cutoff = timezone.now().date() - timedelta(weeks=retention_weeks)
    deleted_snapshots, _ = Client360HealthSnapshot.objects.filter(
        workspace_id=workspace_id,
        period_start__lt=cutoff,
    ).delete()
    deleted_audit, _ = Client360AuditEntry.objects.filter(
        workspace_id=workspace_id,
        created_at__lt=timezone.now() - timedelta(weeks=retention_weeks),
    ).delete()
    return {"snapshots_deleted": deleted_snapshots, "audit_deleted": deleted_audit}
