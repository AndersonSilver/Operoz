# Operis — Plataforma Violenta: Arquitetura Claude Code + Assistente Conversacional

**Documento mestre de visão, arquitetura e planos de ação.**

| Campo            | Valor                                                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Versão**       | 0.1                                                                                                                                                        |
| **Data**         | 2026-06-09                                                                                                                                                 |
| **Estado**       | Em execução — Fase 0 backend iniciada                                                                                                                      |
| **Escopo**       | Motor de automação estilo Claude Code + Chat Operis (RAG + tools)                                                                                          |
| **Relacionados** | [operis-automacao-mvp-spec.md](./operis-automacao-mvp-spec.md), [operis-mcp.md](./operis-mcp.md), [operis-cliente-360-mvp.md](./operis-cliente-360-mvp.md) |

---

## 1. Visão

Transformar o Operis de um **board com automações** em uma **plataforma operacional inteligente**:

1. **Motor de automação extensível** — arquitetura inspirada no ecossistema Claude Code (plugins, hooks, skills, agents, commands, MCP).
2. **Assistente conversacional nativo** — chat onde o usuário pergunta sobre cards, sustentação, métricas, documentação de projetos, automações, Cliente 360, intake — com respostas **fundamentadas em dados reais** e **respeitando permissões**.

**North Star:** _"Pergunte qualquer coisa sobre sua operação e o Operis responde com dados, ações e automações — não com alucinação."_

---

## 2. Estado atual (baseline)

### 2.1 O que já existe

| Área                 | Situação                                                        | Caminhos-chave                                   |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------ |
| Automação por board  | Grafo, catalog, executor, outbox, Celery, cron, e-mail, scripts | `apps/api/operis/automation/`                    |
| LLM básico           | `ai-assistant` workspace/projeto; Ask Pi no editor de páginas   | `apps/api/operis/app/views/external/base.py`     |
| MCP externo          | 379 tools para agentes externos (Cursor, Claude Desktop)        | `mcp-server/`                                    |
| Search               | Global + issues + entity search                                 | `apps/api/operis/app/views/search/`              |
| Documentação         | Pages com rich-text, versões, lock                              | `apps/api/operis/db/models/page.py`              |
| Métricas             | Analytics avançado, automation metrics, Cliente 360             | `app/views/analytic/`, `automation/analytics.py` |
| Intake / sustentação | Intake forms, inbox                                             | `db/models/intake*.py`                           |
| Permissões           | Workspace → Project → Board roles                               | `utils/permissions/`, `board_roles.py`           |

### 2.2 Lacunas críticas

| Lacuna                               | Impacto                                                    |
| ------------------------------------ | ---------------------------------------------------------- |
| Sem RAG / embeddings                 | Chat não consegue responder sobre docs longas com precisão |
| Sem chat persistente                 | Cada prompt é isolado; sem histórico de sessão             |
| Sem tool-calling no assistente       | LLM não consulta API automaticamente                       |
| Catálogo de automação fechado        | Só nós hardcoded em Python                                 |
| Sem hooks Pre/Post na execução       | Governança limitada                                        |
| `ai-assistant` sem contexto de board | Não cobre sustentação, Cliente 360, automação              |
| MCP só para agentes externos         | Usuário final no web não usa MCP                           |

---

## 3. Arquitetura Claude Code → Operis (mapa completo)

> **Referência detalhada (implementado):** [claude-code-operoz-mapping.md](./claude-code-operoz-mapping.md)

### 3.1 Princípios a importar

```text
Claude Code                          Operis (alvo)
─────────────────────────────────────────────────────────────────
Plugin manifest (.claude-plugin/)    Automation Pack (pack.json)
Commands (slash /workflow)           Playbooks / Templates de automação
Agents (subagentes especializados)   Agent Nodes + Assistente tools
Skills (SKILL.md lazy-loaded)        Board Playbooks + Knowledge Packs
Hooks (Pre/Post/Stop)                Lifecycle hooks no executor
MCP servers                          Integration Packs + Operis Tools API
Session + correlation                Chat session + automation run_id
Marketplace                          Galeria de packs (oficial + comunidade)
Ralph loop (iterar até completar)    Nó retry_until + loop graph
Confidence scoring (code-review)     decision.llm com threshold
Security-guidance (PreToolUse)       Policy engine PreAction
```

