# 06 — Dashboard Builder (P1)

> Pré-requisito: [`00-VISAO-GERAL`](../00-VISAO-GERAL/).

## Visão

O Operoz tem analytics básico mas não **dashboards com gadgets** configuráveis
(roadmap §13). O utilizador deve poder montar uma página com gráficos
(burndown, pizza, created-vs-resolved), partilhá-la e mantê-la atualizada — como
os dashboards do Jira.

## Mapeamento ao roadmap

Cobre §13 (`13.1`–`13.15`): dashboard, gadgets, grid layout, partilha,
auto-refresh, gadgets de filtro/gráfico/sprint.

## Decisões-chave

| #   | Decisão                                                              | Alternativa rejeitada            |
| --- | -------------------------------------------------------------------- | -------------------------------- |
| 1   | Gadget guarda config como JSON; layout como JSON (grid)              | Tabela rígida por tipo de gadget |
| 2   | Fonte de dados do gadget = OQL (feature 02) ou métricas (feature 08) | Queries próprias por gadget      |
| 3   | `react-grid-layout` para drag-and-drop                               | Grid manual                      |
| 4   | Render de gráficos com Recharts (já dependência)                     | Lib de charts nova               |
| 5   | Partilha respeita RBAC; dados do gadget recortados por visibilidade  | Dashboard ignora permissões      |

## Escopo

**Inclui:** Dashboard + Gadget models, grid builder, ~10 tipos de gadget,
partilha, auto-refresh.

**Exclui:** os cálculos de relatório em si (vêm da feature 08); wallboard/TV
mode (P3).

## Fases

1. **F1 — Núcleo:** Dashboard + Gadget, grid layout, gadgets filter-results,
   pie, bar, line.
2. **F2 — Agile gadgets:** burndown, velocity, sprint health, created-vs-resolved
   (consomem feature 08).
3. **F3 — Partilha + refresh:** sharing por workspace/projeto/user, auto-refresh,
   text/activity gadgets.

## Ficheiros

- [01-modelo-de-dados.md](./01-modelo-de-dados.md)
- [02-contrato-de-api.md](./02-contrato-de-api.md)
- [03-frontend.md](./03-frontend.md)
- [04-seguranca.md](./04-seguranca.md)
- [05-clean-code-e-testes.md](./05-clean-code-e-testes.md)

## Reuso

- OQL (feature 02) como fonte de dados de gadgets de issues.
- Métricas/relatórios (feature 08) para gadgets agile.
- Recharts; `react-grid-layout`; `@operoz/ui`.
