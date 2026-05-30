# Operis — Automação MVP — Especificação técnica

Documento de implementação derivado de [operis-automacao-mvp-plano.md](./operis-automacao-mvp-plano.md).  
**Início de desenvolvimento:** após **MV4 (PRD)** estável.

| Campo | Valor |
|-------|--------|
| **Versão** | 0.1 |
| **Estado** | Spec inicial para desenvolvimento |
| **Stack** | Django API + Celery + Next.js (`apps/web`) + React Flow |

---

## 1. Resumo executivo

Construir um **motor de automação nativo por board** com:

- **Canvas** (React Flow) para desenhar fluxos.
- **Catálogo dinâmico** de gatilhos, filtros e ações (registados em código, expostos via API).
- **Executor assíncrono** (Celery) com logs e **dry-run**.
- **Permissão:** `board.administer` (já existe em `plane.utils.board_roles`).

Sem templates de cenários, sem n8n embutido, sem cron no MVP (Fase 1.1).

---

## 2. Arquitetura

### 2.1 Componentes

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ apps/web                                                                 │
│  settings/boards/[boardSlug]/automacao  →  lista + editor canvas         │
│  React Flow + @xyflow/react                                              │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │ REST
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ apps/api                                                                 │
│  views/board/automation.py     CRUD regras, catalog, dry-run, runs       │
│  automation/catalog.py       Registo de triggers / filters / actions   │
│  automation/compiler.py      Grafo JSON → plano de execução (DAG)       │
│  automation/executor.py      Avalia filtros + executa ações              │
│  automation/dispatcher.py    Enfileira runs (Celery)                       │
│  signals / hooks             Emite DomainEvent após save/delete          │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ plane/bgtasks/automation_task.py   run_automation_rule / process_event   │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Fluxo de evento

1. Utilizador (ou sistema) altera entidade (issue, comment, status report, …).
2. Camada de domínio emite `AutomationDomainEvent` (não bloquear request).
3. `dispatcher` carrega regras **ativas** do `board_id` com gatilho compatível.
4. Para cada regra: `compile(graph)` → se trigger match → enfileira `AutomationRun`.
5. Worker Celery executa plano: nós de filtro (AND em cadeia) → nós de ação (sequencial).
6. Persiste `AutomationRun` + `step_logs`; ações mutantes respeitam `dry_run` (no-op com log).

### 2.3 Princípios

| Princípio | Implementação |
|-----------|----------------|
| Sem `eval` | Parâmetros JSON validados por JSON Schema por `action_id` / `filter_id` |
| Idempotência | `UniqueConstraint(run)` em `(rule_id, event_id)` |
| Profundidade | Máx. 1 nível de re-disparo: flag `automation_origin` no contexto impede loop |
| Timeout dry-run | HTTP 30s; worker 120s por run |
| IA Status Report | **Fora** das regras — continua no save do relatório (código atual) |

---

## 3. Modelo de dados (Django)

**App sugerido:** `plane.db.models.board_automation` (ou módulo `automation` sob `board`).

### 3.1 `BoardAutomationRule`

| Campo | Tipo | Notas |
|-------|------|--------|
| `id` | UUID | PK (`BaseModel`) |
| `workspace` | FK → Workspace | Denormalizado para queries |
| `board` | FK → Board | Escopo da regra |
| `name` | CharField(255) | |
| `description` | TextField | blank |
| `enabled` | BooleanField | default False |
| `graph` | JSONField | Ver §4 |
| `graph_version` | PositiveSmallIntegerField | default 1 — migrações de schema |
| `created_by` | FK → User | |
| `updated_by` | FK → User | null |

**Índices:** `(board_id, enabled)`, `(workspace_id, board_id)`.

### 3.2 `BoardAutomationRun`

| Campo | Tipo | Notas |
|-------|------|--------|
| `id` | UUID | PK |
| `rule` | FK → BoardAutomationRule | |
| `board` | FK → Board | |
| `event_id` | CharField(128) | UUID do evento de domínio |
| `event_type` | CharField(64) | ex. `issue.state.changed` |
| `status` | CharField(16) | `pending` \| `running` \| `success` \| `failed` \| `skipped` |
| `dry_run` | BooleanField | |
| `context_snapshot` | JSONField | Payload imutável do evento |
| `step_logs` | JSONField | Lista ordenada (§7.3) |
| `error_message` | TextField | blank |
| `started_at` | DateTimeField | null |
| `finished_at` | DateTimeField | null |

