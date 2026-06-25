# 11 — Service Management & SLA (P2)

> Pré-requisito: [`00-VISAO-GERAL`](../00-VISAO-GERAL/).

## Visão

O Operis já tem peças de suporte/sustentação (`board_support_queue.py`,
`board_support_sla_policy.py`, Intake) mas incompletas face ao Jira Service
Management (roadmap §20). Esta feature completa SLAs com timers e business hours,
filas, request types, aprovações e portal de cliente — reutilizando os modelos
de suporte existentes e o app público **Space**.

## Mapeamento ao roadmap

Cobre §20 (`20.1`–`20.13`): portal de cliente, request types, SLA policies +
tracking, queues, approvals, escalation, business hours, email channel.

## Decisões-chave

| # | Decisão | Alternativa rejeitada |
| --- | --- | --- |
| 1 | Completar `board_support_*` existentes em vez de novo módulo | Reescrever suporte |
| 2 | SLA timer com pausa/retoma baseado em `BusinessCalendar` | Tempo de relógio cru |
| 3 | Escalation via automação (feature 03) por evento "SLA em risco" | Motor de escalation próprio |
| 4 | Portal de cliente sobre o app `Space` existente | Novo app público |
| 5 | Approvals como passo no workflow (feature 01) | Fluxo de aprovação isolado |

## Escopo

**Inclui:** SLA policies + timers + business hours, queues, request types,
approvals, escalation, portal de cliente, email channel.

**Exclui:** CSAT survey e service catalog (P3, ficam notas); chat widget (P3).

## Fases

1. **F1 — SLA + filas:** completar SLA policies, business hours, timers, UI de
   filas.
2. **F2 — Request types + portal:** formulários por tipo, portal no Space.
3. **F3 — Approvals + escalation:** passo de aprovação, escalation por automação,
   email channel.

## Ficheiros

- [01-modelo-de-dados.md](./01-modelo-de-dados.md)
- [02-contrato-de-api.md](./02-contrato-de-api.md)
- [03-frontend.md](./03-frontend.md)
- [04-seguranca.md](./04-seguranca.md)
- [05-clean-code-e-testes.md](./05-clean-code-e-testes.md)

## Reuso

- `board_support_queue.py`, `board_support_sla_policy.py` (já existem).
- Intake forms (já existem) → request types.
- App `Space` (portal público) + guest links.
- Automação (feature 03) para escalation; workflow (feature 01) para approvals.
