# 10 — Advanced Roadmaps (Plans) (P2)

> Pré-requisito: [`00-VISAO-GERAL`](../00-VISAO-GERAL/).

## Visão

O recurso premium mais cobiçado do Jira são os **Advanced Roadmaps / Plans**:
planeamento cross-project, capacity planning, dependências entre equipas e
cenários "what-if" (roadmap §10.2). O Operoz tem Gantt por projeto e módulos,
mas não um plano agregado. Esta feature aproveita a entidade **Board** (squad)
do Operoz como unidade natural de equipa para o planeamento.

## Mapeamento ao roadmap

Cobre §10.2 (`10.2.1`–`10.2.10`) e §1.1.5/§9.7 (Versions/Release tracking):
Plans cross-project, capacity, scenarios, cross-team dependencies, release
tracking, teams view.

## Decisões-chave

| #   | Decisão                                                       | Alternativa rejeitada          |
| --- | ------------------------------------------------------------- | ------------------------------ |
| 1   | `Plan` agrega fontes (projetos/boards) via relação N:M        | Plano preso a um projeto       |
| 2   | Capacity por board (squad) × ciclo                            | Capacity por utilizador global |
| 3   | Scenario = fork leve do plano (overlay de mudanças)           | Copiar todas as issues         |
| 4   | Dependências reusam `IssueRelation` (blocks) existente        | Modelo de dependência novo     |
| 5   | Versions/Releases como entidade dedicada com release tracking | Labels                         |

## Escopo

**Inclui:** Plan, fontes, capacity, dependências cross-project no Gantt,
scenarios (overlay), Versions/Releases + release tracking.

**Exclui:** auto-scheduler/critical path (P3, fica nota); BI externo.

## Fases

1. **F1 — Plan + Gantt agregado:** Plan, fontes, timeline cross-project com
   dependências.
2. **F2 — Capacity + Versions:** capacity por squad/ciclo, Versions + release
   tracking.
3. **F3 — Scenarios:** overlay "what-if", comparação com baseline.

## Ficheiros

- [01-modelo-de-dados.md](./01-modelo-de-dados.md)
- [02-contrato-de-api.md](./02-contrato-de-api.md)
- [03-frontend.md](./03-frontend.md)
- [04-seguranca.md](./04-seguranca.md)
- [05-clean-code-e-testes.md](./05-clean-code-e-testes.md)

## Reuso

- Gantt existente; `IssueRelation` (dependências); `Board`/`Cycle` (squad,
  sprints); estimates.
- `accessible_board_project_ids` (feature 04) para visibilidade.
