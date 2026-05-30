# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

"""Importa Jira OPS → Operis: cliente=projeto, épico=módulo, card=issue, subtarefa=sub-issue."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, asdict
from typing import Any

from plane.app.permissions import ROLE
from plane.app.serializers import IssueCreateSerializer, ProjectSerializer
from plane.db.models import (
    Board,
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
from plane.db.models.module import ModuleStatus
from plane.utils.board_custom_fields import sync_board_custom_fields_to_project
from plane.utils.board_issue_types import sync_board_issue_types_to_project

from .clients import load_client_aliases, resolve_client, slug_identifier

JIRA_STATE_TO_OPERIS = {
    "para fazer": "Todo",
    "iniciado": "In Progress",
    "concluido": "Done",
    "concluído": "Done",
    "com pendencia": "In Progress",
    "com pendência": "In Progress",
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


def issue_description_html(key: str, fields: dict) -> str:
    desc = fields.get("description") or ""
    if desc:
        return f"<p>{desc}</p><p><em>Jira: {key}</em></p>"
    return f"<p><em>Jira: {key}</em></p>"


def resolve_state(project: Project, fields: dict) -> State | None:
    status_name = ((fields.get("status") or {}).get("name") or "").lower()
    state_name = JIRA_STATE_TO_OPERIS.get(status_name, "Todo")
    state = State.objects.filter(project=project, name=state_name).first()
    if not state:
        state = State.objects.filter(project=project, default=True).first()
    return state


def issue_would_update(issue: Issue, fields: dict, key: str, project: Project) -> bool:
    name = (fields.get("summary") or key)[:255]
    if issue.name != name:
        return True
    html = issue_description_html(key, fields)
    if issue.description_html != html:
        return True
    state = resolve_state(project, fields)
    if state and issue.state_id != state.id:
        return True
    return False


def _touch_issue_fields(issue: Issue, fields: dict, key: str, project: Project) -> bool:
    if not issue_would_update(issue, fields, key, project):
        return False
    name = (fields.get("summary") or key)[:255]
    issue.name = name
    issue.description_html = issue_description_html(key, fields)
    state = resolve_state(project, fields)
    if state:
        issue.state_id = state.id
    issue.save(update_fields=["name", "description_html", "state_id", "updated_at"])
    return True


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
    board = Board.objects.get(slug=board_slug, workspace=workspace)
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
            summary = ((epic.get("fields") or {}).get("summary") or key)[:255]
            mod = existing_modules.get(key)
            if not mod:
                preview.modules_new += 1
                if preview.sample_new_modules is not None and len(preview.sample_new_modules) < 6:
                    preview.sample_new_modules.append(f"{key}: {summary}")
            else:
                preview.modules_existing += 1
                if mod.name != summary:
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
) -> JiraOpsImportResult:
    workspace = Workspace.objects.get(slug=workspace_slug)
    board = Board.objects.get(slug=board_slug, workspace=workspace)
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

        for epic in client_epics:
            key = epic["key"]
            summary = ((epic.get("fields") or {}).get("summary") or key)[:255]
            mod = Module.objects.filter(project=project, external_id=key).first()
            if not mod:
                mod = Module.objects.create(
                    project=project,
                    workspace=workspace,
                    name=summary,
                    external_id=key,
                    external_source="jira",
                    status=ModuleStatus.PLANNED.value,
                    created_by=actor,
                )
            elif mod.name != summary:
                mod.name = summary
                mod.save(update_fields=["name", "updated_at"])
            epic_key_to_module[key] = mod

    if projects_only or not issues_list:
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
            if _touch_issue_fields(existing_issue, fields, key, project):
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

        state = resolve_state(project, fields)
        ser = IssueCreateSerializer(
            data={
                "name": (fields.get("summary") or key)[:255],
                "description_html": issue_description_html(key, fields),
                "state_id": str(state.id) if state else None,
                "priority": "none",
            },
            context={
                "project_id": str(project.id),
                "workspace_id": str(workspace.id),
                "default_assignee_id": project.default_assignee_id,
            },
        )
        ser.is_valid(raise_exception=True)
        inst = ser.save()
        Issue.objects.filter(pk=inst.pk).update(external_id=key, external_source="jira")
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
            if _touch_issue_fields(existing_issue, fields, key, project):
                result.updated_subtasks += 1
                changed = True
            if not changed and existing_issue.parent_id == parent_issue.id:
                pass
            return

        state = resolve_state(project, fields)
        ser = IssueCreateSerializer(
            data={
                "name": (fields.get("summary") or key)[:255],
                "description_html": issue_description_html(key, fields),
                "state_id": str(state.id) if state else None,
                "priority": "none",
                "parent_id": str(parent_issue.id),
            },
            context={
                "project_id": str(project.id),
                "workspace_id": str(workspace.id),
                "default_assignee_id": project.default_assignee_id,
            },
        )
        ser.is_valid(raise_exception=True)
        inst = ser.save()
        Issue.objects.filter(pk=inst.pk).update(external_id=key, external_source="jira")
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

    return result
