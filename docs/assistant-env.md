# Assistente Operoz — variáveis de ambiente

Referência consolidada para deploy, Docker Compose e God mode (instance configurations).

## LLM e embeddings

| Variável                    | Default                  | Descrição                                                         |
| --------------------------- | ------------------------ | ----------------------------------------------------------------- |
| `LLM_API_KEY`               | —                        | Chave da API do provider (obrigatória para chat e embeddings)     |
| `LLM_API_KEYS`              | —                        | Lista CSV de chaves para round-robin e circuit breaker (opcional) |
| `LLM_PROVIDER`              | `openai`                 | Provider LLM (`openai`, `anthropic`, …)                           |
| `LLM_MODEL`                 | `gpt-4o-mini`            | Modelo de chat                                                    |
| `LLM_MODEL_FALLBACK`        | —                        | Modelo alternativo em modo degradado (ex. `gpt-4o-mini`)          |
| `ASSISTANT_EMBEDDING_MODEL` | `text-embedding-3-small` | Modelo de embedding para RAG                                      |

## Feature flags e limites de uso

| Variável                                        | Default  | Descrição                                        |
| ----------------------------------------------- | -------- | ------------------------------------------------ |
| `ASSISTANT_ENABLED`                             | `1`      | Habilita o assistente na instância               |
| `VITE_ENABLE_OPEROZ_ASSISTANT`                  | `1`      | Feature flag no frontend                         |
| `ASSISTANT_MAX_MESSAGES_PER_USER_PER_HOUR`      | `60`     | Rate limit por utilizador                        |
| `ASSISTANT_MAX_MESSAGES_PER_WORKSPACE_PER_HOUR` | `500`    | Rate limit por workspace                         |
| `ASSISTANT_MAX_TOOL_ROUNDS`                     | `5`      | Máximo de rodadas tool-calling por mensagem      |
| `ASSISTANT_DAILY_TOKEN_BUDGET`                  | `200000` | Orçamento diário de tokens (workspace)           |
| `ASSISTANT_BUDGET_ALERT_RATIO`                  | `0.8`    | Alerta admin ao atingir esta fração do orçamento |

## RAG e histórico

| Variável                            | Default  | Descrição                                   |
| ----------------------------------- | -------- | ------------------------------------------- |
| `ASSISTANT_RAG_ENABLED`             | `1`      | Retrieval híbrido FTS + vetor               |
| `ASSISTANT_RAG_TOP_K`               | `5`      | Resultados finais após fusão RRF            |
| `ASSISTANT_RAG_CANDIDATE_LIMIT`     | `30`     | Candidatos por canal (FTS/vetor)            |
| `ASSISTANT_RAG_RRF_K`               | `60`     | Constante k do Reciprocal Rank Fusion       |
| `ASSISTANT_HISTORY_SUMMARIZE_AFTER` | `14`     | Mensagens antes de resumir thread           |
| `ASSISTANT_HISTORY_KEEP_RECENT`     | `8`      | Mensagens recentes preservadas após resumo  |
| `ASSISTANT_EMBEDDING_CACHE_TTL`     | `604800` | TTL Redis do cache de embeddings (segundos) |

## Workers Celery

| Variável                       | Default     | Descrição                            |
| ------------------------------ | ----------- | ------------------------------------ |
| `ASSISTANT_CELERY_QUEUE`       | `assistant` | Fila de indexação RAG                |
| `ASSISTANT_WORKER_CONCURRENCY` | `2`         | Processos `-c` do `assistant-worker` |

Serviço Docker: `assistant-worker` (`docker-entrypoint-assistant-worker.sh`). Ver também [automation-workers.md](./automation-workers.md).

## Proxy / SSE (streaming do chat)

Para respostas longas via Server-Sent Events, configure o reverse proxy sem bufferização:

