# ADR-004 — Escala do Assistente (150+ utilizadores)

| Campo           | Valor                                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Status**      | Aprovado                                                                                                          |
| **Data**        | 2026-06-13                                                                                                        |
| **Projeto**     | `[ OPEROZ ] - DESENVOLVIMENTO DE PRODUTO`                                                                         |
| **Epic**        | Escala do Chat                                                                                                    |
| **Relacionado** | [assistant-scaling.md](./assistant-scaling.md) · [assistant-scaling-baseline.md](./assistant-scaling-baseline.md) |

## Contexto

Com 150+ utilizadores concorrentes, cada mensagem de chat bloqueava workers Gunicorn durante 5–90 s (LLM + RAG + tools). A API CRUD degradava no mesmo processo. Capacidade real com 1–2 workers era de 2–10 conversas, não 150.

## Decisões

### D1 — Fila assíncrona (Celery + Redis Streams)

**Decisão:** `POST …/chat/` retorna **202** com `job_id`; worker executa `iter_chat_events`; cliente consome SSE via Redis Stream.

**Alternativa rejeitada:** chat 100 % síncrono com scale-up vertical apenas — previsível só até ~20 VUs, sem isolamento de falhas.

**Rollback:** `?sync=1`, header `X-Assistant-Async: 0`, ou `VITE_ASSISTANT_ASYNC_CHAT=0`.

### D2 — Serviço `api-chat` dedicado

**Decisão:** Container Gunicorn separado para SSE long-running; CRUD permanece em `api`.

**Alternativa rejeitada:** monólito único — sob carga de chat, p95 de issues/boards degradava.

### D3 — Streaming SSE token-a-token

**Decisão:** `yield` imediato de tokens no generator; proxy com `flush_interval -1` (Caddy) ou `proxy_buffering off` (nginx).

**Alternativa rejeitada:** WebSocket-only — maior complexidade de infra sem ganho funcional para o cliente actual.

### D4 — Semáforo global LLM + fair queue

**Decisão:** Redis semáforo (`ASSISTANT_MAX_CONCURRENT_LLM=40`); fair queue por workspace antes de adquirir slot LLM.

**Alternativa rejeitada:** confiar só no rate limit por hora — não limita paralelismo LLM real.

### D5 — PgBouncer (transaction pooling)

**Decisão:** Pool transaction entre workers e Postgres; `USE_PGBOUNCER=1` ajusta Django.

**Alternativa rejeitada:** read replica na Fase 2 — adiada; pgvector + ACL SQL simplificam operação num único primary.

### D6 — Sticky sessions no proxy

**Decisão:** Cookie `operoz_sse_route` para afinidade ao mesmo `api-chat` durante SSE.

**Motivo:** reconexão SSE e streams longos sem saltar entre réplicas stateless.

## Consequências

- Novos serviços: `api-chat`, `assistant-chat-worker`, `operoz-pgbouncer`
- Frontend: `VITE_ASSISTANT_CHAT_API_URL`, `VITE_ASSISTANT_ASYNC_CHAT=1`
- Observabilidade: métricas Prometheus, `check_assistant_alerts`, runbook de incidente
- Go-live: [assistant-go-live-checklist.md](./assistant-go-live-checklist.md)

## Referências de código

| Componente      | Caminho                                            |
| --------------- | -------------------------------------------------- |
| Pipeline chat   | `operoz/assistant/service.py`                      |
| Jobs async      | `operoz/assistant/chat_jobs.py`                    |
| Worker          | `operoz/bgtasks/assistant_chat_task.py`            |
| Semáforo / fila | `operoz/assistant/llm/concurrency.py`              |
| Frontend        | `apps/web/core/store/assistant/assistant.store.ts` |
| Compose         | `docker-compose.yml`, `docker-compose-local.yml`   |

## Aprovação

Decisão implementada nas Fases 1–7 do epic Escala do Chat. Validação automatizada: `python manage.py validate_assistant_scaling`.
