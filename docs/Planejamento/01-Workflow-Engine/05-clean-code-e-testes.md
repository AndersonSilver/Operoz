# 05 — Clean Code & Testes · Workflow Engine

Baseline em [`00-VISAO-GERAL/04-clean-code-global.md`](../00-VISAO-GERAL/04-clean-code-global.md)
e [`05-estrategia-de-testes.md`](../00-VISAO-GERAL/05-estrategia-de-testes.md).

## Organização de ficheiros

```text
apps/api/operoz/
├── db/models/workflow.py
├── app/views/workflow/base.py            # WorkflowViewSet, SchemeViewSet
├── app/views/issue/transitions.py        # IssueTransitionViewSet
├── app/serializers/workflow.py
├── app/urls/workflow.py
└── workflow/                             # domínio (lógica pura, sem DRF)
    ├── engine.py        # execute_transition(issue, transition, actor, payload)
    ├── conditions.py    # registry de condições (uma função por tipo)
    ├── validators.py    # registry de validadores
    ├── post_functions.py# registry de post-functions
    └── graph.py         # graph ↔ models, validação de consistência
```

## Princípios específicos

- **Registry pattern** (Open/Closed): cada condição/validador/post-function é
  uma função registada por chave. Adicionar tipo novo = nova função + entrada no
  registry, **sem** tocar no `engine.py`. Espelha o catálogo da automação.
- `engine.execute_transition()` orquestra; cada passo (condições, validadores,
  post-functions) é uma função pura testável isoladamente.
- Sem lógica de workflow na view: o `IssueTransitionViewSet` só chama o domínio.
- `graph.py` é a única fronteira entre o formato do editor e os modelos.

## Casos de teste

### Unit (pytest, sem ou com DB mínimo)

| Caso                                        | Esperado                      |
| ------------------------------------------- | ----------------------------- |
| `condition assignee_only` com não-assignee  | bloqueia                      |
| `validator required_fields` com campo vazio | erro com nome do campo        |
| `post_function assign`                      | issue reatribuída ao alvo     |
| `graph.validate` com estado órfão           | erro de consistência          |
| `graphToFlow(flowToGraph(g)) == g`          | idempotente                   |
| transição global (`from_state=null`)        | disponível de qualquer estado |

### Integração (DRF client)

| Caso                                    | Esperado                                   |
| --------------------------------------- | ------------------------------------------ |
| `execute/` caminho feliz                | `200`, estado muda, `IssueActivity` criado |
| `execute/` sem condição satisfeita      | `403`                                      |
| `execute/` validador falha              | `422` + campos                             |
| `execute/` com estado mudado em corrida | `409`                                      |
| `PUT graph` por MEMBER                  | `403`                                      |
| `publish/` grafo inconsistente          | `400`                                      |
| estados de outro workspace no grafo     | `400` (anti-IDOR)                          |

### e2e (Playwright)

- Criar workflow no designer (2 estados + 1 transição), publicar, e executar a
  transição no detalhe da issue, confirmando mudança de estado.

## Definition of Done

> Estado em 2026-06-27 — detalhe em [06-status-auditoria.md](./06-status-auditoria.md).

- [x] 8 modelos + migração estrutural (`0189_workflow_engine.py`)
- [ ] Data migration de scheme default por workspace
- [x] Engine com registries (conditions/validators/post_functions)
- [x] Testes unit por tipo + engine (`tests/unit/workflow/` — 7 testes)
- [x] API CRUD + graph + publish + execute (estrutura)
- [x] API runtime estável (bugs B1–B5 corrigidos)
- [x] Validação de consistência no publish via `validate_graph()`
- [ ] Designer reusa canvas React Flow da automação (foi reimplementado)
- [ ] Testes de isolamento de tenant e bypass de condição verdes
- [ ] Lint/format/types verdes nos pacotes tocados
