# Escala do Assistente Operoz — infraestrutura

Guia de deploy para suportar alto volume de chat (150+ utilizadores). Complementa [assistant-env.md](./assistant-env.md).

**Governança:** [ADR-004](./operis-assistant-adr-004-chat-scaling.md) · [SLAs e baseline](./assistant-scaling-baseline.md) · [Go-live checklist](./assistant-go-live-checklist.md)

## Topologia (produção)

```text
Browser ──► proxy (Caddy) ──┬──► api:8000        (CRUD, auth, resto da API)
                            └──► api-chat:8000    (POST …/assistant/…/chat/ SSE)

api / api-chat / workers ──► operis-pgbouncer ──► operis-db (Postgres + pgvector)
```

## Serviços Docker

| Serviço            | Função                         | Porta (local)                   |
| ------------------ | ------------------------------ | ------------------------------- |
| `api`              | API principal                  | 8000                            |
| `api-chat`         | Chat SSE long-running          | 8001 (local) / 8000 (container) |
| `operis-pgbouncer` | Pool de conexões Postgres      | 6432 (host)                     |
| `proxy`            | Roteamento + sticky cookie SSE | 80/443                          |

## Variáveis

| Variável                      | Default | Descrição                                                      |
| ----------------------------- | ------- | -------------------------------------------------------------- |
| `GUNICORN_CHAT_WORKERS`       | `8`     | Workers Gunicorn no `api-chat`                                 |
| `GUNICORN_CHAT_TIMEOUT`       | `120`   | Timeout por request SSE (segundos)                             |
| `USE_PGBOUNCER`               | `0`     | `1` activa ajustes Django para transaction pooling             |
| `VITE_ASSISTANT_CHAT_API_URL` | (vazio) | URL do `api-chat` no frontend (local: `http://localhost:8001`) |

Com `USE_PGBOUNCER=1`, actualize também:

```env
POSTGRES_HOST=operis-pgbouncer
POSTGRES_PORT=5432
DATABASE_URL=postgresql://USER:PASS@operis-pgbouncer:5432/operis
```

## Desenvolvimento local

1. Subir stack: `docker compose -f docker-compose-local.yml up -d api api-chat operis-pgbouncer`
2. No `apps/web/.env`: `VITE_ASSISTANT_CHAT_API_URL=http://localhost:8001`
3. API CRUD continua em `:8000`; streams do assistente vão para `:8001`

## Proxy (Caddy)

Rotas do assistente têm prioridade sobre `/api/*`:

- Path: `/api/workspaces/*/assistant/sessions/*/chat*`
- Upstream: `api-chat:8000`
- `flush_interval -1` (SSE sem buffer)
- `lb_policy cookie assistant_sse` (sticky session para réplicas futuras)

## Limites de recursos (produção)

| Serviço    | mem_limit | cpus |
| ---------- | --------- | ---- |
| `api`      | 1536m     | 1.0  |
| `api-chat` | 2g        | 2.0  |

Ajuste conforme carga medida no teste de baseline.

## Runbook — deploy `api-chat` em produção

### Pré-requisitos

- [ ] `operis-pgbouncer` healthy
- [ ] `LLM_API_KEY` configurada
- [ ] Migrations aplicadas (`migrator`)

### Ordem de deploy

1. **PgBouncer** — subir `operis-pgbouncer`; validar `psql` via pool na porta interna
2. **Activar pool** — `USE_PGBOUNCER=1` + `POSTGRES_HOST=operis-pgbouncer` em `apps/api/.env`
3. **api-chat** — build e start; logs Gunicorn sem erros
4. **api** — rolling restart (workers CRUD)
5. **proxy** — reload Caddy; confirmar rota `@assistant_chat`
6. **Smoke test** — ver secção abaixo

### Smoke test pós-deploy

