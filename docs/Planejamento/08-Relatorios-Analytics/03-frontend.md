# 03 — Frontend · Relatórios & Analytics

Padrões em [`00-VISAO-GERAL/02-padroes-frontend.md`](../00-VISAO-GERAL/02-padroes-frontend.md).

## Componentes

```text
core/components/reports/
├── report-page.tsx             # shell: seletor de métrica + scope + período
├── charts/
│   ├── burndown-chart.tsx      # Recharts LineChart (ideal vs actual)
│   ├── burnup-chart.tsx
│   ├── velocity-chart.tsx      # BarChart committed vs completed
│   ├── cfd-chart.tsx           # AreaChart empilhado
│   ├── control-chart.tsx       # ScatterChart + percentis
│   └── created-vs-resolved.tsx
├── sprint-report.tsx           # tabela completed/not-completed/removed
├── time-in-status-table.tsx
└── export-menu.tsx             # CSV / PDF / PNG
```

- **Reuso pelos gadgets:** os mesmos componentes de chart são embrulhados pelos
  gadgets da feature 06 (`burndown-gadget` usa `burndown-chart`). Um só
  componente de gráfico por métrica.

## Store

```text
core/store/reports/report.store.ts → ReportStore
```

- `catalog`, `seriesCache` (por metric+scope+período). Action `fetchMetric`.
- Cache evita refetch ao alternar entre páginas e dashboard.

## Service

`report.service.ts`: `catalog`, `metric(metricKey, scope)`, `sprintReport`,
`export(metricKey, format, scope)`.

## Tipos (`@operoz/types`)

```ts
export type TMetricSeries =
  | { metric: "burndown"; ideal: TPoint[]; actual: TPoint[] }
  | { metric: "velocity"; sprints: TVelocityBar[] }
  | { metric: "cfd"; series: TCfdPoint[] }
  | { metric: "time_in_status"; issues: TTimeInStatus[] };
type TPoint = { date: string; points: number };
```

## Rotas

```text
:workspaceSlug/analytics/:tabId         → JÁ EXISTE; adicionar tabs de relatório
:workspaceSlug/projects/:pid/cycles/:cid → sprint report no detalhe do ciclo
```

Integrar nas tabs de analytics existentes em vez de criar secção paralela.

## i18n (pt-BR)

`report.burndown.title`, `report.velocity.committed`, `report.export.pdf`,
`report.sprint.removed`, etc.

## UX

- Seletor de scope (ciclo/projeto/board/OQL) + período no topo.
- Tooltips ricos nos gráficos; legenda clara ideal vs actual.
- Export com escolha de formato; PDF/PNG mostram estado "a gerar…".