### 3.2 Camadas da plataforma alvo

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ CAMADA 4 — EXPERIÊNCIA                                                      │
│  Chat Operis │ Galeria Playbooks │ Canvas Automação │ Cliente 360 + IA      │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────────┐
│ CAMADA 3 — INTELIGÊNCIA                                                     │
│  RAG (pages, issues, comments) │ Tool Router │ Agent Orchestrator           │
│  Confidence scoring │ Summarization │ Intent classification                 │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────────┐
│ CAMADA 2 — MOTOR (estilo Claude Code)                                       │
│  Catalog │ Hooks │ Packs │ Parallel fan-out │ Outbox │ Governance           │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────────┐
│ CAMADA 1 — DADOS & PERMISSÕES                                             │
│  Issues │ Pages │ Intake │ Analytics │ Automation runs │ Board roles        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Pilar A — Motor de automação "violento"

### 4.1 Automation Packs (≈ Plugins Claude Code)

**Conceito:** pacote instalável por workspace/board com triggers, filters, actions, hooks e templates.

```text
operis-pack-status-semanal/
├── pack.json                 # manifest (name, version, permissions)
├── triggers/
├── filters/
├── actions/
├── hooks/
│   └── hooks.json
├── playbooks/
│   └── status-report-semanal.graph.json
├── skills/
│   └── sla-sustentacao/
│       ├── SKILL.md
│       └── references/
└── assets/
    └── email-templates/
```

**pack.json (rascunho):**

```json
{
  "name": "operis-pack-gestao-operacional",
  "version": "1.0.0",
  "description": "Status report, sustentação, alertas",
  "permissions": ["action.send_email", "action.webhook"],
  "hooks": "./hooks/hooks.json",
  "playbooks": ["./playbooks/status-report-semanal.graph.json"]
}
```

**Entregáveis:**

- [ ] Schema `pack.json` + validador
- [ ] API `POST /workspaces/{slug}/automation-packs/` (install/uninstall)
- [ ] Registry dinâmico que merge com `AutomationCatalog` estático
- [ ] Sandbox para handlers de pack (sem import arbitrário de Python em produção)

### 4.2 Lifecycle Hooks (≈ hooks.json Claude Code)

Eventos no executor:

| Hook          | Momento                 | Exemplos                                  |
| ------------- | ----------------------- | ----------------------------------------- |
| `PreDispatch` | Antes de criar outbox   | Rate limit extra, horário comercial       |
| `PreAction`   | Antes de cada nó action | Bloquear webhook para URL não allowlisted |
| `PostAction`  | Depois de cada action   | Métricas, enriquecer contexto             |
| `OnFailure`   | Action falhou           | DLQ customizado, notificar admin          |
| `OnComplete`  | Run terminou            | Webhook de auditoria                      |

**Implementação:** extensão de `executor.py` + tabela `BoardAutomationHook` ou hooks embutidos no pack.

**Entregáveis:**

- [ ] Interface `HookHandler` + registry
- [ ] Matcher por `catalog_key` (ex.: só em `action.webhook`)
- [ ] UI: aba "Hooks" nas settings de automação do board
- [ ] Logs de hook no histórico de execução (step tipo `hook`)

### 4.3 Board Playbooks / Skills (≈ SKILL.md)

Conhecimento procedural por board:

- Regras de SLA de sustentação
- Definição de "atrasado" / "crítico"
- Templates de comunicação
- Glossário do cliente

Injetados em:

- `build_execution_context()` (automação)
- System prompt do Assistente (chat)
- Filtros LLM com confidence threshold

**Entregáveis:**

