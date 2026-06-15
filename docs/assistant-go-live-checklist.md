# Checklist go-live — Escala 150+ utilizadores (Assistente Operoz)

Gate final antes de activar escala completa numa instância cliente.

## Infraestrutura

- [ ] **PgBouncer** activo (`USE_PGBOUNCER=1`) com pool transaction
- [ ] **api-chat** dedicado (Gunicorn + uvicorn workers, timeout SSE ≥ 120 s)
- [ ] **assistant-chat-worker** em execução (fila `assistant-chat`)
- [ ] **assistant-worker** para indexação RAG
- [ ] **Redis** com persistência / backup configurado
- [ ] **RabbitMQ** monitorizado (`check_celery_queues`)
- [ ] Proxy SSE: `flush_interval -1` (Caddy) ou `proxy_buffering off` (nginx)

## Protecção e limites

- [ ] `ASSISTANT_MAX_CONCURRENT_LLM` definido (default 40, ajustado à carga)
- [ ] `ASSISTANT_MAX_ACTIVE_CHATS_PER_USER` (default 2)
- [ ] Rate limits horários (`ASSISTANT_MAX_MESSAGES_*`) alinhados ao contrato
- [ ] `LLM_API_KEY` ou `LLM_API_KEYS` com quotas provider adequadas
- [ ] `LLM_MODEL_FALLBACK` para modo degradado (opcional mas recomendado)

## Frontend

- [ ] `VITE_ASSISTANT_CHAT_API_URL` aponta para api-chat público
- [ ] `VITE_ASSISTANT_ASYNC_CHAT=1` para fluxo 202 + fila
- [ ] Build web feito **após** definir variáveis VITE

## Observabilidade

- [ ] `ASSISTANT_METRICS_TOKEN` definido; scrape `/api/assistant/ops/metrics/`
- [ ] Cron `check_celery_queues --fail-on-alert` (limiar assistant-chat: 100)
- [ ] Cron `check_assistant_alerts --fail-on-alert`
- [ ] Dashboard Grafana (ou equivalente) com gauges do assistente
- [ ] Runbook linkado: [assistant-incident-runbook.md](./assistant-incident-runbook.md)

## Validação

- [ ] Migrations aplicadas (incl. `assistant_chat_jobs` queue fields)
- [ ] **Gate automatizado (recomendado):**

```bash
cd Operis
chmod +x bin/validate-assistant-go-live.sh
./bin/validate-assistant-go-live.sh
```

Com LLM real e k6 smoke (5 VUs, ~2 min):

```bash
./bin/validate-assistant-go-live.sh --with-llm
RUN_K6=1 ./bin/validate-assistant-go-live.sh --with-llm
```

- [ ] Teste de carga 150 VUs verde — ver [tests/load/README.md](../tests/load/README.md)
- [ ] SLAs: p95 first token &lt; 3 s, erro &lt; 5%, fila &lt; 100 sob carga nominal

## Rollback

- [ ] Plano documentado: desactivar async FE, reduzir workers, fallback sync
- [ ] Contactos on-call e escalação definidos

## Assinaturas

| Papel     | Nome | Data |
| --------- | ---- | ---- |
| Tech lead |      |      |
| DevOps    |      |      |
