# 05 — Clean Code & Testes · Board Hub Cross-Project

Baseline em [`00-VISAO-GERAL/04-clean-code-global.md`](../00-VISAO-GERAL/04-clean-code-global.md)
e [`05-estrategia-de-testes.md`](../00-VISAO-GERAL/05-estrategia-de-testes.md).

## Organização de ficheiros

```text
apps/api/operoz/
├── db/models/board.py                     # + BoardViewConfig, BoardSavedView
├── app/views/board/issues.py              # JÁ EXISTE — agregação
├── app/views/board/meta.py                # JÁ EXISTE — KPIs
├── app/views/board/timeline.py            # NOVO/estender
├── app/views/board/calendar.py            # NOVO/estender
├── app/views/board/view_config.py
└── board/visibility.py                    # accessible_board_project_ids()
```

## Princípios específicos

- **Uma função de visibilidade** (`accessible_board_project_ids`) usada por
  todas as vistas — evita duplicar a regra de segurança (DRY + um único ponto a
  auditar).
- Reusar layouts e serializers de issue; o hub não inventa formato de issue.
- Lógica de agregação/KPIs em funções de domínio (`board/aggregation.py`), não
  na view.
- Frontend: componentes do hub envolvem (compõem) os layouts existentes, não os
  reescrevem.

## Casos de teste

### Unit

| Caso                                                   | Esperado          |
| ------------------------------------------------------ | ----------------- |
| `accessible_board_project_ids` exclui projeto restrito | id ausente        |
| KPIs contam só conjunto acessível                      | contagem correta  |
| agrupamento por estado (GroupedPaginator)              | colunas paginadas |

### Integração

| Caso                                           | Esperado                       |
| ---------------------------------------------- | ------------------------------ |
| issues do board para membro com acesso parcial | só projetos acessíveis         |
| `?project=<restrito>`                          | `403/404`                      |
| `?q=<oql>` no board                            | aplica após filtro de projetos |
| config de vista por MEMBER                     | `403`                          |
| `meta/` cache não vaza entre users             | resultados corretos por user   |

### e2e

- Abrir board, alternar tabs (Resumo/Backlog/Quadro/Lista/Cronograma/
  Calendário), filtrar por projeto, e confirmar badge de projeto nos cards.

## Definition of Done

- [ ] Todas as tabs registadas (incl. Quadro `/views`) com header consistente.
- [ ] Agregação sempre via `accessible_board_project_ids`.
- [ ] KPIs `meta/` com cache por user e throttle.
- [ ] Testes de fuga cross-project verdes (bloqueante).
- [ ] Reuso de layouts confirmado; lint/format/types verdes.
