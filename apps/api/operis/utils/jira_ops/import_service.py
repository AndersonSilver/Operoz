"""Importa Jira OPS → Operis: cliente=projeto, épico=módulo, card=issue, subtarefa=sub-issue."""

from __future__ import annotations

import html
import unicodedata
from collections import defaultdict
from dataclasses import dataclass, asdict
from typing import Any

from django.db.models import Max

from operis.app.permissions import ROLE
from operis.app.serializers import IssueCreateSerializer, ProjectSerializer
from operis.db.models import (
    DEFAULT_STATES,
    Issue,
    Module,
    ModuleIssue,
    Project,
    ProjectMember,
    State,
    User,
    Workspace,
)
from operis.db.models.module import ModuleStatus
from operis.utils.board_custom_fields import sync_board_custom_fields_to_project
from operis.utils.board_issue_types import sync_board_issue_types_to_project
from operis.utils.project_default_features import ensure_project_default_features

from .adf_to_html import description_needs_jira_repair, resolve_jira_description_html
from .clients import load_client_aliases, resolve_client, slug_identifier
from .jira_attachments import sync_jira_description_media
from .jira_custom_fields import (
    JiraCustomFieldImportContext,
    build_custom_field_import_context,
    issue_jira_custom_fields_would_update,
    prepare_board_projects_for_jira_custom_fields,
    sync_issue_jira_custom_fields,
)
from .jira_client import JiraOpsClient
from .jira_dates import jira_issue_dates, set_active_jira_cloud
from .workspace_config import get_board_for_jira_ops, get_workspace_credentials

JIRA_STATE_TO_OPERIS = {
    "para fazer": "Todo",
    "iniciado": "In Progress",
    "concluido": "Done",
    "concluído": "Done",
    "com pendencia": "In Progress",
    "com pendência": "In Progress",
}

JIRA_MODULE_STATUS_TO_OPERIS: dict[str, str] = {
    "backlog": ModuleStatus.BACKLOG.value,
    "planejado": ModuleStatus.PLANNED.value,
    "para fazer": ModuleStatus.PLANNED.value,
    "todo": ModuleStatus.PLANNED.value,
    "iniciado": ModuleStatus.IN_PROGRESS.value,
    "em andamento": ModuleStatus.IN_PROGRESS.value,
    "in progress": ModuleStatus.IN_PROGRESS.value,
    "com pendencia": ModuleStatus.IN_PROGRESS.value,
    "com pendência": ModuleStatus.IN_PROGRESS.value,
    "pausado": ModuleStatus.PAUSED.value,
    "paused": ModuleStatus.PAUSED.value,
    "concluido": ModuleStatus.COMPLETED.value,
    "concluído": ModuleStatus.COMPLETED.value,
    "concluida": ModuleStatus.COMPLETED.value,
    "concluída": ModuleStatus.COMPLETED.value,
    "done": ModuleStatus.COMPLETED.value,
    "finalizado": ModuleStatus.COMPLETED.value,
    "finalizada": ModuleStatus.COMPLETED.value,
    "encerrado": ModuleStatus.COMPLETED.value,
    "encerrada": ModuleStatus.COMPLETED.value,
    "fechado": ModuleStatus.COMPLETED.value,
    "fechada": ModuleStatus.COMPLETED.value,
    "closed": ModuleStatus.COMPLETED.value,
    "resolvido": ModuleStatus.COMPLETED.value,
    "resolvida": ModuleStatus.COMPLETED.value,
    "cancelado": ModuleStatus.CANCELLED.value,
    "cancelled": ModuleStatus.CANCELLED.value,
}

JIRA_STATUS_CATEGORY_TO_MODULE: dict[str, str] = {
    "new": ModuleStatus.PLANNED.value,
    "indeterminate": ModuleStatus.IN_PROGRESS.value,
    "done": ModuleStatus.COMPLETED.value,
}


