# 06 — Status & Auditoria (DEVIN → revisão Operoz)

> **Data da auditoria:** 2026-06-27  
> **Veredicto:** arquitetura **no caminho certo** (~55–60% do escopo F1–F3), mas o
> `IMPLEMENTACAO-RESUMO.md` anterior **superestimava** o progresso. Há bugs de
> runtime no backend e o frontend é um **protótipo desconectado**.

## Mapa de fases vs realidade

| Fase           | Escopo                                                         | Status      | Notas                                                                   |
| -------------- | -------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------- |
| **F1**         | Modelos + designer visual (estados/transições, estado inicial) | 🟡 Parcial  | Modelos/migração OK; canvas existe mas mock; sem lista de workflows     |
| **F2**         | Condições, validadores, post-functions, execução API           | 🟡 Parcial  | Registries OK; `execute/` quebra em runtime (ver bugs); sem testes      |
| **F3**         | Schemes, draft/publish, globais, screens                       | 🟡 Parcial  | Modelos/API schemes OK; sem data migration; publish com validação fraca |
| **Integração** | Issue detail, i18n, testes, segurança                          | 🔴 Pendente | Nada ligado ao detalhe da issue; i18n ausente; 0 testes workflow        |

Legenda: 🟢 feito · 🟡 parcial · 🔴 pendente

---

## O que está correto (manter)

### Backend — alinhado ao plano

| Item                            | Ficheiro                                                       | Avaliação                                |
| ------------------------------- | -------------------------------------------------------------- | ---------------------------------------- |
| 8 modelos + `published_graph`   | `db/models/workflow.py`                                        | ✅ Conforme `01-modelo-de-dados.md`      |
| FK `Project.workflow_scheme`    | `db/models/project.py` + migração `0189`                       | ✅                                       |
| Registry pattern (O/C)          | `workflow/conditions.py`, `validators.py`, `post_functions.py` | ✅ Espelha automação                     |
| Pipeline do engine              | `workflow/engine.py`                                           | ✅ Ordem correta no desenho              |
| Graph ↔ modelos                 | `workflow/graph.py`                                            | ✅ `models_to_graph` / `graph_to_models` |
| URLs                            | `app/urls/workflow.py`                                         | ✅ Conforme `02-contrato-de-api.md`      |
| ViewSets CRUD + graph + publish | `app/views/workflow/base.py`                                   | ✅ Estrutura certa                       |
| Serializers                     | `app/serializers/workflow.py`                                  | ✅                                       |

### Frontend — fundação OK

| Item              | Ficheiro                                             | Avaliação                                    |
| ----------------- | ---------------------------------------------------- | -------------------------------------------- |
| Tipos             | `packages/types/src/workflow.ts`                     | ✅                                           |
| Service           | `packages/services/src/workflow/workflow.service.ts` | ✅                                           |
| MobX store        | `apps/web/core/store/workflow.store.ts`              | ✅ Integrado ao RootStore                    |
| Canvas React Flow | `core/components/settings/workspace/workflow/*`      | 🟡 Funciona isolado; não reutiliza automação |
| Menu settings     | `packages/constants/src/settings/workspace.ts`       | ✅ Entrada admin                             |

---

## Bugs críticos (corrigir antes de qualquer demo)

### B1 — `is_active` inexistente em `WorkflowTransition`

```python
# workflow/engine.py ~L183
WorkflowTransition.objects.filter(..., is_active=True)  # ❌ campo não existe no model
```

**Impacto:** `FieldError` ao listar transições disponíveis.  
**Fix:** remover filtro ou usar soft-delete (`deleted_at__isnull=True`).

### B2 — `IssueActivity.objects.create` com campos inválidos

```python
# workflow/engine.py ~L104
IssueActivity.objects.create(..., transition=..., extra_data={...})  # ❌
```

O model `IssueActivity` só tem `field`, `old_value`, `new_value`, `comment`, `verb`, etc.  
**Fix:** seguir padrão de `bgtasks/issue_activities_task.py` (`field="state"`, sem `extra_data`).

### B3 — `TransitionScreenSerializer` não importado

```python
# app/views/workflow/base.py ~L243
TransitionScreenSerializer(transition.screen)  # ❌ NameError
```