**Constraint:** `UniqueConstraint(fields=["rule", "event_id"], condition=Q(dry_run=False))`.

### 3.3 Migração

- Ficheiro: `plane/db/migrations/XXXX_board_automation.py`.
- Sem dados seed; regras criadas só via UI.

---

## 4. Schema do grafo (canvas)

Persistido em `BoardAutomationRule.graph`.

```json
{
  "version": 1,
  "viewport": { "x": 0, "y": 0, "zoom": 1 },
  "nodes": [
    {
      "id": "n1",
      "type": "trigger",
      "position": { "x": 0, "y": 0 },
      "data": {
        "catalog_id": "issue.state.changed",
        "params": {}
      }
    },
    {
      "id": "n2",
      "type": "filter",
      "position": { "x": 200, "y": 0 },
      "data": {
        "catalog_id": "issue.state.equals",
        "params": { "state_id": "uuid" }
      }
    },
    {
      "id": "n3",
      "type": "action",
      "position": { "x": 400, "y": 0 },
      "data": {
        "catalog_id": "notification.send",
        "params": {
          "channel": "in_app",
          "template": "issue_done"
        }
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3" }
  ]
}
```

### 4.1 Tipos de nó (MVP)

| `type` | Máx. por grafo | Saídas |
|--------|----------------|--------|
| `trigger` | 1 | ≥1 edge |
| `filter` | ilimitado | 1 (pass) ou branch futuro |
| `action` | ilimitado | 0 (folha) ou chain |

### 4.2 Validação (API + front)

- Exatamente **um** nó `trigger`.
- Grafo **acíclico** (DFS).
- Todos os `catalog_id` existem e `params` validam contra schema do catálogo.
- Todos os nós alcançáveis a partir do trigger.
- Pelo menos **uma** ação alcançável (regra não vazia).
- `edges` só ligam tipos compatíveis: `trigger→filter|action`, `filter→filter|action`, `action→action` (cadeia).

### 4.3 Compilação (`compiler.py`)

Output interno `ExecutionPlan`:

```python
@dataclass
class ExecutionPlan:
    trigger_id: str
    trigger_params: dict
    steps: list[PlanStep]  # ordenado topologicamente

@dataclass
class PlanStep:
    node_id: str
    kind: Literal["filter", "action"]
    catalog_id: str
    params: dict
```

---

## 5. Catálogo (registry)

**Módulo:** `plane/automation/catalog/` (ou `plane/app/automation/`).

Cada entrada implementa interface comum:

```python
class CatalogEntry(Protocol):
    id: str
    kind: Literal["trigger", "filter", "action"]
    label_i18n_key: str
    description_i18n_key: str
    param_schema: dict  # JSON Schema draft-07
    supported_event_types: list[str] | None  # triggers only

    def matches_event(self, event: DomainEvent, params: dict) -> bool: ...  # trigger
    def evaluate(self, event: DomainEvent, params: dict, ctx: RunContext) -> bool: ...  # filter
    def execute(self, event: DomainEvent, params: dict, ctx: RunContext) -> StepResult: ...  # action
```

**API:**

```http
GET /api/workspaces/{slug}/boards/{board_slug}/automation/catalog/
```

Query opcional: `?kind=trigger|filter|action`.

Resposta (exemplo):

```json
{
  "triggers": [
    {
      "id": "issue.created",
      "label": "Issue criada",
      "param_schema": { "type": "object", "properties": {} }
    }
  ],
  "filters": [...],
  "actions": [...]
}
```

O front monta paleta de nós a partir desta resposta (ícones/cores por `kind`).

### 5.1 Gatilhos MVP (implementar)

