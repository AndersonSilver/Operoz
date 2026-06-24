# 03 — Frontend · Dashboard Builder

Padrões em [`00-VISAO-GERAL/02-padroes-frontend.md`](../00-VISAO-GERAL/02-padroes-frontend.md).

## Componentes

```text
core/components/dashboards/
├── dashboard-grid.tsx          # react-grid-layout (drag/resize de gadgets)
├── gadget-palette.tsx          # adicionar gadget (catálogo)
├── gadget-frame.tsx            # moldura: título, refresh, menu, loading/erro
├── gadget-config-modal.tsx     # formulário do gadget (schema do catálogo)
├── gadgets/
│   ├── filter-results-gadget.tsx
│   ├── pie-gadget.tsx          # Recharts PieChart
│   ├── bar-gadget.tsx          # Recharts BarChart
│   ├── line-gadget.tsx
│   ├── burndown-gadget.tsx     # consome métrica (feature 08)
│   ├── velocity-gadget.tsx
│   ├── sprint-health-gadget.tsx
│   ├── activity-gadget.tsx
│   └── text-gadget.tsx
└── share-dashboard-modal.tsx
```

- **`dashboard-grid`** usa `react-grid-layout`; posições persistem em
  `gadget.position`. Layout responsivo (cols por breakpoint).
- **`gadget-frame`** trata estados (loading/erro/vazio) de forma uniforme e o
  polling de auto-refresh.
- **Gráficos** com Recharts; cada gadget recebe `data` do
  `gadgets/{gid}/data/`.

## Store

```text
core/store/dashboards/dashboard.store.ts → DashboardStore
```

- `dashboardsMap`, `gadgetDataCache` (por gadget+intervalo), actions
  CRUD + `fetchGadgetData`. `computedFn` para gadgets de um dashboard.

## Service

`dashboard.service.ts`: `list`, `retrieve`, `create`, `update`, `remove`,
`addGadget`, `updateGadget`, `removeGadget`, `gadgetData`, `catalog`,
`shares`, `addShare`, `removeShare`.

## Tipos (`@operis/types`)

```ts
export type TGadget = {
  id: string; gadget_type: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, unknown>; refresh_interval_seconds: number;
};
export type TGadgetData =
  | { type: "table"; rows: TIssueLite[] }
  | { type: "pie" | "bar"; series: { label: string; value: number }[] }
  | { type: "line"; points: { x: string; y: number }[] };
```

## Rotas

```text
:workspaceSlug/dashboards            → lista
:workspaceSlug/dashboards/:id        → grid (view/edit conforme permissão)
```

## i18n (pt-BR)

`dashboard.add_gadget`, `dashboard.share`, `gadget.pie.title`,
`gadget.config.oql`, `gadget.refresh`, etc.

## UX

- Modo edição (drag/resize/config) vs modo view (read-only) conforme permissão.
- `gadget-config-modal` reusa o editor OQL (feature 02) quando a fonte é OQL.
- Auto-refresh visível (timestamp da última atualização).
