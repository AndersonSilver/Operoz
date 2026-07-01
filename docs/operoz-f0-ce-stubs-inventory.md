# F0-4 — Inventário CE stubs (`apps/web/ce` = `@/plane-web`)

**Descoberta:** no Operoz, `@/plane-web/*` aponta para `apps/web/ce/*` (`tsconfig.json`). Não existe pasta `plane-web` separada.

**Critério stub:** ficheiro com `return null` ou `return <></>` como implementação principal (CE placeholder).

**Total encontrado (jun/2026):** **87 ficheiros** com pelo menos um stub explícito.

---

## Por área (prioridade para paridade)

### Alta — bloqueia UX visível

| Ficheiro                                                      | Feature Plane           | Fase alvo |
| ------------------------------------------------------------- | ----------------------- | --------- |
| `ce/components/workspace/members/members-activity-button.tsx` | Audit membros workspace | F1        |
| `ce/components/workflow/*.tsx` (4 ficheiros)                  | Workflows + drag guard  | F7        |
| `ce/components/automations/root.tsx`                          | Automações custom UI    | F7        |
| `ce/components/gantt-chart/dependency/*.tsx` (4)              | Dependências timeline   | F4        |
| `ce/components/issues/worklog/**/*.tsx` (3)                   | Time tracking UI CE     | F7        |
| `ce/components/issues/bulk-operations/root.tsx`               | Bulk ops CE layer       | F7        |
| `ce/components/views/publish/modal.tsx`                       | Publicar vista          | F5        |
| `ce/components/views/access-controller.tsx`                   | Permissões vista        | F5        |

### Média — CE / teamspace (Board Operoz substitui parte)

| Ficheiro                                                         | Feature            | Nota        |
| ---------------------------------------------------------------- | ------------------ | ----------- |
| `ce/components/workspace/sidebar/teams-sidebar-list.tsx`         | Teamspaces sidebar | Usar Board  |
| `ce/components/projects/teamspaces/teamspace-list.tsx`           | Teamspaces projeto | Usar Board  |
| `ce/components/issues/filters/team-project.tsx`                  | Filtro team        | Board scope |
| `ce/components/issues/issue-layouts/empty-states/team-*.tsx` (3) | Empty team         | Board       |

### Média — páginas / wiki CE

| Ficheiro                                           | Feature                    | Fase |
| -------------------------------------------------- | -------------------------- | ---- |
| `ce/components/pages/modals/*.tsx`                 | Wiki modals                | F6   |
| `ce/components/pages/header/*.tsx` (4)             | Share, lock, collaborators | F6   |
| `ce/components/pages/navigation-pane/**/*.tsx` (2) | Wiki pane                  | F6   |
| `ce/components/pages/extra-actions.tsx`            | Pages extras               | F6   |

### Baixa — billing / subscription / desktop

| Ficheiro                                                  | Feature     | Fase |
| --------------------------------------------------------- | ----------- | ---- |
| `ce/components/common/subscription/subscription-pill.tsx` | Billing     | F16  |
| `ce/components/workspace/upgrade-badge.tsx`               | Planos      | F16  |
| `ce/components/desktop/sidebar-workspace-menu.tsx`        | Desktop app | F18  |

### Implementados em CE (não são stub vazio)

| Ficheiro                                                 | Estado                                 |
| -------------------------------------------------------- | -------------------------------------- |
| `ce/components/issues/issue-modal/issue-type-select.tsx` | **Implementado** — `useBoardIssueType` |
| `ce/components/workflow/use-workflow-drag-n-drop.ts`     | Lógica parcial (overlays stub)         |

---

## Lista completa de ficheiros stub (87)

