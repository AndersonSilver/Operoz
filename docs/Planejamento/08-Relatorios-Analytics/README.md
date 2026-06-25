# 08 — Relatórios & Analytics (P1)

> Pré-requisito: [`00-VISAO-GERAL`](../00-VISAO-GERAL/).

## Visão

O Operis tem analytics, mas faltam os **relatórios agile prontos** que o Jira
oferece (roadmap §14): burndown, burnup, velocity, cumulative flow, control
chart, time-in-status. Esta feature entrega um motor de métricas reutilizável
que alimenta tanto páginas de relatório como gadgets de dashboard (feature 06).

## Mapeamento ao roadmap

Cobre §14 (`14.1`–`14.17`) e §8.5–8.9 (sprint reports): burndown, burnup,
velocity, CFD, control chart, created-vs-resolved, resolution time, workload,
time-in-status, forecast, export.

## Decisões-chave

| # | Decisão | Alternativa rejeitada |
| --- | --- | --- |
| 1 | Motor de métricas central; relatórios e gadgets consomem-no | Calcular em cada sítio |
| 2 | Time-in-status derivado de `IssueActivity` (gerado pela feature 01) | Tabela de tempos manual |
| 3 | Snapshots periódicos (Celery) para séries históricas pesadas | Recalcular tudo on-read |
| 4 | Export PDF/CSV/PNG reusa exporter existente | Lib de export nova |
| 5 | Scope de métrica declarativo (project/cycle/board/OQL) | Métricas hard-coded por scope |

## Escopo

**Inclui:** motor de métricas, burndown/burnup/velocity/CFD/control/
created-vs-resolved/time-in-status, sprint report, export.

**Exclui:** o render (gadgets ficam na feature 06; páginas de relatório aqui);
forecast IA avançado (P3, fica nota).

## Fases

1. **F1 — Sprint metrics:** burndown, velocity, sprint report, created-vs-
   resolved.
2. **F2 — Flow metrics:** CFD, control chart, time-in-status (consome
   `IssueActivity`).
3. **F3 — Export + workload:** PDF/PNG, workload, resolution time.

## Ficheiros

- [01-modelo-de-dados.md](./01-modelo-de-dados.md)
- [02-contrato-de-api.md](./02-contrato-de-api.md)
- [03-frontend.md](./03-frontend.md)
- [04-seguranca.md](./04-seguranca.md)
- [05-clean-code-e-testes.md](./05-clean-code-e-testes.md)

## Reuso

- `analytic.py`, `app/views/analytic/` (analytics existente).
- `IssueActivity` (histórico) para time-in-status.
- `exporter.py` para export; Recharts no frontend.
- OQL (feature 02) como scope de métrica.
