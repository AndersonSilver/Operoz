# API Reference — Assistente Operoz

Base: `/api/workspaces/{slug}/assistant/`

Autenticação: **sessão** (cookie) ou mecanismo padrão da API app. Permissões por endpoint abaixo.

Especificação OpenAPI: [openapi/assistant.yaml](./openapi/assistant.yaml)  
Swagger UI (quando `ENABLE_DRF_SPECTACULAR=1`): `/api/schema/swagger-ui/`

---

## Sessões

### `POST /sessions/`

Cria sessão de chat.

**Roles:** ADMIN, MEMBER, GUEST

**Body:**

```json
{
  "title": "Opcional",
  "context": { "board_slug": "ops", "project_id": "uuid-opcional" }
}
```

**201:** `AssistantSession` (`id`, `title`, `context`, `created_at`, `updated_at`)

---

### `GET /sessions/`

Lista sessões do utilizador autenticado no workspace.

**200:** array de `AssistantSession`

---

### `GET|PATCH|DELETE /sessions/{session_id}/`

Detalhe, atualização de título/contexto, ou remoção.

**404** se sessão de outro utilizador.

---

### `GET /sessions/{session_id}/messages/`

Histórico de mensagens da sessão.

**200:** array de `AssistantMessage`

---

## Chat

### `POST /sessions/{session_id}/chat/`

Envia mensagem e recebe resposta.

**Body:**

```json
{
  "message": "Texto do utilizador",
  "stream": false
}
```

**Resposta síncrona (200):**

```json
{
  "message": { "id": "...", "role": "assistant", "content": "...", "citations": [], "metadata": {} },
  "session": { "id": "...", "title": "..." }
}
```

**Streaming (SSE):** `Accept: text/event-stream` ou `"stream": true`

Eventos `data:` JSON:

| type                      | Descrição                                  |
| ------------------------- | ------------------------------------------ |
| `token`                   | Fragmento de texto                         |
| `tool_start` / `tool_end` | Execução de ferramenta                     |
| `done`                    | Mensagem final + sessão                    |
| `error`                   | `error`, `message`, opcional `retry_after` |

**Erros comuns:**

| HTTP | code                                       | Causa           |
| ---- | ------------------------------------------ | --------------- |
| 400  | `empty_message`                            | Mensagem vazia  |
| 403  | `forbidden`                                | Sem membership  |
| 429  | `user_rate_limit` / `workspace_rate_limit` | Limite horário  |
| 503  | `llm_not_configured`                       | Sem LLM_API_KEY |

---

### `POST /sessions/{session_id}/confirm-action/`

Confirma proposta de ação (comentário, estado, automação, pack).

**Roles:** ADMIN, MEMBER

**Body:**

```json
{
  "proposal": {
    "action_type": "issue_comment",
    "issue_id": "...",
    "body": "..."
  }
}
```

**200:** `{ "ok": true, "result": { ... } }`

---

## Feedback

### `PATCH /sessions/{session_id}/messages/{message_id}/feedback/`

**Body:** `{ "rating": "up" | "down" | "clear" }`

**200:** `AssistantMessage` atualizado (`metadata.feedback_rating`)

---

## Admin — uso e qualidade

### `GET /usage/`

**Role:** ADMIN

**Query:** `days` (1–30, default 7)

**200:** resumo de tokens, budget, série diária

---

### `GET /quality/`

**Role:** ADMIN

**Query:** `days` (default 7)

**200:**

```json
{
  "assistant": {
    "tool_usage": { "rate": 0.72, "meets_target": true },
    "satisfaction": { "rate": 0.85, "meets_target": true },
    "latency": { "p95_first_token_ms": 2100, "meets_target": true },
    "hallucination_reviews": { "rate": 0.1, "meets_target": true }
  },
  "automation": { "p95_duration_ms": 450, "meets_target": true }
}
```

---

### `GET|POST /quality/reviews/`

Revisões manuais de qualidade (amostra quinzenal).

**POST body:**

```json
{
  "verdict": "ok | hallucination | incomplete | unsafe",
  "message_id": "uuid-opcional",
  "notes": "..."
}
```

---

## Tools internas (LLM)

Não são endpoints HTTP — invocadas pelo modelo via tool-calling:

| Tool                              | Descrição                       |
| --------------------------------- | ------------------------------- |
| `search_issues`                   | Busca cards                     |
| `get_issue`                       | Detalhe de card                 |
| `get_client_360_summary`          | Resumo Cliente 360              |
| `search_pages`                    | Busca páginas                   |
| `get_page_content`                | Conteúdo de página              |
| `get_automation_metrics`          | Analytics de automação          |
| `get_automation_run`              | Detalhe de execução             |
| `list_intake_pending`             | Intake pendente                 |
| `get_project_stats`               | Estatísticas de projeto         |
| `list_board_projects`             | Projetos do board               |
| `propose_automation_rule`         | Proposta de regra (confirmação) |
| `explain_automation_run`          | Explica falha de run            |
| `list_automation_packs`           | Packs disponíveis               |
| `propose_automation_pack_install` | Proposta de instalação          |
| `propose_issue_comment`           | Proposta de comentário          |
| `propose_issue_state_change`      | Proposta de mudança de estado   |

Cross-link MCP externo: [operis-mcp.md](./operis-mcp.md#assistente-operoz-vs-mcp-externo)