- [ ] Modelo `BoardPlaybook` (markdown + metadata)
- [ ] API CRUD + versionamento
- [ ] Resolver lazy: só carrega playbook relevante ao intent
- [ ] UI editor (markdown) nas settings do board

### 4.4 Nós avançados no grafo

| Nó                   | Inspiração                       | Função                                      |
| -------------------- | -------------------------------- | ------------------------------------------- |
| `parallel.fan_out`   | code-review (4 agents paralelos) | E-mail + Slack + webhook em paralelo        |
| `action.retry_until` | Ralph Wiggum                     | Repetir até condição ou max_iterations      |
| `decision.llm`       | confidence scoring               | Classificar card com score ≥ threshold      |
| `action.mcp_call`    | MCP integration                  | Chamar integração tipada (Slack, Jira…)     |
| `action.operis_tool` | Claude tool use                  | Executar tool interna com permissão do user |

**Entregáveis:**

- [ ] Extensão `compiler.py` + `executor.py`
- [ ] UI dos novos nós no canvas
- [ ] Testes de integração por nó

### 4.5 Galeria de templates (≈ Commands)

Playbooks one-click:

- Status Report Semanal (cron + e-mail) — **já existe como caso real**
- Escalar card parado há N dias
- Lembrete de sustentação SLA
- Boas-vindas intake

**Entregáveis:**

- [ ] `GET /automation/templates/`
- [ ] Wizard "Usar template" → publica regra
- [ ] 5 templates oficiais no repo `packs/`

### 4.6 Policy engine (≈ security-guidance)

Antes de executar ações de risco:

- Allowlist de domínios (webhook)
- Script sandbox reforçado (timeout, sem `fs`/`child_process` por padrão)
- Dry-run obrigatório na primeira publicação de regra em produção
- Audit log: quem publicou, diff do grafo

**Entregáveis:**

- [ ] `operis/automation/policy.py`
- [ ] Integração PreAction hooks
- [ ] UI de políticas no board (admin)

### 4.7 Escala (300+ automações)

| Ação                                      | Prioridade |
| ----------------------------------------- | ---------- |
| Fila `email` separada + worker async SMTP | Alta       |
| `automation-worker` escalável (`scale N`) | Alta       |
| Concorrência explícita (`-c`)             | Média      |
| Fan-out paralelo no grafo                 | Média      |
| Rate limit por workspace configurável     | Média      |

---

## 5. Pilar B — Assistente Operis (Chat)

### 5.1 O que o usuário pode perguntar

| Domínio            | Exemplos de perguntas                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| **Cards / issues** | "Quantos cards atrasados no projeto X?" "Quem está com sustentação aberta?" |
| **Sustentação**    | "Liste chamados de sustentação críticos esta semana"                        |
| **Métricas**       | "Como está a saúde da carteira no board Y?" "Cobertura de status report?"   |
| **Cliente 360**    | "Quais clientes estão em critical?" "Resumo do cliente Acme"                |
| **Documentação**   | "O que diz o PRD sobre autenticação?" "Resuma a página de arquitetura"      |
| **Automação**      | "Por que a regra Status Report falhou ontem?" "Quantas execuções com erro?" |
| **Intake**         | "Quantos formulários pendentes no inbox?"                                   |
| **Operacional**    | "Crie um lembrete para cards sem assignee há 3 dias" (ação)                 |

### 5.2 Arquitetura do chat

```text
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  Web Chat UI │────▶│  Assistant API  │────▶│  LLM Provider    │
│  (sidebar)   │◀────│  /assistant/    │◀────│  OpenAI/Anthropic│
└──────────────┘     └────────┬────────┘     └──────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌────────────┐  ┌────────────┐  ┌────────────┐
       │ Tool Router│  │ RAG Engine │  │ Session DB │
       │ (MCP-like) │  │ (pgvector) │  │ + history  │
       └─────┬──────┘  └─────┬──────┘  └────────────┘
             │               │
             ▼               ▼
       ┌─────────────────────────────────────────┐
       │ Operis API (com permissões do usuário)  │
       │ issues │ pages │ analytics │ automation │
       │ client-360 │ intake │ search             │
       └─────────────────────────────────────────┘
```

