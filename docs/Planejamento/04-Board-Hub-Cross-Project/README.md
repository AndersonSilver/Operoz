# 04 — Board Hub Cross-Project (P0)

> Pré-requisito: [`00-VISAO-GERAL`](../00-VISAO-GERAL/).

## Visão

O Operis introduziu a entidade **`Board`** (squad) que agrega N projetos — um
diferencial sobre o Jira. A estrutura existe, mas as **vistas agregadas**
(Kanban, Backlog, Cronograma, Calendário cross-project) estão incompletas. Esta
feature completa o hub do board para paridade com o "Squad as a Service" do Jira.

## Mapeamento ao roadmap

Cobre §2 e §6.2: Resumo rico, Quadro Kanban cross-project (rota+tab), Backlog
polido com filtros, Cronograma multi-projeto, Calendário agregado, filtro de
projeto e rich filters no contexto do board, KPIs/meta.

## Decisões-chave

| # | Decisão | Alternativa rejeitada |
| --- | --- | --- |
| 1 | Reusar layouts de issue existentes (kanban/list/gantt/calendar) parametrizados por board | Componentes novos por vista |
| 2 | API agregada do board reusa querysets de issue com filtro `board` | Endpoints duplicados por projeto |
| 3 | `GroupedOffsetPaginator` para Kanban (agrupar por estado) | Paginação simples (perde grupos) |
| 4 | Filtros do board reusam rich-filters + OQL (feature 02) | Filtros próprios do board |
| 5 | KPIs do board via endpoint `meta/` cacheado | Calcular no cliente |

## Escopo

**Inclui:** rota+tab do Kanban cross-project, polish do Backlog, Cronograma
agregado, Calendário agregado, filtro de projeto, badge de projeto nos cards,
endpoint `meta/` de KPIs.

**Exclui:** abas Deployments/Code (fora de escopo); Cliente 360 (já existe).

## Fases

1. **F1 — P0:** Kanban cross-project (rota `/views` + tab no header), Backlog
   polido com filtro de projeto e rich filters.
2. **F2:** Cronograma multi-projeto (Gantt agregado) + escala (semanas/meses/
   trimestres) + linha "hoje".
3. **F3:** Calendário agregado + Resumo rico (KPIs via `meta/`).

## Ficheiros

- [01-modelo-de-dados.md](./01-modelo-de-dados.md)
- [02-contrato-de-api.md](./02-contrato-de-api.md)
- [03-frontend.md](./03-frontend.md)
- [04-seguranca.md](./04-seguranca.md)
- [05-clean-code-e-testes.md](./05-clean-code-e-testes.md)

## Reuso

- `Board` + rotas `boards/[boardSlug]/{backlog,list,views,timeline,calendar}`
  (já existem parcialmente).
- Layouts de issue (`core/components/issues/issue-layouts/`).
- `GroupedOffsetPaginator` (`utils/paginator.py`).
- Rich filters + OQL (feature 02).