**Fix:** importar de `operoz.app.serializers.workflow`.

### B4 — IDOR na execução de transição

```python
# execute() busca transition só por tid, sem validar workflow da issue
transition = WorkflowTransition.objects.get(id=tid)
```

**Fix:** garantir que `transition.workflow` == workflow resolvido via scheme/issue_type.

### B5 — Validação de publish incorreta

`_validate_workflow` exige transição **entrando** no estado inicial — o oposto do
esperado (estados alcançáveis **a partir** do inicial).  
**Fix:** usar `validate_graph()` de `graph.py` no publish.

---

## Lacunas vs plano original

### Backend

- [ ] **Data migration** — scheme default por workspace (preservar comportamento atual)
- [ ] **Testes** — 0 ficheiros em `tests/unit/workflow/` ou `tests/contract/.../workflow`
- [ ] **Whitelist de tipos** — `condition_type`/`validator_type`/`function_type` aceites sem validação de catálogo
- [ ] **Webhook sandbox** — `post_functions.webhook` sem allowlist (ver `04-seguranca.md`)
- [ ] **`fire_event`** — stub; integração com dispatcher da automação (feature 03)
- [ ] **`group` condition** — sempre `False` (depende feature 07)
- [ ] **Auditoria publish** — não regista quem publicou
- [ ] **Permissão leitura MEMBER** — `list`/`retrieve` de workflows sem `@allow_permission` explícito

### Frontend

- [x] **Página settings** — lista workflows + designer ligado ao store
- [x] **Schemes UI** — `/settings/workflow/schemes` + editor por scheme
- [x] **Integração issue detail** — dropdown de transições quando scheme ativo
- [x] **i18n** — settings, designer, schemes (en + pt-BR)
- [ ] **Transition inspector** — condições/validadores/post-functions/screens no designer
- [ ] **Não reutilizou canvas da automação** — duplicou lógica em `workflow-utils.ts`

### Design system

A página exemplo viola `.cursorrules`: `#6366f1`, `#f59e0b`, `#10b981` hardcoded.
Usar tokens semânticos (`text-accent-primary`, grupos de estado do tema).

---

## Definition of Done (atualizada)

Copiar para PR / tracking:

### F1 — Núcleo (MVP designer)

- [x] Corrigir bugs B1–B3, B4, B5
- [x] Página lista workflows + designer ligado ao WorkflowStore
- [ ] Grafo persiste via `PUT .../graph/` com estados reais do projeto/board
- [x] Publish valida grafo (`validate_graph`)
- [x] i18n mínimo (título settings + designer)

### F2 — Execução

- [x] Corrigir B4 + IssueActivity
- [x] Testes unit: conditions, validators, post_functions, engine
- [x] Testes contract: execute 200/403/422/409
- [x] Issue detail: dropdown de transições (`GET .../transitions/`)
- [x] Peek overview: mesmo controle de transições (tela irmã)

### F3 — Esquemas & polish

- [x] Data migration scheme default (`0190_workflow_default_schemes`)
- [x] UI workflow schemes — lista + editor (entries, bootstrap, assign projects)
- [x] Layout com tabs Workflows | Schemes (estilo notifications)
- [ ] Sem fallback automático no engine — projeto precisa de `workflow_scheme` explícito
- [ ] Transition inspector (regras + screen)
- [ ] Webhook allowlist + fire_event integrado
- [ ] e2e Playwright: criar workflow → publicar → executar na issue

---

## Ordem de trabalho recomendada

```text
1. Hotfix backend (B1–B5) + testes mínimos do engine     ← desbloqueia API
2. Ligar WorkflowStore à página + lista de workflows      ← desbloqueia admin
3. Issue detail: transições disponíveis + execute           ← valor de produto
4. Data migration + schemes UI                            ← rollout seguro
5. Inspector + i18n + refator canvas (reuso automação)    ← polish F3
```

Estimativa rough: **F1 utilizável** ~2–3 dias · **F2 prod-ready** +5 dias · **F3 completo** +5 dias.

---

## Nota sobre o documento anterior

O `IMPLEMENTACAO-RESUMO.md` gerado pelo DEVIN listava itens como ✅ sem verificar
runtime, testes ou integração. Foi reescrito para refletir este audit.