### 5.3 Diferença: ai-assistant atual vs Assistente novo

| Aspecto    | `ai-assistant` hoje      | Assistente Operis (alvo)                         |
| ---------- | ------------------------ | ------------------------------------------------ |
| Escopo     | Workspace ou projeto     | Workspace + board + projeto (contexto explícito) |
| Dados      | Prompt do usuário apenas | Tools + RAG + playbook                           |
| Histórico  | Não                      | Sessões persistidas                              |
| Permissões | Básicas                  | Mesmas regras do usuário logado                  |
| Ações      | Não                      | Tool calling (criar comentário, listar, resumir) |
| Citações   | Não                      | Links para card, página, run de automação        |
| Streaming  | Parcial                  | SSE end-to-end                                   |

### 5.4 Tool Router (reuso do MCP)

O `mcp-server` já tem **379 operações** mapeadas. Estratégia:

1. **Fase 1:** subset curado (~30 tools) para o chat interno
2. **Fase 2:** gerar tools do mesmo registry com filtro de permissão
3. **Fase 3:** tools write (criar comentário, transicionar estado) com confirmação UI

**Tools prioritárias (MVP chat):**

| Tool                     | Fonte de dados        |
| ------------------------ | --------------------- |
| `search_issues`          | Issue search API      |
| `get_issue`              | Issue detail          |
| `list_board_projects`    | Board projects        |
| `get_client_360_summary` | Cliente 360 API       |
| `get_automation_metrics` | Automation analytics  |
| `get_automation_run`     | Run history           |
| `search_pages`           | Global search (pages) |
| `get_page_content`       | Page description      |
| `get_project_stats`      | Analytics             |
| `list_intake_pending`    | Intake/inbox          |

### 5.5 RAG — documentação e contexto

**Fontes indexáveis:**

| Fonte                       | Chunk strategy           | Atualização           |
| --------------------------- | ------------------------ | --------------------- |
| `Page.description_stripped` | Por heading / 512 tokens | Webhook on save       |
| `Issue.name + description`  | Por issue                | On update (debounced) |
| `IssueComment`              | Por comentário           | On create             |
| `BoardPlaybook`             | Por seção                | On publish            |
| `BoardStatusReport`         | Por report               | On publish            |
| Automation run errors       | Por run                  | On failure            |

**Stack sugerida:**

```text
Postgres + pgvector (ou Qdrant sidecar)
Embedding: text-embedding-3-small (OpenAI) ou modelo local
Pipeline: Celery task index_entity(entity_type, entity_id)
Query: hybrid search (BM25 via Postgres FTS + vector)
```

**Regra de ouro:** RAG **sempre** filtra por `workspace_id` + permissões do usuário **antes** de retornar chunks ao LLM.

### 5.6 Sessões e UX

**Modelo de dados:**

```text
AssistantSession
  - id, workspace_id, user_id
  - context: { board_slug?, project_id? }
  - created_at, title (auto-gerado)

AssistantMessage
  - session_id, role (user|assistant|tool)
  - content, tool_calls, citations[]
  - tokens_used, model
```

**UX (web):**

- Painel lateral global (atalho `Cmd+K` → "Perguntar ao Operis")
- Context chip: "Board: squad-as-a-service" / "Projeto: Acme"
- Respostas com cards clicáveis (issue, página, cliente)
- Modo "ação": "Posso criar um comentário no card #123?" → botão Confirmar
- Histórico de conversas por workspace

### 5.7 System prompt e playbooks

Estrutura do prompt (inspirado em agents Claude Code):

```text
1. Identidade: Assistente Operis, especialista na operação do board
2. Playbook do board (se existir) — regras de SLA, glossário
3. Contexto da sessão (board, projeto)
4. Tools disponíveis + quando usar cada uma
5. Regras: nunca inventar IDs; citar fontes; respeitar permissões
6. Formato: markdown, links internos Operis
```