@dataclass
class JiraOpsImportResult:
    clients: int = 0
    modules: int = 0
    skipped_epics: int = 0
    created_cards: int = 0
    linked_cards: int = 0
    updated_cards: int = 0
    created_subtasks: int = 0
    linked_subtasks: int = 0
    updated_subtasks: int = 0
    epics_fetched: int = 0
    issues_fetched: int = 0

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def is_epic(issue: dict) -> bool:
    it = (issue.get("fields") or {}).get("issuetype") or {}
    return (it.get("name") or "").lower() in ("projeto", "epic", "épico")


def is_subtask(issue: dict) -> bool:
    it = (issue.get("fields") or {}).get("issuetype") or {}
    return bool(it.get("subtask"))


def parent_jira_key(issue: dict) -> str | None:
    parent = (issue.get("fields") or {}).get("parent") or {}
    return parent.get("key")


def issue_description_html(
    key: str,
    fields: dict,
    *,
    media_urls: dict[str, str] | None = None,
    existing_description_html: str | None = None,
) -> str:
    desc_html = resolve_jira_description_html(
        fields.get("description"),
        media_urls=media_urls,
        existing_description_html=existing_description_html,
    )
    jira_footer = f"<p><em>Jira: {html.escape(key)}</em></p>"
    if desc_html:
        return f"{desc_html}{jira_footer}"
    return jira_footer


def resolve_state(project: Project, fields: dict) -> State | None:
    status_name = ((fields.get("status") or {}).get("name") or "").lower()
    state_name = JIRA_STATE_TO_OPERIS.get(status_name, "Todo")
    state = State.objects.filter(project=project, name=state_name).first()
    if not state:
        state = State.objects.filter(project=project, default=True).first()
    return state