| `id` | Evento `event_type` | `matches_event` |
|------|---------------------|-----------------|
| `issue.created` | `issue.created` | entity issue, created |
| `issue.updated` | `issue.updated` | issue, any field change |
| `issue.state.changed` | `issue.updated` | `state_id` em `changed_fields` |
| `status_report.saved` | `status_report.saved` | draft save |
| `status_report.published` | `status_report.published` | `is_published` true |
| `comment.added` | `comment.added` | IssueComment created |

**Fase 1.1+ (emitir eventos, executar depois):** `module.*`, `project.*`, `user.invited` — registar stubs no catálogo com `enabled: false` ou omitir até hooks existirem.

### 5.2 Filtros MVP (catálogo dinâmico — primeira leva)

| `id` | Descrição | `param_schema` |
|------|-----------|----------------|
| `issue.state.equals` | Estado = | `state_id` uuid |
| `issue.type.equals` | Tipo de card = | `issue_type_id` |
| `issue.priority.equals` | Prioridade = | enum |
| `issue.assignee.is` | Responsável | user_id \| empty |
| `issue.project.equals` | Projeto = | `project_id` |
| `issue.module.equals` | Módulo = | `module_id` |
| `issue.field.equals` | Campo custom (board) | `field_key`, `value` |
| `actor.role.is` | Papel do ator | role key |
| `status_report.module.equals` | Módulo do report | `module_id` |

**Extensão:** gerador que lê `BoardCustomField`, estados do projeto, tipos do board → adiciona entradas `issue.field.*` automaticamente.

### 5.3 Ações MVP

| `id` | Efeito colateral | Dry-run |
|------|------------------|---------|
| `issue.set_field` | Update via service layer | log only |
| `issue.add_comment` | Cria comentário (sistema/bot user) | log only |
| `issue.transition` | Muda `state_id` | log only |
| `notification.send` | In-app / e-mail | log only |
| `webhook.post` | HTTP POST (reutilizar validação `validate_url`) | log request |
| `integration.slack` | Webhook URL estilo Slack | log only |
| `integration.teams` | Idem | log only |
| `integration.jira.create_issue` | API Jira (config board — credenciais em settings) | log only |
| `integration.jira.update_issue` | Idem | log only |
| `ai.issue_comment` | `ai-assistant` + post comment | log only |
| `ai.issue_priority` | LLM + set priority | log only |
| `ai.issue_description` | LLM + set description_html | log only |
| `ai.text_template` | LLM com prompt do params | log only |

**Bot user:** criar `WorkspaceIntegrationBot` ou usar `created_by` da regra com flag `automation_actor_id` no contexto.

---

## 6. Eventos de domínio

### 6.1 `DomainEvent`

```python
@dataclass(frozen=True)
class DomainEvent:
    event_id: str          # uuid4
    event_type: str
    workspace_id: str
    board_id: str
    actor_id: str | None
    entity_type: str
    entity_id: str
    project_id: str | None
    payload: dict          # snapshot "after"; issue inclui changed_fields
    occurred_at: datetime
    automation_origin: bool  # True se causado por automação
```

### 6.2 Pontos de emissão (alterar código existente)

| Local | Evento |
|-------|--------|
| `IssueViewSet` create / update | `issue.created`, `issue.updated`, derivar `issue.state.changed` |
| `IssueCommentViewSet` create | `comment.added` |
| `BoardStatusReportViewSet` update | `status_report.saved`, `status_report.published` |
| (futuro) Module/Project views | `module.*`, `project.*` |
| (futuro) Workspace invitation | `user.invited` |

**Padrão:** função `emit_automation_event(event)` → `dispatcher.enqueue_matching_rules(event)` (não bloquear >5ms; só DB read + Celery delay).

**Resolver `board_id`:** issue → `project` → board via relação board↔project (confirmar modelo `BoardProject` ou equivalente no fork).

---

## 7. Executor

### 7.1 `RunContext`

```python
@dataclass
class RunContext:
    dry_run: bool
    rule: BoardAutomationRule
    event: DomainEvent
    run_id: str
    step_logs: list[dict]
```

### 7.2 Algoritmo

```text
1. compile(rule.graph) → plan
2. if not trigger.matches_event(event): return skipped
3. for step in plan.steps:
     if step.kind == filter:
         ok = catalog.evaluate(...)
         if not ok: return skipped (log filter failed)
     if step.kind == action:
         if dry_run: append log { simulated: true }
         else: catalog.execute(...)
4. return success
```