### 5.8 Segurança do chat

| Risco                             | Mitigação                                          |
| --------------------------------- | -------------------------------------------------- |
| Vazamento cross-workspace         | Filtro obrigatório em toda query                   |
| Prompt injection via page content | Sanitizar chunks; marcar como `untrusted_content`  |
| Ações destrutivas                 | Confirmação humana + audit log                     |
| Custo LLM                         | Rate limit por user/workspace; cache de embeddings |
| Dados sensíveis em páginas        | Respeitar `Page.access` + project roles            |

---

## 6. Pilar C — Integração entre Chat e Automação

O diferencial "violento" é **chat + automação no mesmo motor**:

| Fluxo            | Descrição                                                             |
| ---------------- | --------------------------------------------------------------------- |
| Chat → Automação | "Crie uma regra que envia e-mail toda segunda" → gera grafo + dry-run |
| Automação → Chat | "Por que falhou?" → assistente lê `BoardAutomationRun.steps`          |
| Playbook → ambos | SLA de sustentação usado no filtro E nas respostas do chat            |
| Template → chat  | "Instale o pack Status Semanal" via conversa                          |

**Entregáveis futuros:**

- [ ] Tool `propose_automation_rule` (retorna JSON do grafo)
- [ ] Tool `explain_automation_run`
- [ ] Nó `action.ask_assistant` (classificação LLM dentro do grafo)

---

## 7. Planos de ação por fase

### Fase 0 — Fundação (2–3 semanas)

**Objetivo:** infra compartilhada sem quebrar o que existe.

| #   | Tarefa                                                 | Owner sugerido | Critério de pronto          |
| --- | ------------------------------------------------------ | -------------- | --------------------------- |
| 0.1 | RFC técnico aprovado (este doc)                        | Tech lead      | Review time                 |
| 0.2 | Modelos `AssistantSession`, `AssistantMessage`         | Backend        | Migrations                  |
| 0.3 | Endpoint `POST /assistant/chat` (sem RAG, com 5 tools) | Backend        | Postman + testes            |
| 0.4 | Refatorar LLM client (provider abstraction)            | Backend        | OpenAI + Anthropic          |
| 0.5 | UI chat sidebar (MVP)                                  | Frontend       | Enviar/receber mensagem     |
| 0.6 | Permission gate nas tools                              | Backend        | Guest não vê dados privados |

**Tools MVP:** `search_issues`, `get_issue`, `get_client_360_summary`, `search_pages`, `get_page_content`

---

### Fase 1 — Chat útil (3–4 semanas)

**Objetivo:** usuário tira dúvidas reais sobre cards, docs e Cliente 360.

| #   | Tarefa                                           | Critério de pronto         |
| --- | ------------------------------------------------ | -------------------------- |
| 1.1 | Sessões persistentes + histórico UI              | Lista conversas            |
| 1.2 | Context picker (board/projeto)                   | Chip visível no chat       |
| 1.3 | Streaming SSE                                    | Tokens em tempo real       |
| 1.4 | Citações com links (issue, page)                 | Markdown com URLs internas |
| 1.5 | Tools: automation metrics, intake, project stats | 10 tools total             |
| 1.6 | Rate limit Redis (user/workspace)                | 429 após limite            |
| 1.7 | Admin: config modelo + limites                   | Tela admin existente       |

---

### Fase 2 — RAG (3–4 semanas)

**Objetivo:** respostas sobre documentação longa com precisão.

| #   | Tarefa                                        | Critério de pronto           |
| --- | --------------------------------------------- | ---------------------------- |
| 2.1 | pgvector + tabela `search_embeddings`         | Migration                    |
| 2.2 | Indexador Celery (pages, issues)              | On-save + backfill command   |
| 2.3 | Hybrid retrieval (FTS + vector)               | Recall > 80% em test set     |
| 2.4 | Permission filter no retrieval                | Teste cross-project negativo |
| 2.5 | Chunk preview na UI (opcional)                | "Fonte: PRD v3"              |
| 2.6 | Reindex command `manage.py reindex_assistant` | Docs                         |

