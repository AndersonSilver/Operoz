# 03 — Frontend · Advanced Roadmaps (Plans)

Padrões em [`00-VISAO-GERAL/02-padroes-frontend.md`](../00-VISAO-GERAL/02-padroes-frontend.md).

## Componentes

```text
core/components/plans/
├── plan-list.tsx
├── plan-timeline.tsx           # Gantt agregado (reusa gantt layout)
├── plan-sources-panel.tsx      # adicionar projetos/boards/OQL
├── capacity-panel.tsx          # capacity vs committed por squad/ciclo (barras)
├── scenario-switcher.tsx       # baseline | cenário A | cenário B
├── dependency-overlay.tsx      # setas + destaque de conflitos
├── versions/
│   ├── version-list.tsx
│   └── release-report.tsx      # progresso + at-risk
└── plan-toolbar.tsx            # zoom, colorir por, agrupar por equipa
```

- **`plan-timeline`** reusa o componente de Gantt existente, alimentado pela
  agregação cross-project; adiciona overlay de dependências e marcação de
  conflitos.
- **`scenario-switcher`** alterna entre baseline e cenários; o que muda é só o
  `scenario` enviado ao `timeline/` (overlay no servidor, sem persistir).

## Store

```text
core/store/plans/plan.store.ts → PlanStore
```

- `plansMap`, `timelineByPlan` (por scenario), `capacityByPlan`,
  `scenariosByPlan`. Actions CRUD + `fetchTimeline(scenario)` +
  `commitScenario`.

## Service

`plan.service.ts`: `list`, `retrieve`, `create`, `update`, `sources`,
`timeline`, `capacity`, `scenarios`, `commitScenario`, `dependencies`,
`versions`, `releaseReport`.

## Tipos (`@operoz/types`)

```ts
export type TPlanBar = {
  issue: string;
  start?: string;
  target?: string;
  level: number;
  board?: string;
  project: string;
};
export type TPlanTimeline = {
  bars: TPlanBar[];
  dependencies: { from: string; to: string; type: string }[];
  conflicts: { issue: string; reason: string }[];
  capacity: TCapacitySummary;
};
```

## Rotas

```text
:workspaceSlug/plans
:workspaceSlug/plans/:planId
:workspaceSlug/settings/projects/:pid/versions
```

## i18n (pt-BR)

`plan.timeline.zoom`, `plan.capacity.over`, `plan.scenario.baseline`,
`plan.dependency.conflict`, `version.release_report`, etc.

## UX

- Conflitos destacados a vermelho (dependência inválida / sobre-capacidade).
- Drag de barras num cenário não toca no baseline até **commit** (com
  confirmação e lista do que vai mudar).
- Capacity panel mostra barras committed vs capacity por squad/ciclo.