### 7.3 Formato `step_logs`

```json
{
  "node_id": "n3",
  "catalog_id": "notification.send",
  "status": "success",
  "started_at": "2026-05-19T12:00:00Z",
  "duration_ms": 45,
  "message": "Notificação enfileirada",
  "detail": {}
}
```

### 7.4 Celery

```python
@shared_task(bind=True, max_retries=3)
def execute_automation_run(self, run_id: str): ...

@shared_task
def process_automation_event(self, event_payload: dict): ...
```

Fila dedicada recomendada: `automation` (configurar em `CELERY_TASK_ROUTES`).

---

## 8. API REST

**Base:** `/api/workspaces/{slug}/boards/{board_slug}/automation/`

**Permissão:** leitura/escrita exige `board.administer` ou workspace admin — reutilizar `allow_workspace_or_board_admin` de `operis.app.permissions.board_access`.

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/catalog/` | Catálogo completo |
| GET | `/rules/` | Lista regras do board |
| POST | `/rules/` | Criar (valida grafo) |
| GET | `/rules/{id}/` | Detalhe |
| PATCH | `/rules/{id}/` | Atualizar grafo, nome, enabled |
| DELETE | `/rules/{id}/` | Soft delete |
| POST | `/rules/{id}/validate/` | Valida grafo sem persistir |
| POST | `/rules/{id}/dry-run/` | Body: `{ "event_type", "payload" }` ou replay último evento |
| GET | `/rules/{id}/runs/` | Paginação de execuções |
| GET | `/runs/{run_id}/` | Detalhe run + step_logs |

**Serializers:** `BoardAutomationRuleSerializer`, `BoardAutomationRunSerializer` (lite).

**OpenAPI:** adicionar tag `board-automation` em `plane/utils/openapi/`.

---

## 9. Frontend (`apps/web`)

### 9.1 Rotas (já existe shell)

- `/{workspaceSlug}/settings/boards/{boardSlug}/automacao` — substituir `BoardSettingsSectionPage` placeholder.

### 9.2 Estrutura de componentes

```text
core/components/settings/board/automation/
  automation-rules-list.tsx
  automation-rule-editor.tsx      # layout página
  automation-canvas.tsx           # React Flow wrapper
  nodes/
    trigger-node.tsx
    filter-node.tsx
    action-node.tsx
  panels/
    node-palette.tsx              # catálogo drag
    node-inspector.tsx            # params form from JSON Schema
  automation-runs-drawer.tsx
  automation-dry-run-dialog.tsx