---

### Fase 3 — Motor Claude Code (4–6 semanas)

**Objetivo:** automação extensível e governada.

| #   | Tarefa                                            | Critério de pronto            |
| --- | ------------------------------------------------- | ----------------------------- |
| 3.1 | PreAction/PostAction hooks no executor            | Testes unitários              |
| 3.2 | Policy engine (webhook allowlist, script sandbox) | Bloqueio registrado           |
| 3.3 | `BoardPlaybook` model + API + UI                  | CRUD                          |
| 3.4 | Galeria 5 templates de automação                  | Install wizard                |
| 3.5 | Nó `parallel.fan_out`                             | E-mail + webhook paralelo     |
| 3.6 | Fila email async                                  | SMTP fora do worker principal |
| 3.7 | `action.retry_until`                              | Histórico mostra iterações    |

---

### Fase 4 — Automation Packs (4–5 semanas)

**Objetivo:** extensibilidade sem fork.

| #   | Tarefa                            | Critério de pronto          |
| --- | --------------------------------- | --------------------------- |
| 4.1 | Schema `pack.json` + validador    | JSON Schema                 |
| 4.2 | Install/uninstall API             | Board tem pack ativo        |
| 4.3 | Pack oficial "Gestão Operacional" | Status report + sustentação |
| 4.4 | Hooks em pack                     | hooks.json funcional        |
| 4.5 | Documentação para autores de pack | docs/packs-authoring.md     |

---

### Fase 5 — Inteligência avançada (6+ semanas)

**Objetivo:** moat competitivo.

| #   | Tarefa                                | Critério de pronto              |
| --- | ------------------------------------- | ------------------------------- |
| 5.1 | `decision.llm` com confidence         | Ramo humano se < 80             |
| 5.2 | Chat → propor automação (grafo JSON)  | Dry-run a partir do chat        |
| 5.3 | `action.mcp_call` (Slack, etc.)       | 1 integração piloto             |
| 5.4 | Assistente no Cliente 360 (briefing)  | Substituir ai-assistant pontual |
| 5.5 | Subagentes internos (triage paralelo) | 3 classificadores → merge       |
| 5.6 | Marketplace de packs (UI)             | Listar packs oficiais           |

---

## 8. Stack técnica recomendada

| Componente      | Escolha                            | Alternativa          |
| --------------- | ---------------------------------- | -------------------- |
| LLM             | Configurável (já existe)           | —                    |
| Embeddings      | OpenAI text-embedding-3-small      | Ollama local         |
| Vector store    | pgvector (mesmo Postgres)          | Qdrant               |
| Chat streaming  | Django SSE / ASGI                  | WebSocket            |
| Tool execution  | Python registry (subset MCP)       | HTTP para mcp-server |
| Jobs indexação  | Celery fila `assistant`            | —                    |
| Frontend chat   | React + Zustand store              | —                    |
| Automação async | Celery filas `automation`, `email` | —                    |

---

## 9. Modelo de dados (novos)

```text
# Assistente
assistant_session
assistant_message
search_embedding          # entity_type, entity_id, chunk, vector, workspace_id

# Automação estendida
board_playbook            # markdown, board_id, version
board_automation_hook     # event, matcher, handler_ref
automation_pack_install   # pack_name, version, board_id, config
```

---

## 10. APIs novas (rascunho)

```text
# Assistente
POST   /api/workspaces/{slug}/assistant/sessions/
GET    /api/workspaces/{slug}/assistant/sessions/
GET    /api/workspaces/{slug}/assistant/sessions/{id}/messages/
POST   /api/workspaces/{slug}/assistant/sessions/{id}/chat/     # SSE
DELETE /api/workspaces/{slug}/assistant/sessions/{id}/

# Playbooks
GET/POST/PATCH /api/workspaces/{slug}/boards/{board_slug}/playbooks/

# Packs
GET  /api/automation-packs/                                    # catálogo global
POST /api/workspaces/{slug}/boards/{board_slug}/packs/install/

# Hooks (board)
GET/POST /api/workspaces/{slug}/boards/{board_slug}/automation/hooks/
```

