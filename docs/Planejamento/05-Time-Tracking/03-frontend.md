# 03 — Frontend · Time Tracking

Padrões em [`00-VISAO-GERAL/02-padroes-frontend.md`](../00-VISAO-GERAL/02-padroes-frontend.md).

## Componentes

```text
core/components/time-tracking/
├── issue-time-panel.tsx        # painel na issue: Logged / Estimate / Remaining (barra)
├── log-work-modal.tsx          # data, duração ("2h 30m"), descrição, billable, tipo
├── worklog-list.tsx            # lista de worklogs da issue
├── timer/
│   ├── timer-widget.tsx        # play/stop no header + issue detail
│   └── timer-store-binding.tsx
├── timesheet/
│   └── weekly-timesheet.tsx    # grid: linhas=issues, colunas=dias
└── duration-input.tsx          # parser "2h 30m" → segundos (e inverso)
```

- **`duration-input`**: helper puro `parseDuration("2h 30m") → 9000` e
  `formatDuration(9000) → "2h 30m"`. Testável isoladamente; reutilizado em
  todo o lado.
- **Barra de tempo** na issue: visual Logged/Estimate/Remaining como o Jira.

## Store

```text
core/store/time-tracking/worklog.store.ts → WorklogStore
core/store/time-tracking/timer.store.ts    → TimerStore
```

- `WorklogStore`: `worklogsByIssue` (observable map), `fetchByIssue`,
  `create/update/remove`, `computedFn` `totalSecondsByIssue`.
- `TimerStore`: `current` (sessão ativa), `start`, `stop`, `tick` (cronómetro
  local sincronizado com `started_at` do servidor para resistir a refresh).

## Service

`time-tracking.service.ts`: `listWorklogs`, `createWorklog`, `updateWorklog`,
`deleteWorklog`, `startTimer`, `stopTimer`, `currentTimer`, `timesheet`,
`timeReport`, `activityTypes`.

## Tipos (`@operis/types`)

```ts
export type TWorklog = {
  id: string; issue: string; author: string;
  time_spent_seconds: number; started_at: string; description: string;
  is_billable: boolean; activity_type?: string;
};
export type TTimerSession = { id: string; issue: string; started_at: string };
```

## Rotas

```text
:workspaceSlug/timesheet                 → weekly-timesheet
:workspaceSlug/reports/time              → relatório (pode viver em analytics)
```

Painel de tempo e timer integram-se no **issue detail** existente (não nova
rota).

## i18n (pt-BR)

`time.log_work`, `time.estimate.original`, `time.estimate.remaining`,
`time.timer.start`, `time.billable`, `time.timesheet.week`, etc.

## UX

- Timer visível no header quando ativo (contador a correr); um clique para
  parar e gravar.
- `log-work-modal` aceita formatos `2h`, `30m`, `2h 30m`, `1d` (= 8h
  configurável).
- Timesheet semanal editável célula a célula (cria/edita worklog).
