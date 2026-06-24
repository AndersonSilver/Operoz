# 05 — Time Tracking (P1)

> Pré-requisito: [`00-VISAO-GERAL`](../00-VISAO-GERAL/).

## Visão

O Operis não tem **worklog/timesheet** nativo (gap total no roadmap §19). Para
equipas de consultoria/delivery — o público-alvo do Operis — registo de horas e
faturabilidade são críticos. Esta feature traz worklog, estimativas, timer e
relatório de horas, com forte ligação ao diferencial **Custos/FinOps** (Cliente
360).

## Mapeamento ao roadmap

Cobre §19 (`19.1`–`19.9`) e campos §3.14–3.16: log work, original/remaining
estimate, painel de tempo, timesheet, billable hours, timer, weekly view.

## Decisões-chave

| # | Decisão | Alternativa rejeitada |
| --- | --- | --- |
| 1 | `Worklog` é entidade `ProjectBaseModel` independente | Campos no Issue — perde histórico/auditoria |
| 2 | Estimativas em segundos (original/remaining) no Issue | Só story points (já existem) |
| 3 | Timer como sessão server-side (resistente a refresh) | Só no cliente |
| 4 | `is_billable` + `activity_type` para FinOps/Cliente 360 | Horas sem categorização |
| 5 | Permissões edit_own vs edit_all (reuso da matriz da feature 07) | Toda a gente edita tudo |

## Escopo

**Inclui:** Worklog CRUD, estimativas no Issue, painel de tempo, timer,
timesheet semanal, billable, relatório de horas.

**Exclui:** faturação/invoicing (integra com FinOps do Cliente 360, não recria);
aprovação de timesheet (pode entrar via workflow/automação).

## Fases

1. **F1 — Worklog + estimativas:** modelo, API, painel na issue.
2. **F2 — Timer + timesheet:** sessão de timer, grid semanal.
3. **F3 — Relatórios + billable:** relatório por membro/projeto, integração
   FinOps.

## Ficheiros

- [01-modelo-de-dados.md](./01-modelo-de-dados.md)
- [02-contrato-de-api.md](./02-contrato-de-api.md)
- [03-frontend.md](./03-frontend.md)
- [04-seguranca.md](./04-seguranca.md)
- [05-clean-code-e-testes.md](./05-clean-code-e-testes.md)

## Reuso

- `ProjectBaseModel`, paginação, serializers Lite.
- `Client360HarnessCostLineItem`/FinOps profile para consolidar horas×custo.
- Matriz de permissões da feature 07 (`worklog.*`).
