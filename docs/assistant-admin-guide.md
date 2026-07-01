# Guia admin — LLM e Assistente Operoz

Configuração de instância, limites, custos e operação para administradores de workspace e God mode.

## Onde configurar

| Camada                 | Local                                                                 |
| ---------------------- | --------------------------------------------------------------------- |
| **Instância (global)** | God mode → AI (`/god-mode`) — `LLM_*`, `ASSISTANT_*`                  |
| **Variáveis Docker**   | `apps/api/.env` — ver [assistant-env.md](./assistant-env.md)          |
| **Métricas workspace** | Configurações → Assistente Operoz (`/{workspace}/settings/assistant`) |
| **Uso de tokens**      | `GET /api/workspaces/{slug}/assistant/usage/` (admin)                 |

## LLM (obrigatório para chat)

| Variável       | Descrição                                        |
| -------------- | ------------------------------------------------ |
| `LLM_API_KEY`  | Chave OpenAI ou Anthropic                        |
| `LLM_PROVIDER` | `openai` (default) ou `anthropic`                |
| `LLM_MODEL`    | Ex.: `gpt-4o-mini`, `claude-3-5-sonnet-20241022` |

Sem `LLM_API_KEY`, o chat retorna erro 503 (`llm_not_configured`).

## Feature flags

| Variável                       | Default | Efeito                      |
| ------------------------------ | ------- | --------------------------- |
| `ASSISTANT_ENABLED`            | `1`     | Desliga o assistente na API |
| `VITE_ENABLE_OPEROZ_ASSISTANT` | `1`     | Esconde UI no frontend      |

## Rate limits (Redis)

| Variável                                        | Default |
| ----------------------------------------------- | ------- |
| `ASSISTANT_MAX_MESSAGES_PER_USER_PER_HOUR`      | 60      |
| `ASSISTANT_MAX_MESSAGES_PER_WORKSPACE_PER_HOUR` | 500     |

Resposta **429** com `retry_after` quando excedido.

## Custos e orçamento

| Variável                       | Default | Descrição                    |
| ------------------------------ | ------- | ---------------------------- |
| `ASSISTANT_DAILY_TOKEN_BUDGET` | 200000  | Tokens/dia por workspace     |
| `ASSISTANT_BUDGET_ALERT_RATIO` | 0.8     | Aviso no prompt quando ≥ 80% |

Contadores em `AssistantUsageDaily`; endpoint `GET .../assistant/usage/`.

## RAG e indexação

1. Postgres com **pgvector** (`pgvector/pgvector:pg15` no Compose)
2. Worker `assistant-worker` na fila `assistant`
3. Backfill: [assistant-reindex.md](./assistant-reindex.md)

```bash
docker compose -f docker-compose-local.yml exec api \
  python manage.py reindex_assistant --workspace operoz
```

## Workers e filas

| Serviço                 | Fila             | Função                     |
| ----------------------- | ---------------- | -------------------------- |
| `assistant-worker`      | `assistant`      | Embeddings RAG             |
| `assistant-chat-worker` | `assistant-chat` | Chat async (202 + SSE job) |
| `worker`                | `celery`         | Tarefas gerais             |
| `automation-worker`     | `automation`     | Regras                     |

Monitoramento:

```bash
python manage.py check_celery_queues --fail-on-alert
python manage.py check_assistant_alerts --fail-on-alert
```

Métricas Prometheus: `GET /api/assistant/ops/metrics/` (header `Authorization: Bearer $ASSISTANT_METRICS_TOKEN`).

Documentação escala: [assistant-scaling.md](./assistant-scaling.md) · [baseline e SLAs](./assistant-scaling-baseline.md) · [ADRs](./assistant-adrs.md) · Runbook: [assistant-incident-runbook.md](./assistant-incident-runbook.md) · Go-live: [assistant-go-live-checklist.md](./assistant-go-live-checklist.md)

## Qualidade (metas do programa)

Ver [assistant-quality-metrics.md](./assistant-quality-metrics.md) e ritual de alucinações em [qa-hallucination-review.md](./qa-hallucination-review.md).

## Segurança

- Audit log: `AssistantActionAudit`
- Ações destrutivas: fluxo propose → confirm
- HTML sanitizado nas respostas (`nh3`)

Detalhes: [operoz-assistant-security.md](./operoz-assistant-security.md)

## CI e testes

Workflow `.github/workflows/ci-assistant.yml` — pytest unit + contract.

## Troubleshooting

| Sintoma         | Verificar                                                          |
| --------------- | ------------------------------------------------------------------ |
| Chat 503        | `LLM_API_KEY`, conectividade provider                              |
| RAG vazio       | pgvector, `reindex_assistant`, `ASSISTANT_RAG_ENABLED`             |
| Indexação lenta | `assistant-worker` up, fila `assistant`                            |
| Budget alert    | `GET .../assistant/usage/`, ajustar `ASSISTANT_DAILY_TOKEN_BUDGET` |
