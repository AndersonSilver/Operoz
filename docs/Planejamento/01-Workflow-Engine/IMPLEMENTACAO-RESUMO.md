# Workflow Engine — Resumo de Implementação (auditoria 2026-06-27)

> **Status real:** ~55–60% do escopo F1–F3. Fundação backend sólida; frontend
> protótipo; integração com issues inexistente; testes zero.  
> Detalhe completo: [06-status-auditoria.md](./06-status-auditoria.md).

## Visão geral

O DEVIN entregou a **estrutura esqueleto** correta (modelos, engine, API, store,
canvas). A arquitetura segue o plano em `README.md`. Porém vários trechos **não
funcionam em runtime** e o resumo anterior declarava «100% completo» — incorreto.

## Backend — entregue

| Componente                           | Path                                      | Status                                    |
| ------------------------------------ | ----------------------------------------- | ----------------------------------------- |
| Modelos (8) + `published_graph`      | `db/models/workflow.py`                   | ✅                                        |
| Migração + `Project.workflow_scheme` | `db/migrations/0189_workflow_engine.py`   | ✅ sem data migration                     |
| Engine (pipeline)                    | `workflow/engine.py`                      | 🟡 bugs B1, B2                            |
| Registries                           | `conditions/validators/post_functions.py` | ✅ stubs em webhook/fire_event/group      |
| Graph utils                          | `workflow/graph.py`                       | ✅ `validate_graph` não ligado ao publish |
| Serializers                          | `app/serializers/workflow.py`             | ✅                                        |
| ViewSets                             | `app/views/workflow/base.py`              | 🟡 bug B3, B4, B5                         |
| URLs                                 | `app/urls/workflow.py`                    | ✅                                        |

## Frontend — entregue

| Componente      | Path                                                 | Status                   |
| --------------- | ---------------------------------------------------- | ------------------------ |
| Tipos           | `packages/types/src/workflow.ts`                     | ✅                       |
| Service         | `packages/services/src/workflow/workflow.service.ts` | ✅                       |
| Store MobX      | `core/store/workflow.store.ts`                       | ✅ não usado na página   |
| Canvas + editor | `core/components/settings/workspace/workflow/`       | 🟡 protótipo; hex colors |
| Página settings | `settings/(workspace)/workflow/page.tsx`             | 🟡 mock estático         |
| Menu lateral    | `packages/constants/.../workspace.ts`                | ✅ sem i18n da label     |

## Não entregue (vs plano)

- Testes unitários e de integração (`05-clean-code-e-testes.md`)
- Data migration scheme default por workspace
- Lista de workflows + designer por `:workflowId`
- Página workflow schemes
- Transition inspector (condições/validadores/post-functions/screens)
- Integração no detalhe da issue (transições nomeadas)
- i18n (`workflow.designer.*`, settings title)
- Reuso do canvas da automação (`03-frontend.md`)
- Segurança completa (webhook allowlist, audit publish)

## Bugs a corrigir primeiro

Ver [06-status-auditoria.md § Bugs críticos](./06-status-auditoria.md#bugs-críticos-corrigir-antes-de-qualquer-demo):

1. `is_active` em query de `WorkflowTransition` — campo inexistente
2. `IssueActivity.create` com kwargs inválidos
3. `TransitionScreenSerializer` sem import
4. IDOR em `execute/` — transition não validada contra workflow da issue
5. Validação de publish invertida — usar `validate_graph()`

## Como testar hoje

### Backend (após hotfixes)

```bash
docker compose -f docker-compose-local.yml exec api python manage.py migrate
# pytest apps/api/operoz/tests/unit/workflow/  ← ainda não existe
```

### Frontend

1. `pnpm dev`
2. Admin → Settings → Features → Workflow (`/[workspaceSlug]/settings/workflow`)
3. Canvas interativo com **dados fake** — save/publish só fazem `console.log`

## Próximo passo sugerido

Seguir a ordem em [06-status-auditoria.md § Ordem de trabalho](./06-status-auditoria.md#ordem-de-trabalho-recomendada):

**Hotfix backend → ligar store → issue detail → schemes → polish.**