```
ce/components/automations/root.tsx
ce/components/breadcrumbs/board.tsx
ce/components/breadcrumbs/common.tsx
ce/components/breadcrumbs/project-feature.tsx
ce/components/breadcrumbs/project.tsx
ce/components/command-palette/power-k/pages/context-based/root.tsx
ce/components/comments/comment-block.tsx
ce/components/common/subscription/subscription-pill.tsx
ce/components/cycles/additional-actions.tsx
ce/components/cycles/analytics-sidebar/base.tsx
ce/components/cycles/end-cycle/modal.tsx
ce/components/de-dupe/de-dupe-button.tsx
ce/components/de-dupe/duplicate-modal/root.tsx
ce/components/de-dupe/duplicate-popover/root.tsx
ce/components/de-dupe/issue-block/button-label.tsx
ce/components/desktop/sidebar-workspace-menu.tsx
ce/components/editor/embeds/mentions/root.tsx
ce/components/epics/epic-modal/modal.tsx
ce/components/estimates/estimate-list-item-buttons.tsx
ce/components/estimates/inputs/time-input.tsx
ce/components/estimates/points/delete.tsx
ce/components/estimates/update/modal.tsx
ce/components/gantt-chart/dependency/blockDraggables/left-draggable.tsx
ce/components/gantt-chart/dependency/blockDraggables/right-draggable.tsx
ce/components/gantt-chart/dependency/dependency-paths.tsx
ce/components/gantt-chart/dependency/draggable-dependency-path.tsx
ce/components/gantt-chart/layers/additional-layers.tsx
ce/components/home/header.tsx
ce/components/inbox/source-pill.tsx
ce/components/issues/bulk-operations/root.tsx
ce/components/issues/filters/applied-filters/issue-types.tsx
ce/components/issues/filters/issue-types.tsx
ce/components/issues/filters/team-project.tsx
ce/components/issues/issue-detail-widgets/action-buttons.tsx
ce/components/issues/issue-detail-widgets/collapsibles.tsx
ce/components/issues/issue-detail-widgets/modals.tsx
ce/components/issues/issue-details/additional-activity-root.tsx
ce/components/issues/issue-details/additional-properties.tsx
ce/components/issues/issue-details/issue-creator.tsx
ce/components/issues/issue-details/issue-properties-activity/root.tsx
ce/components/issues/issue-details/issue-type-activity.tsx
ce/components/issues/issue-details/issue-type-switcher.tsx
ce/components/issues/issue-details/parent-select-root.tsx
ce/components/issues/issue-details/sidebar/date-alert.tsx
ce/components/issues/issue-details/sidebar/transfer-hop-info.tsx
ce/components/issues/issue-layouts/additional-properties.tsx
ce/components/issues/issue-layouts/empty-states/team-issues.tsx
ce/components/issues/issue-layouts/empty-states/team-project.tsx
ce/components/issues/issue-layouts/empty-states/team-view-issues.tsx
ce/components/issues/issue-layouts/issue-stats.tsx
ce/components/issues/issue-layouts/quick-action-dropdowns/duplicate-modal.tsx
ce/components/issues/issue-modal/modal-additional-properties.tsx
ce/components/issues/issue-modal/provider.tsx
ce/components/issues/issue-modal/template-select.tsx
ce/components/issues/quick-add/root.tsx
ce/components/issues/worklog/activity/root.tsx
ce/components/issues/worklog/activity/worklog-create-button.tsx
ce/components/issues/worklog/property/root.tsx
ce/components/pages/extra-actions.tsx
ce/components/pages/header/collaborators-list.tsx
ce/components/pages/header/lock-control.tsx
ce/components/pages/header/move-control.tsx
ce/components/pages/header/share-control.tsx
ce/components/pages/modals/modals.tsx
ce/components/pages/modals/move-page-modal.tsx
ce/components/pages/navigation-pane/tab-panels/assets.tsx
ce/components/pages/navigation-pane/tab-panels/root.tsx
ce/components/projects/create/attributes.tsx
ce/components/projects/create/template-select.tsx
ce/components/projects/teamspaces/teamspace-list.tsx
ce/components/sidebar/app-switcher.tsx
ce/components/views/access-controller.tsx
ce/components/views/filters/access-filter.tsx
ce/components/views/helper.tsx
ce/components/views/publish/modal.tsx
ce/components/workflow/workflow-disabled-message.tsx
ce/components/workflow/workflow-disabled-overlay.tsx
ce/components/workflow/workflow-group-tree.tsx
ce/components/workspace/app-switcher.tsx
ce/components/workspace/members/members-activity-button.tsx
ce/components/workspace/settings/useMemberColumns.tsx
ce/components/workspace/sidebar/extended-sidebar-item.tsx
ce/components/workspace/sidebar/teams-sidebar-list.tsx
ce/components/workspace-notifications/notification-card/root.tsx
```

_(Alguns `return null` são guards condicionais válidos — revisar manualmente ao implementar.)_

---

## API — modelos ausentes vs Plane CE (amostra)

| Domínio Plane                 | Modelo `apps/api/operoz/db/models`                 | Estado F0    |
| ----------------------------- | -------------------------------------------------- | ------------ |
| Board (Operoz)                | `board.py`, `board_issue_type.py`, `board_role.py` | ✅ custom    |
| Issue, Project, Workspace     | sim                                                | ✅           |
| Cycle, Module, Intake         | sim                                                | ✅           |
| GitHub, Slack integration     | `integration/github.py`, `slack.py`                | ✅ parcial   |
| Importer                      | `importer.py`                                      | ✅           |
| Dashboard                     | `DeprecatedDashboard` (migração 0090)              | 🟡 deprecado |
| Initiative, Release, Customer | **não encontrado**                                 | ❌ F14       |
| PQL                           | **sem módulo dedicado**                            | 🟡 F5        |
| SSO                           | verificar `social_connection`                      | 🟡 F16       |

---

## Próximo passo F0-4

Ao fechar cada stub, marcar no [operoz-gap-tracker.md](./operoz-gap-tracker.md) e preferir implementação em `core/` quando for feature Operoz-first (Board), mantendo `ce/` só para extensões EE-style.