---

## 11. Métricas de sucesso

### Chat

| Métrica                                     | Meta Fase 1    | Meta Fase 2 |
| ------------------------------------------- | -------------- | ----------- |
| Perguntas respondidas com tool (não só LLM) | > 60%          | > 75%       |
| Satisfação (thumbs up/down)                 | > 70% positivo | > 80%       |
| Latência P95 primeira token                 | < 3s           | < 2s        |
| Hallucination rate (amostra manual)         | < 15%          | < 5%        |

### Automação

| Métrica                 | Meta Fase 3           |
| ----------------------- | --------------------- |
| Tempo P95 cron+email    | < 2s (com fila email) |
| 300 regras mesmo minuto | Fila < 2 min          |
| Regras via template     | > 50% novas regras    |

### Plataforma

| Métrica                          | Meta          |
| -------------------------------- | ------------- |
| Packs instalados por board ativo | ≥ 1 (oficial) |
| Playbooks por board enterprise   | ≥ 1           |

---

## 12. Riscos e mitigações

| Risco                           | Probabilidade | Mitigação                                   |
| ------------------------------- | ------------- | ------------------------------------------- |
| Custo LLM alto                  | Alta          | Rate limit, modelo menor para triage, cache |
| RAG retorna dados sem permissão | Média         | Filtro pré-retrieval obrigatório + testes   |
| Scope creep                     | Alta          | Fases rígidas; MVP chat antes de packs      |
| Script sandbox escape           | Média         | Policy engine + sem Node raw em prod        |
| MCP 379 tools confunde o modelo | Alta          | Subset curado + `list_tools` por domínio    |

---

## 13. O que NÃO fazer agora

- Reescrever o MCP server do zero (reutilizar registry)
- LLM em todo nó de automação (caro, lento)
- Marketplace aberto a terceiros antes da Fase 4 estável
- Chat sem permissões "para ir mais rápido"
- Vector DB separado antes de esgotar pgvector

---

## 14. Ordem de execução recomendada

```text
Fase 0 ──▶ Fase 1 ──▶ Fase 2
                │
                └──▶ Fase 3 (paralelo após 1.3)
                         │
                         └──▶ Fase 4 ──▶ Fase 5
```

**Primeiro entregável de valor:** Chat com tools (Fase 0+1) — usuário pergunta sobre cards, sustentação e Cliente 360 **na primeira month**.

**Segundo:** RAG para documentação de projetos.

**Terceiro:** Motor Claude Code (hooks, packs, templates) — escala automação.

---

## 15. Próximos passos imediatos

1. **Aprovar este documento** (ou marcar seções para cortar)
2. **Escolher prioridade:** Chat primeiro vs. Motor primeiro (recomendado: **Chat Fase 0**)
3. **Spike 2 dias:** `POST /assistant/chat` com `search_issues` + `get_client_360_summary`
4. **Definir squad:** 1 backend (API+RAG), 1 frontend (chat UI), 0.5 DevOps (pgvector)
5. **Criar issues** no backlog a partir das tabelas das Fases 0–1

---

## 16. Referências

- Claude Code plugins: `Claude Code/claude-code/plugins/`
- Operis automação: [operis-automacao-mvp-spec.md](./operis-automacao-mvp-spec.md)
- Operis MCP: [operis-mcp.md](./operis-mcp.md)
- Cliente 360: [operis-cliente-360-mvp.md](./operis-cliente-360-mvp.md)
- Claude Code docs: https://code.claude.com/docs/en/overview

---

_Documento gerado para planejamento interno. Revisar antes de iniciar implementação._
