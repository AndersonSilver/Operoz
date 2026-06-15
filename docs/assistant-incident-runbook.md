# Runbook — incidentes de escala do Assistente Operoz

Procedimentos quando alertas da Fase 7 disparam em produção ou staging.

## Alertas configurados

| Alerta               | Comando / métrica                                                 | Limiar default       |
| -------------------- | ----------------------------------------------------------------- | -------------------- |
| P95 first token alto | `check_assistant_alerts` / `assistant_latency_p95_first_token_ms` | &gt; 3000 ms (5 min) |
| Taxa de erro chat    | `assistant_chat_error_rate`                                       | &gt; 5% / hora       |
| Fila assistant-chat  | `check_celery_queues` / `assistant_chat_queue_depth`              | ≥ 100 mensagens      |

Variáveis: `ASSISTANT_ALERT_P95_FIRST_TOKEN_MS`, `ASSISTANT_ALERT_ERROR_RATE`, `ASSISTANT_CHAT_QUEUE_ALERT_THRESHOLD`.

## Cron sugerido (5 min)

```bash
python manage.py check_celery_queues --fail-on-alert
python manage.py check_assistant_alerts --fail-on-alert
```

Notificar on-call se exit code ≠ 0.

## 1. Fila assistant-chat elevada

**Sintomas:** `assistant-chat: N >= 100`, utilizadores reportam espera longa na UI.

**Acções:**

1. Verificar workers: `docker compose ps assistant-chat-worker`
2. Escalar workers: `docker compose up -d --scale assistant-chat-worker=3`
3. Confirmar Redis e RabbitMQ saudáveis
4. Revisar `ASSISTANT_CHAT_WORKER_CONCURRENCY` (default 8)
5. Se fila persistir &gt; 15 min, activar modo degradado (`LLM_MODEL_FALLBACK`) temporariamente

## 2. P95 first token &gt; 3 s

**Sintomas:** dashboard qualidade ou alerta `latency_p95_first_token`.

**Acções:**

1. Verificar semáforo LLM: métrica `assistant_llm_semaphore_available`
2. Se slots esgotados, aumentar `ASSISTANT_MAX_CONCURRENT_LLM` ou reduzir carga
3. Confirmar api-chat com workers Gunicorn adequados (`GUNICORN_CHAT_WORKERS`)
4. Verificar latência do provider LLM (429/503 nos logs)
5. Confirmar cache RAG activo (`assistant_rag_cache_hit_ratio`)

## 3. Taxa de erro &gt; 5%

**Sintomas:** alerta `chat_error_rate`, erros 429/503 no frontend.

**Acções:**

1. Separar erros por código nos logs (`user_rate_limit`, `llm_capacity`, `llm_not_configured`)
2. Rate limit utilizador/workspace: comunicar via UI (Fase 6); ajustar limites se falso positivo
3. `llm_capacity`: escalar semáforo ou workers
4. Provider LLM: verificar circuit breaker de keys (`LLM_API_KEYS`)

## 4. SSE / stream interrompido ou job pendurado

Ver [assistant-scaling.md](./assistant-scaling.md) — proxy `flush_interval -1`, sticky sessions api-chat.

**Stream sem eventos (`stream_idle_timeout`):** o cliente recebe erro com `retry_after: 30` após `ASSISTANT_CHAT_STREAM_IDLE_SECONDS` (default 90s) sem actualizações. Pedir ao utilizador para reenviar a mensagem.

**Jobs stale (`stale_job`):** jobs `queued`/`running` há mais de `ASSISTANT_CHAT_JOB_STALE_SECONDS` (default 900s):

```bash
# Contar (dry-run)
python manage.py check_stale_assistant_jobs --dry-run

# Reclaim + libertar slots LLM/active-chat
python manage.py check_stale_assistant_jobs
```

Alerta Prometheus: `assistant_chat_stale_jobs >= ASSISTANT_ALERT_STALE_JOBS` (default 1).

## 5. Rollback

1. Desactivar async no frontend: `VITE_ASSISTANT_ASYNC_CHAT=0` (rebuild)
2. Reduzir réplicas api-chat
3. Pausar workers assistant-chat se necessário (chat volta a modo síncrono limitado)

## Métricas Prometheus

Endpoint: `GET /api/assistant/ops/metrics/`  
Auth: `Authorization: Bearer ${ASSISTANT_METRICS_TOKEN}`

Scrape interval recomendado: 15–30 s. Dashboard Grafana: painéis para gauges listados em [assistant-scaling.md](./assistant-scaling.md).

## Referências

- [assistant-go-live-checklist.md](./assistant-go-live-checklist.md)
- [celery-queue-monitoring.md](./celery-queue-monitoring.md)
- [assistant-quality-metrics.md](./assistant-quality-metrics.md)