```bash
# Health instância (via api)
curl -sf "$WEB_URL/api/instances/" | head -c 200

# Chat SSE (via proxy — substituir slug, session, cookie de sessão)
curl -N -X POST "$WEB_URL/api/workspaces/SLUG/assistant/sessions/SESSION_ID/chat/" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -H "Cookie: sessionid=..." \
  -d '{"message":"ping","stream":true}'
```

Esperado: eventos `data: {"type":"token",...}` antes de `done`.

### Rollback

1. Reverter Caddy para `reverse_proxy /api/* api:8000` único (remover `@assistant_chat`)
2. Parar `api-chat`; tráfego volta todo para `api`
3. Se PgBouncer causar problemas: `USE_PGBOUNCER=0` e `POSTGRES_HOST=operis-db`

### Troubleshooting

| Sintoma                | Causa provável                 | Acção                                                   |
| ---------------------- | ------------------------------ | ------------------------------------------------------- |
| Tokens só no fim       | Proxy bufferiza SSE            | `flush_interval -1` no Caddy                            |
| `too many connections` | Sem PgBouncer + muitos workers | Activar PgBouncer; reduzir workers                      |
| 502 no chat            | `api-chat` down                | `docker logs api-chat`                                  |
| Stream corta aos 60s   | Timeout proxy/worker           | Aumentar `GUNICORN_CHAT_TIMEOUT` e `proxy_read_timeout` |

## Réplicas horizontais (futuro)

Para 2+ instâncias `api-chat`:

```caddy
reverse_proxy api-chat-1:8000 api-chat-2:8000 {
    flush_interval -1
    lb_policy cookie assistant_sse { fallback duration 24h }
}
```

O cookie `assistant_sse` mantém afinidade SSE por cliente.

## Fila assíncrona (Fase 3)

```text
POST /chat/ (async_mode=true) ──► 202 { job_id } ──► Celery assistant-chat
                                                      │
GET …/chat/jobs/{id}/stream/ ◄── Redis Stream ◄──────┘
```

| Variável                            | Default          | Descrição                                 |
| ----------------------------------- | ---------------- | ----------------------------------------- |
| `ASSISTANT_CHAT_CELERY_QUEUE`       | `assistant-chat` | Fila Celery de jobs de chat               |
| `ASSISTANT_CHAT_WORKER_CONCURRENCY` | `8`              | Workers `-c` do `assistant-chat-worker`   |
| `ASSISTANT_ASYNC_CHAT_DEFAULT`      | `0`              | Se `1`, POST stream enfileira por defeito |
| `VITE_ASSISTANT_ASYNC_CHAT`         | —                | Frontend: fluxo 202 + stream do job       |

Modo legado síncrono: `sync=1` na query ou `"sync": true` no body.

Idempotência: envie `client_message_id` — reenvios retornam o mesmo `job_id`.

Monitorização: `python manage.py check_celery_queues --queue assistant-chat`

Validação completa automatizada (Fase 7):

```bash
python manage.py validate_assistant_scaling
```

## Otimização RAG e hot path (Fase 4)

| Variável                                  | Default | Descrição                                       |
| ----------------------------------------- | ------- | ----------------------------------------------- |
| `ASSISTANT_RAG_QUERY_EMBEDDING_CACHE_TTL` | `600`   | TTL cache embedding de query (seg)              |
| `ASSISTANT_RAG_RESULTS_CACHE_TTL`         | `180`   | TTL cache resultados RAG pós-RRF (seg)          |
| `ASSISTANT_RAG_HNSW_EF_SEARCH`            | `40`    | `SET LOCAL hnsw.ef_search` nas buscas vetoriais |
| `ASSISTANT_SUMMARY_SYNC`                  | `0`     | Se `1`, resumo LLM síncrono em threads longas   |
| `ASSISTANT_DEFER_NONCRITICAL`             | `1`     | Audit log + métricas de qualidade via Celery    |