| Componente | Configuração                                                                          |
| ---------- | ------------------------------------------------------------------------------------- |
| **Caddy**  | `reverse_proxy /api/* api:8000 { flush_interval -1 }` (ver `apps/proxy/Caddyfile.ce`) |
| **nginx**  | `proxy_buffering off;` e `proxy_read_timeout 120s;` na location `/api/`               |
| **Django** | Header `X-Accel-Buffering: no` já enviado pelo endpoint SSE                           |

Sem `flush_interval` / `proxy_buffering off`, o cliente pode só ver tokens após a resposta completa.

## Serviço api-chat e PgBouncer (Fase 2 — escala)

Documentação completa: [assistant-scaling.md](./assistant-scaling.md)

| Variável                      | Default | Descrição                                                       |
| ----------------------------- | ------- | --------------------------------------------------------------- |
| `GUNICORN_CHAT_WORKERS`       | `8`     | Workers do serviço `api-chat`                                   |
| `GUNICORN_CHAT_TIMEOUT`       | `120`   | Timeout Gunicorn para SSE                                       |
| `USE_PGBOUNCER`               | `0`     | Ajustes Django para pool transaction                            |
| `VITE_ASSISTANT_CHAT_API_URL` | —       | Frontend: base URL do api-chat (local: `http://localhost:8001`) |

## Frontend (chat assíncrono e api-chat)

| Variável                       | Default | Descrição                                                                        |
| ------------------------------ | ------- | -------------------------------------------------------------------------------- |
| `VITE_ASSISTANT_CHAT_API_URL`  | —       | Base URL do serviço `api-chat` (SSE). Local: `http://localhost:8001`             |
| `VITE_ASSISTANT_ASYNC_CHAT`    | —       | `1` = fluxo POST 202 + stream do job Celery; omitir ou `0` = SSE síncrono legado |
| `VITE_ENABLE_OPEROZ_ASSISTANT` | `1`     | Feature flag global do painel assistente                                         |

Build do frontend: definir estas variáveis **antes** do `pnpm build` (são embutidas em compile-time).

## Observabilidade (Fase 7)

| Variável                               | Default | Descrição                                           |
| -------------------------------------- | ------- | --------------------------------------------------- |
| `ASSISTANT_METRICS_TOKEN`              | —       | Token Bearer para `GET /api/assistant/ops/metrics/` |
| `ASSISTANT_CHAT_QUEUE_ALERT_THRESHOLD` | `100`   | Limiar fila `assistant-chat`                        |
| `ASSISTANT_ALERT_P95_FIRST_TOKEN_MS`   | `3000`  | Alerta P95 first token                              |
| `ASSISTANT_ALERT_ERROR_RATE`           | `0.05`  | Alerta taxa de erro chat (5%)                       |

```bash
python manage.py check_assistant_alerts --fail-on-alert
curl -H "Authorization: Bearer $ASSISTANT_METRICS_TOKEN" \
  http://localhost:8000/api/assistant/ops/metrics/
```

## Orquestração (futuro)

| Variável                         | Default | Descrição                                     |
| -------------------------------- | ------- | --------------------------------------------- |
| `ASSISTANT_ORCHESTRATOR_ENABLED` | `0`     | Scaffold multi-agente (desligado por defeito) |

## Postgres (pgvector)

O RAG exige a extensão `vector` no Postgres:

- **Local:** `docker-compose-local.yml` usa `pgvector/pgvector:pg15`
- **Produção:** `docker-compose.yml` usa a mesma imagem
- Migration `0151_search_embedding_pgvector` executa `CREATE EXTENSION vector`

Instâncias existentes em `postgres:15-alpine` sem pgvector: migrar volume para imagem pgvector ou instalar a extensão manualmente antes do `migrate`.

## Monitoramento de filas

```bash
python manage.py check_celery_queues
python manage.py check_celery_queues --alert-threshold 500 --fail-on-alert
```

Ver [celery-queue-monitoring.md](./celery-queue-monitoring.md).

## Reindexação

Ver [assistant-reindex.md](./assistant-reindex.md).
