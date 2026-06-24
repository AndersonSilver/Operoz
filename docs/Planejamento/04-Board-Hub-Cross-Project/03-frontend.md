# 03 — Frontend · Board Hub Cross-Project

Padrões em [`00-VISAO-GERAL/02-padroes-frontend.md`](../00-VISAO-GERAL/02-padroes-frontend.md).

## Estado atual e gaps

Rotas já existentes em `app/(all)/[workspaceSlug]/(projects)/boards/[boardSlug]/`:
`backlog`, `list`, `views`, `timeline`, `calendar`, `clientes`.

Gaps (do roadmap/gap-tracker):
- Rota/tab do **Quadro Kanban** (`/views`) não totalmente registada no header.
- Filtro de **Projeto** e rich filters no scope do board incompletos.
- Cronograma/Calendário agregados pendentes.

## Componentes

```text
core/components/boards/hub/
├── board-hub-header.tsx        # tabs: Resumo | Backlog | Quadro | Lista | Cronograma | Calendário
├── board-kanban.tsx            # reusa issue kanban layout, source = board issues
├── board-backlog.tsx           # backlog cross-project + drag-to-cycle
├── board-timeline.tsx          # reusa gantt layout agregado
├── board-calendar.tsx          # reusa calendar layout agregado
├── board-summary.tsx           # KPIs do meta/ (Recharts)
├── filters/
│   ├── board-project-filter.tsx
│   └── board-rich-filters.tsx  # reusa rich-filters + toggle OQL (feature 02)
└── cards/
    └── board-issue-card.tsx    # card com badge de projeto
```

- **Reuso dos layouts de issue:** `board-kanban`/`board-timeline`/
  `board-calendar` envolvem os componentes de
  `core/components/issues/issue-layouts/`, passando como source as issues do
  board em vez das de um projeto.
- **Badge de projeto:** o card do board mostra o identificador do projeto
  (decisão M2-0 do gap-tracker).

## Store

`BoardHubStore` (ou estender store de board existente): `issuesByBoard`,
`metaByBoard`, `viewConfigByBoard`, `savedViewsByBoard`. Observable + actions +
`computedFn` para agrupar por estado/swimlane.

## Service

`board.service.ts` ganha: `listBoardIssues`, `boardMeta`, `boardTimeline`,
`boardCalendar`, `getViewConfig`, `saveViewConfig`, `savedViews`.

## Rotas (`app/routes/core.ts`)

Garantir registo de todas as tabs, incluindo `/views` (Quadro) com tab no
`board-hub-header`. Manter o layout `boards/[boardSlug]/layout.tsx` como shell.

## i18n (pt-BR)

`board.tab.summary`, `board.tab.kanban`, `board.filter.project`,
`board.wip.over_limit`, etc.

## UX

- WIP limit: coluna com `current > limit` mostra aviso visual.
- Swimlanes configuráveis (epic/assignee/priority/type/none) via `view-config`.
- Filtro de projeto no topo; rich filters partilhados com a vista de projeto.
- Resumo com KPIs do `meta/` (distribuições + throughput) em Recharts.