```

### 9.3 Dependências

- `@xyflow/react` (React Flow v12+).
- Form dinâmico: `@rjsf/core` ou forms manuais por `catalog_id` (MVP: subset manual + fallback JSON).

### 9.4 Serviço

`core/services/board/board-automation.service.ts` — espelha endpoints §8.

### 9.5 i18n

Chaves sob `boards.settings.automation.*` (pt-BR / en).

### 9.6 UX

- Lista: nome, ativo/inativo toggle, última execução, autor.
- Editor: canvas + painel esquerdo (paleta) + painel direito (propriedades do nó selecionado).
- Botões: **Guardar**, **Ativar/Desativar**, **Testar (dry-run)**, **Ver histórico**.
- Validação inline (grafo inválido → não guarda).

---

## 10. Segurança

| Risco | Mitigação |
|-------|-----------|
| SSRF em webhooks | Reutilizar `validate_url` + `WEBHOOK_ALLOWED_IPS` |
| Loop infinito | `automation_origin` + max 1 re-entrada por cadeia |
| Privilege escalation | Ações usam service layer com `actor` = bot; não elevam permissão do utilizador |
| Jira credentials | Guardar em `BoardIntegrationSettings` cifrado; nunca logar tokens |
| Prompt injection (IA) | Sanitizar template; limite de tamanho; rate limit LLM |

---

## 11. Observabilidade

- Log estruturado: `rule_id`, `run_id`, `event_type`, `board_id`.
- Métricas futuras: `automation_runs_total{status}`, `automation_duration_seconds`.
- Admin UI: lista de runs com filtro por status/data.

---

## 12. Fora de escopo (MVP)

- Cron / `schedule.cron` (Fase 1.1).
- Templates de cenários pré-montados.
- n8n embutido.
- Scripting utilizador.
- Aprovação workflow de regras.
- Variáveis `{{issue.title}}` em todos os campos (Fase 2 — preparar `param_schema` com `supports_templates: false`).
- Branch visual if/else com duas saídas (Fase 2 — grafo já suporta cadeia linear).

---

## 13. Plano de implementação (épico → stories)

Ordem sugerida para PRs pequenos:

### Sprint A — Fundação backend

1. **A1** Modelos + migração `BoardAutomationRule`, `BoardAutomationRun`.
2. **A2** `catalog/` registry + gatilhos/issue + filtros base + 2 ações (`issue.set_field`, `notification.send`).
3. **A3** `compiler.py` + testes unitários (grafos válidos/inválidos).
4. **A4** `executor.py` + dry-run + testes.
5. **A5** `dispatcher` + `automation_task.py` + hook em `Issue` create/update.

### Sprint B — API + mais catálogo

6. **B1** ViewSet CRUD + catalog endpoint + permissões.
7. **B2** Hooks status report + comment.
8. **B3** Ações: webhook, e-mail, in-app, IA (4 ações).
9. **B4** Integrações Slack/Teams/Jira (stubs configuráveis).

### Sprint C — Frontend

10. **C1** Service + lista de regras.
11. **C2** React Flow canvas + paleta + persistência.
12. **C3** Inspector de parâmetros (schemas principais).
13. **C4** Dry-run dialog + drawer de runs.

### Sprint D — Endurecimento

14. **D1** Testes integração API + Celery (eager).
15. **D2** Documentação utilizador (help sidebar).
16. **D3** Filtros dinâmicos a partir de custom fields do board.

---

## 14. Critérios de aceite (testáveis)

- [ ] Admin do board cria regra no canvas com 1 trigger e ≥1 ação; guarda e ativa.
- [ ] Alterar issue para estado configurado dispara run em &lt;30s (p95) com sucesso.
- [ ] Dry-run não altera issue/comentário/notification.
- [ ] Run duplicado para mesmo `(rule_id, event_id)` não executa duas vezes.
- [ ] Regra desativada não gera run.
- [ ] Catálogo GET devolve todos os ids implementados com `param_schema`.
- [ ] Utilizador sem `board.administer` recebe 403.
- [ ] Grafo com ciclo ou sem trigger retorna 400 na validação.
- [ ] Status report: publicar dispara `status_report.published` quando regra existir.
- [ ] Resumo executivo IA ao guardar SR **não** passa pelo motor de automação.

---

## 15. Dependências a confirmar no código

Antes de Sprint A, validar no fork:

| Pergunta técnica | Onde verificar |
|------------------|----------------|
| Como obter `board_id` a partir de `project_id` / issue? | Modelos board↔project |
| User «bot» para ações automáticas | Criar ou reutilizar |
| Notification in-app / e-mail | `notification_task`, templates |
| Página `automacao` board settings | `board-settings.ts`, route existente |
| Jira credentials por board | Pode ser settings JSON em `Board` ou novo model |

---

## 16. Referências no monorepo

| Área | Caminho |
|------|---------|
| Plano produto | `docs/operis-automacao-mvp-plano.md` |
| Permissão board admin | `apps/api/operis/app/permissions/board_access.py` |
| Board roles | `apps/api/operis/utils/board_roles.py` |
| Webhooks (padrão HTTP) | `apps/api/operis/bgtasks/webhook_task.py` |
| IA workspace | `apps/api/operis/app/views/external/base.py` |
| UI placeholder | `apps/web/.../settings/boards/[boardSlug]/automacao/page.tsx` |
| Nav automação | `apps/web/core/constants/board-settings.ts` |

---

## 17. Histórico

| Versão | Data | Notas |
|--------|------|-------|
| 0.1 | 2026-05-19 | Spec inicial MVP |