- Cache de query: prefixo `assistant:rag:query-embedding:` (normalização case-insensitive)
- Cache de resultados: `assistant:rag:results:{workspace}:{board}:{project}:{hash}` — invalidado em `index_entity_task`
- Summarization async: resumo persistido em `session.context.thread_summary` (task `summarize_session_task`)
- Migration `0162`: índice GIN FTS em `search_embeddings.content`

## Concorrência e proteção LLM (Fase 5)

| Variável                              | Default | Descrição                                             |
| ------------------------------------- | ------- | ----------------------------------------------------- |
| `ASSISTANT_MAX_CONCURRENT_LLM`        | `40`    | Semáforo global de chats LLM paralelos                |
| `ASSISTANT_MAX_ACTIVE_CHATS_PER_USER` | `2`     | Streams activos simultâneos por utilizador            |
| `ASSISTANT_FAIR_QUEUE_AVG_SECONDS`    | `15`    | Estimativa de espera por posição na fila              |
| `LLM_API_KEYS`                        | —       | Lista CSV de API keys (round-robin + circuit breaker) |
| `LLM_MODEL_FALLBACK`                  | —       | Modelo alternativo em modo degradado                  |
| `ASSISTANT_DEGRADED_QUEUE_THRESHOLD`  | `10`    | Slots LLM ocupados para activar degraded mode         |

Eventos SSE: `queue_update`, `degraded_mode`.

## Frontend resiliente sob carga (Fase 6)

| Entrega                  | Implementação                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| UI fila e retry          | Banners `queue_waiting`, erros 429/`retry_after`, botão retry com countdown               |
| Cache sessões            | MobX store TTL 30s; invalidação em create/delete/rename                                   |
| Indicador tools/latência | `AssistantThinkingIndicator` com labels i18n por tool, `aria-live`, timer até first token |
| Feature flag async       | `VITE_ASSISTANT_ASYNC_CHAT=1` — ver [assistant-env.md](./assistant-env.md)                |

## Observabilidade e validação (Fase 7)

| Entrega              | Implementação                                                                         |
| -------------------- | ------------------------------------------------------------------------------------- |
| Métricas Prometheus  | `GET /api/assistant/ops/metrics/` (token `ASSISTANT_METRICS_TOKEN`)                   |
| Alertas operacionais | `python manage.py check_assistant_alerts --fail-on-alert`                             |
| Fila assistant-chat  | Limiar 100 em `check_celery_queues` (`ASSISTANT_CHAT_QUEUE_ALERT_THRESHOLD`)          |
| Teste 150 VUs        | [tests/load/assistant-chat-scaling.k6.js](../tests/load/assistant-chat-scaling.k6.js) |
| Runbook              | [assistant-incident-runbook.md](./assistant-incident-runbook.md)                      |
| Go-live              | [assistant-go-live-checklist.md](./assistant-go-live-checklist.md)                    |

### Gauges Prometheus

| Métrica                                | Descrição                                 |
| -------------------------------------- | ----------------------------------------- |
| `assistant_chat_active`                | Streams activos (Redis)                   |
| `assistant_chat_queue_depth`           | Profundidade fila Celery `assistant-chat` |
| `assistant_llm_semaphore_available`    | Slots LLM livres                          |
| `assistant_llm_semaphore_in_use`       | Slots LLM ocupados                        |
| `assistant_rag_cache_hit_ratio`        | Taxa de acerto cache RAG (0–1)            |
| `assistant_latency_p95_first_token_ms` | P95 global first token                    |
| `assistant_chat_error_rate`            | Taxa de erro chat (última hora)           |

## Referências

- Entrypoints: `apps/api/bin/docker-entrypoint-api-chat.sh`, `docker-entrypoint-api-chat-local.sh`
- Settings PgBouncer: `operis/settings/common.py` (`USE_PGBOUNCER`)
- Backlog: módulo `[ OPEROZ ] - ESCALA DO CHAT — FASE 2` no OPEROZDP