def _normalize_jira_status_name(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", name or "")
    ascii_name = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    return ascii_name.lower().strip()


def resolve_module_status(fields: dict) -> str:
    """Map Jira epic (Projeto) status → Operis module status."""
    status = fields.get("status") or {}
    status_name = _normalize_jira_status_name(status.get("name") or "")
    mapped = JIRA_MODULE_STATUS_TO_OPERIS.get(status_name)
    if mapped:
        return mapped

    category_key = _normalize_jira_status_name((status.get("statusCategory") or {}).get("key") or "")
    category_name = _normalize_jira_status_name((status.get("statusCategory") or {}).get("name") or "")
    for candidate in (category_key, category_name):
        if candidate in JIRA_STATUS_CATEGORY_TO_MODULE:
            return JIRA_STATUS_CATEGORY_TO_MODULE[candidate]
        if candidate in {"done", "complete", "completed", "concluido", "concluida"}:
            return ModuleStatus.COMPLETED.value

    return ModuleStatus.PLANNED.value


def infer_module_status_from_linked_issues(module: Module) -> str | None:
    """When Jira omits epic status, infer from linked work items."""
    groups = list(
        ModuleIssue.objects.filter(
            module=module,
            deleted_at__isnull=True,
            issue__deleted_at__isnull=True,
            issue__archived_at__isnull=True,
        ).values_list("issue__state__group", flat=True)
    )
    if not groups:
        return None

    active_groups = [group for group in groups if group != "cancelled"]
    if not active_groups:
        return ModuleStatus.CANCELLED.value
    if all(group == "completed" for group in active_groups):
        return ModuleStatus.COMPLETED.value
    if any(group == "started" for group in active_groups):
        return ModuleStatus.IN_PROGRESS.value
    return None


def _find_module_for_epic(project: Project, epic_key: str, summary: str) -> Module | None:
    """Localiza módulo importado por external_id (Jira key) ou pelo nome do épico."""
    mod = Module.objects.filter(project=project, external_id=epic_key, deleted_at__isnull=True).first()
    if mod:
        return mod

    mod = Module.objects.filter(project=project, name=summary, deleted_at__isnull=True).first()
    if not mod:
        return None

    backfill: list[str] = []
    if mod.external_id != epic_key:
        mod.external_id = epic_key
        backfill.append("external_id")
    if mod.external_source != "jira":
        mod.external_source = "jira"
        backfill.append("external_source")
    if backfill:
        backfill.append("updated_at")
        mod.save(update_fields=backfill)
    return mod


def _sync_module_statuses_from_work_items(board) -> int:
    """Após sync: módulos com 100% dos itens Done passam a Concluído."""
    updated = 0
    modules = Module.objects.filter(project__board=board, deleted_at__isnull=True)
    for mod in modules:
        inferred = infer_module_status_from_linked_issues(mod)
        if not inferred or inferred == mod.status:
            continue
        if inferred == ModuleStatus.COMPLETED.value and mod.status in {
            ModuleStatus.PLANNED.value,
            ModuleStatus.BACKLOG.value,
            ModuleStatus.IN_PROGRESS.value,
        }:
            mod.status = inferred
            mod.save(update_fields=["status", "updated_at"])
            updated += 1
        elif inferred == ModuleStatus.IN_PROGRESS.value and mod.status in {
            ModuleStatus.PLANNED.value,
            ModuleStatus.BACKLOG.value,
        }:
            mod.status = inferred
            mod.save(update_fields=["status", "updated_at"])
            updated += 1
    return updated


def resolve_module_status_for_module(module: Module, fields: dict) -> str:
    """Prefer Jira epic status; fall back to linked issues when cards are all Done."""
    jira_status = resolve_module_status(fields)
    if jira_status != ModuleStatus.PLANNED.value:
        return jira_status

    inferred = infer_module_status_from_linked_issues(module)
    if inferred == ModuleStatus.COMPLETED.value:
        return inferred
    if inferred and not (fields.get("status") or {}).get("name"):
        return inferred
    return jira_status


def _finalize_imported_modules(epic_key_to_module: dict[str, Module], epics: list[dict]) -> None:
    """Atualiza status e datas dos módulos após cards ligados (fallback de data limite)."""
    epic_by_key = {e["key"]: e for e in epics if e.get("key")}

    for key, mod in epic_key_to_module.items():
        epic = epic_by_key.get(key)
        if not epic:
            continue

        fields = epic.get("fields") or {}
        start, target = jira_issue_dates(fields)
        module_status = resolve_module_status_for_module(mod, fields)

        if target is None:
            target = (
                Issue.objects.filter(
                    issue_module__module=mod,
                    target_date__isnull=False,
                    deleted_at__isnull=True,
                ).aggregate(max_target=Max("target_date"))["max_target"]
            )

        update_fields: list[str] = []
        if mod.start_date != start:
            mod.start_date = start
            update_fields.append("start_date")
        if mod.target_date != target:
            mod.target_date = target
            update_fields.append("target_date")
        if mod.status != module_status:
            mod.status = module_status
            update_fields.append("status")
        if update_fields:
            update_fields.append("updated_at")
            mod.save(update_fields=update_fields)


def issue_would_update(
    issue: Issue,
    fields: dict,
    key: str,
    project: Project,
    *,
    client: JiraOpsClient | None = None,
    custom_ctx: JiraCustomFieldImportContext | None = None,
) -> bool:
    name = (fields.get("summary") or key)[:255]
    if issue.name != name:
        return True
    if description_needs_jira_repair(issue.description_html):
        return True
    if client and fields.get("attachment"):
        return True
    desc_html = issue_description_html(key, fields, existing_description_html=issue.description_html)
    if issue.description_html != desc_html:
        return True
    start, target = jira_issue_dates(fields)
    if issue.start_date != start:
        return True
    if issue.target_date != target:
        return True
    state = resolve_state(project, fields)
    if state and issue.state_id != state.id:
        return True
    if custom_ctx and issue_jira_custom_fields_would_update(issue, fields, custom_ctx):
        return True
    return False


def _apply_jira_issue_content(
    issue: Issue,
    fields: dict,
    key: str,
    project: Project,
    workspace: Workspace,
    actor: User,
    *,
    client: JiraOpsClient | None = None,
    custom_ctx: JiraCustomFieldImportContext | None = None,
) -> bool:
    media_urls: dict[str, str] = {}
    if client:
        media_urls = sync_jira_description_media(
            client,
            issue=issue,
            attachments=fields.get("attachment"),
            workspace=workspace,
            project=project,
            actor=actor,
        )

    name = (fields.get("summary") or key)[:255]
    desc_html = issue_description_html(
        key,
        fields,
        media_urls=media_urls or None,
        existing_description_html=issue.description_html,
    )
    start, target = jira_issue_dates(fields)
    state = resolve_state(project, fields)

    changed = False
    if issue.name != name:
        issue.name = name
        changed = True
    if issue.description_html != desc_html:
        issue.description_html = desc_html
        changed = True
    if issue.start_date != start:
        issue.start_date = start
        changed = True
    if issue.target_date != target:
        issue.target_date = target
        changed = True
    if state and issue.state_id != state.id:
        issue.state_id = state.id
        changed = True

    if changed:
        issue.save(
            update_fields=[
                "name",
                "description_html",
                "start_date",
                "target_date",
                "state_id",
                "updated_at",
            ]
        )

    if custom_ctx and sync_issue_jira_custom_fields(
        issue, fields, custom_ctx, project, workspace, actor
    ):
        changed = True

    return changed


def _touch_issue_fields(
    issue: Issue,
    fields: dict,
    key: str,
    project: Project,
    workspace: Workspace,
    actor: User,
    *,
    client: JiraOpsClient | None = None,
    custom_ctx: JiraCustomFieldImportContext | None = None,
) -> bool:
    if not issue_would_update(
        issue, fields, key, project, client=client, custom_ctx=custom_ctx
    ):
        return False
    return _apply_jira_issue_content(
        issue,
        fields,
        key,
        project,
        workspace,
        actor,
        client=client,
        custom_ctx=custom_ctx,
    )


def _issue_create_payload(fields: dict, key: str, project: Project, **extra: Any) -> dict[str, Any]:
    state = resolve_state(project, fields)
    start, target = jira_issue_dates(fields)
    payload: dict[str, Any] = {
        "name": (fields.get("summary") or key)[:255],
        "description_html": issue_description_html(key, fields),
        "state_id": str(state.id) if state else None,
        "priority": "none",
        **extra,
    }
    if start is not None:
        payload["start_date"] = start
    if target is not None:
        payload["target_date"] = target
    return payload


@dataclass
class JiraOpsImportPreview:
    epics_fetched: int = 0
    issues_fetched: int = 0
    skipped_epics: int = 0
    projects_new: int = 0
    projects_existing: int = 0
    modules_new: int = 0
    modules_existing: int = 0
    modules_renamed: int = 0
    cards_new: int = 0
    cards_updated: int = 0
    cards_unchanged: int = 0
    cards_link_only: int = 0
    subtasks_new: int = 0
    subtasks_updated: int = 0
    subtasks_unchanged: int = 0
    subtasks_parent_missing: int = 0
    new_project_names: list[str] | None = None
    sample_new_modules: list[str] | None = None
    sample_new_cards: list[str] | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def preview_jira_ops_import(
    *,
    workspace_slug: str,
    board_slug: str,
    epics: list[dict],
    issues_list: list[dict],
) -> JiraOpsImportPreview:
    workspace = Workspace.objects.get(slug=workspace_slug)
    creds = get_workspace_credentials(workspace)
    if creds:
        set_active_jira_cloud(creds.cloud_id)
    board = get_board_for_jira_ops(workspace, board_slug)
    preview = JiraOpsImportPreview(
        epics_fetched=len(epics),
        issues_fetched=len(issues_list),
        new_project_names=[],
        sample_new_modules=[],
        sample_new_cards=[],
    )

    epic_issues = [e for e in epics if is_epic(e)]
    clients: dict[str, list[dict]] = defaultdict(list)
    for epic in epic_issues:
        summary = (epic.get("fields") or {}).get("summary") or ""
        client = resolve_client(summary, load_client_aliases())
        if not client:
            preview.skipped_epics += 1
            continue
        clients[client].append(epic)

    existing_project_ids = set(
        Project.objects.filter(workspace=workspace).values_list("identifier", flat=True)
    )
    existing_modules: dict[str, Module] = {
        m.external_id: m
        for m in Module.objects.filter(
            project__board=board,
            external_source="jira",
            external_id__isnull=False,
        ).exclude(external_id="")
    }

    epic_context: dict[str, dict[str, Any]] = {}

    for client_name, client_epics in clients.items():
        identifier = slug_identifier(client_name)
        if identifier in existing_project_ids:
            preview.projects_existing += 1
        else:
            preview.projects_new += 1
            if preview.new_project_names is not None and len(preview.new_project_names) < 8:
                preview.new_project_names.append(client_name)

        project = Project.objects.filter(workspace=workspace, identifier=identifier).first()

        for epic in client_epics:
            key = epic["key"]
            epic_fields = epic.get("fields") or {}
            summary = (epic_fields.get("summary") or key)[:255]
            mod = existing_modules.get(key)
            if not mod:
                preview.modules_new += 1
                if preview.sample_new_modules is not None and len(preview.sample_new_modules) < 6:
                    preview.sample_new_modules.append(f"{key}: {summary}")
            else:
                preview.modules_existing += 1
                start, target = jira_issue_dates(epic_fields)
                module_status = resolve_module_status_for_module(mod, epic_fields)
                if (
                    mod.name != summary
                    or mod.start_date != start
                    or mod.target_date != target
                    or mod.status != module_status
                ):
                    preview.modules_renamed += 1

            epic_context[key] = {"module": mod, "project": project}

    all_keys = [i.get("key") for i in issues_list if i.get("key")]
    if not all_keys:
        return preview

    existing_issues: dict[str, Issue] = {
        i.external_id: i
        for i in Issue.objects.filter(
            project__board=board,
            external_source="jira",
            external_id__in=all_keys,
        ).select_related("project")
    }

    linked_module_issue_pairs: set[tuple[str, str]] = set(
        ModuleIssue.objects.filter(
            module__project__board=board,
            issue__external_id__in=all_keys,
        ).values_list("module_id", "issue_id")
    )

    jira_key_to_issue: dict[str, Issue] = dict(existing_issues)
    pending_parent_keys: set[str] = set()

    for issue in issues_list:
        if is_epic(issue) or is_subtask(issue):
            continue
        parent_key = parent_jira_key(issue)
        if not parent_key or parent_key not in epic_context:
            continue
        key = issue.get("key")
        if not key:
            continue
        fields = issue.get("fields") or {}
        ctx = epic_context[parent_key]
        module = ctx["module"]
        project = ctx["project"]

        existing = existing_issues.get(key)
        if not existing:
            preview.cards_new += 1
            pending_parent_keys.add(key)
            if preview.sample_new_cards is not None and len(preview.sample_new_cards) < 6:
                preview.sample_new_cards.append(f"{key}: {(fields.get('summary') or key)[:80]}")
            continue

        jira_key_to_issue[key] = existing
        if project and issue_would_update(existing, fields, key, project):
            preview.cards_updated += 1
        else:
            preview.cards_unchanged += 1

        if module and module.pk and (str(module.id), str(existing.id)) not in linked_module_issue_pairs:
            preview.cards_link_only += 1

    for issue in issues_list:
        if not is_subtask(issue):
            continue
        key = issue.get("key")
        if not key:
            continue
        parent_key = parent_jira_key(issue)
        if not parent_key:
            continue
        fields = issue.get("fields") or {}
        parent_issue = jira_key_to_issue.get(parent_key)
        parent_will_be_created = parent_key in pending_parent_keys

        if not parent_issue and not parent_will_be_created:
            preview.subtasks_parent_missing += 1
            continue

        existing = existing_issues.get(key)
        if not existing:
            preview.subtasks_new += 1
            continue

        if not parent_issue:
            preview.subtasks_new += 1
            continue

        project = parent_issue.project
        changed_parent = existing.parent_id != parent_issue.id
        if issue_would_update(existing, fields, key, project) or changed_parent:
            preview.subtasks_updated += 1
        else:
            preview.subtasks_unchanged += 1

    return preview


def run_jira_ops_import(
    *,
    workspace_slug: str,
    board_slug: str,
    actor: User,
    epics: list[dict],
    issues_list: list[dict],
    projects_only: bool = False,
    jira_client: JiraOpsClient | None = None,
) -> JiraOpsImportResult:
    workspace = Workspace.objects.get(slug=workspace_slug)
    creds = get_workspace_credentials(workspace)
    custom_ctx: JiraCustomFieldImportContext | None = None

    if creds:
        set_active_jira_cloud(creds.cloud_id)
        if jira_client is None:
            try:
                jira_client = JiraOpsClient(creds)
            except Exception:
                jira_client = None

    board = get_board_for_jira_ops(workspace, board_slug)

    if jira_client:
        try:
            custom_ctx = build_custom_field_import_context(
                board, workspace, actor, jira_client._field_metadata
            )
            prepare_board_projects_for_jira_custom_fields(board, actor)
        except Exception:
            custom_ctx = None

    result = JiraOpsImportResult(epics_fetched=len(epics), issues_fetched=len(issues_list))

    epic_issues = [e for e in epics if is_epic(e)]
    clients: dict[str, list[dict]] = defaultdict(list)
    for epic in epic_issues:
        summary = (epic.get("fields") or {}).get("summary") or ""
        client = resolve_client(summary, load_client_aliases())
        if not client:
            result.skipped_epics += 1
            continue
        clients[client].append(epic)

    result.clients = len(clients)
    result.modules = sum(len(v) for v in clients.values())

    epic_key_to_module: dict[str, Module] = {
        m.external_id: m
        for m in Module.objects.filter(
            project__board=board,
            external_source="jira",
            external_id__isnull=False,
        ).exclude(external_id="")
    }

    for client_name, client_epics in clients.items():
        identifier = slug_identifier(client_name)
        project = Project.objects.filter(workspace=workspace, identifier=identifier).first()
        if not project:
            ser = ProjectSerializer(
                data={
                    "name": client_name,
                    "identifier": identifier,
                    "board": str(board.id),
                    "description_html": f"<p>Importado Jira OPS — {client_name}</p>",
                },
                context={"workspace_id": workspace.id},
            )
            ser.is_valid(raise_exception=True)
            project = ser.save()
            ProjectMember.objects.get_or_create(
                project=project,
                member=actor,
                defaults={"role": ROLE.ADMIN.value},
            )
            State.objects.bulk_create(
                [
                    State(
                        name=s["name"],
                        color=s["color"],
                        project=project,
                        sequence=s["sequence"],
                        workspace=workspace,
                        group=s["group"],
                        default=s.get("default", False),
                        created_by=actor,
                    )
                    for s in DEFAULT_STATES
                ]
            )
            sync_board_issue_types_to_project(project, actor)
            sync_board_custom_fields_to_project(project, actor)

        ensure_project_default_features(project)

        for epic in client_epics:
            key = epic["key"]
            fields = epic.get("fields") or {}
            summary = (fields.get("summary") or key)[:255]
            start, target = jira_issue_dates(fields)
            module_status = resolve_module_status(fields)
            mod = _find_module_for_epic(project, key, summary)
            if not mod:
                mod = Module.objects.create(
                    project=project,
                    workspace=workspace,
                    name=summary,
                    external_id=key,
                    external_source="jira",
                    status=module_status,
                    start_date=start,
                    target_date=target,
                    created_by=actor,
                )
            else:
                module_status = resolve_module_status_for_module(mod, fields)
                update_fields: list[str] = []
                if mod.name != summary:
                    mod.name = summary
                    update_fields.append("name")
                if mod.start_date != start:
                    mod.start_date = start
                    update_fields.append("start_date")
                if mod.target_date != target:
                    mod.target_date = target
                    update_fields.append("target_date")
                if mod.status != module_status:
                    mod.status = module_status
                    update_fields.append("status")
                if update_fields:
                    update_fields.append("updated_at")
                    mod.save(update_fields=update_fields)
            epic_key_to_module[key] = mod

    if projects_only or not issues_list:
        _sync_module_statuses_from_work_items(board)
        return result

    jira_key_to_issue: dict[str, Issue] = {
        i.external_id: i
        for i in Issue.objects.filter(
            project__board=board,
            external_source="jira",
            external_id__isnull=False,
        ).exclude(external_id="")
    }

    def upsert_card(issue: dict, module: Module) -> None:
        key = issue.get("key")
        if not key:
            return
        fields = issue.get("fields") or {}
        project = module.project

        existing_issue = Issue.objects.filter(project=project, external_id=key).first()
        if existing_issue:
            jira_key_to_issue[key] = existing_issue
            if _touch_issue_fields(
                existing_issue,
                fields,
                key,
                project,
                workspace,
                actor,
                client=jira_client,
                custom_ctx=custom_ctx,
            ):
                result.updated_cards += 1
            _, created = ModuleIssue.objects.get_or_create(
                module=module,
                issue=existing_issue,
                project=project,
                workspace=workspace,
                defaults={"created_by": actor, "updated_by": actor},
            )
            if created:
                result.linked_cards += 1
            return

        ser = IssueCreateSerializer(
            data=_issue_create_payload(fields, key, project),
            context={
                "project_id": str(project.id),
                "workspace_id": str(workspace.id),
                "default_assignee_id": project.default_assignee_id,
            },
        )
        ser.is_valid(raise_exception=True)
        inst = ser.save()
        Issue.objects.filter(pk=inst.pk).update(external_id=key, external_source="jira")
        inst.refresh_from_db()
        _apply_jira_issue_content(
            inst,
            fields,
            key,
            project,
            workspace,
            actor,
            client=jira_client,
            custom_ctx=custom_ctx,
        )
        jira_key_to_issue[key] = inst
        ModuleIssue.objects.get_or_create(
            module=module,
            issue=inst,
            project=project,
            workspace=workspace,
            defaults={"created_by": actor, "updated_by": actor},
        )
        result.created_cards += 1

    def upsert_subtask(issue: dict, parent_issue: Issue) -> None:
        key = issue.get("key")
        if not key:
            return
        fields = issue.get("fields") or {}
        project = parent_issue.project

        existing_issue = Issue.objects.filter(project=project, external_id=key).first()
        if existing_issue:
            jira_key_to_issue[key] = existing_issue
            changed = False
            if existing_issue.parent_id != parent_issue.id:
                existing_issue.parent_id = parent_issue.id
                existing_issue.save(update_fields=["parent_id", "updated_at"])
                result.linked_subtasks += 1
                changed = True
            if _touch_issue_fields(
                existing_issue,
                fields,
                key,
                project,
                workspace,
                actor,
                client=jira_client,
                custom_ctx=custom_ctx,
            ):
                result.updated_subtasks += 1
                changed = True
            if not changed and existing_issue.parent_id == parent_issue.id:
                pass
            return

        ser = IssueCreateSerializer(
            data=_issue_create_payload(
                fields,
                key,
                project,
                parent_id=str(parent_issue.id),
            ),
            context={
                "project_id": str(project.id),
                "workspace_id": str(workspace.id),
                "default_assignee_id": project.default_assignee_id,
            },
        )
        ser.is_valid(raise_exception=True)
        inst = ser.save()
        Issue.objects.filter(pk=inst.pk).update(external_id=key, external_source="jira")
        inst.refresh_from_db()
        _apply_jira_issue_content(
            inst,
            fields,
            key,
            project,
            workspace,
            actor,
            client=jira_client,
            custom_ctx=custom_ctx,
        )
        jira_key_to_issue[key] = inst
        result.created_subtasks += 1

    for issue in issues_list:
        if is_epic(issue) or is_subtask(issue):
            continue
        parent_key = parent_jira_key(issue)
        if not parent_key or parent_key not in epic_key_to_module:
            continue
        upsert_card(issue, epic_key_to_module[parent_key])

    for issue in issues_list:
        if not is_subtask(issue):
            continue
        parent_key = parent_jira_key(issue)
        if not parent_key:
            continue
        parent_issue = jira_key_to_issue.get(parent_key)
        if not parent_issue:
            continue
        upsert_subtask(issue, parent_issue)

    _finalize_imported_modules(epic_key_to_module, epic_issues)
    _sync_module_statuses_from_work_items(board)

    return result
