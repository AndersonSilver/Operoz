# Teste de carga — Assistente Operoz (150 VUs)

## Validação automatizada (recomendado)

### Go-live staging (gate completo)

```bash
cd Operis
chmod +x bin/validate-assistant-go-live.sh
./bin/validate-assistant-go-live.sh
```

Inclui: env, HTTP api+api-chat, filas/alertas/stale, `validate_assistant_scaling --deep`, smoke SSE.

Com LLM real + k6 smoke (5 VUs):

```bash
RUN_K6=1 ./bin/validate-assistant-go-live.sh --with-llm
```

### Regressão rápida (sem LLM)

```bash
docker compose -f docker-compose-local.yml exec api \
  python manage.py validate_assistant_scaling --deep
```

## k6 (opcional, staging com LLM real)

## Pré-requisitos

- [k6](https://k6.io/docs/get-started/installation/) instalado
- Stack local ou staging com `api`, `api-chat`, `assistant-chat-worker`, Redis, RabbitMQ
- `LLM_API_KEY` configurada (carga real contra provider)
- Utilizador autenticado e sessão de chat criada

## Preparar sessão

1. Inicie sessão no browser e copie o cookie `sessionid` (e CSRF se aplicável).
2. Crie ou reutilize uma sessão assistant:

```bash
curl -b "sessionid=..." \
  http://localhost:8000/api/workspaces/operoz/assistant/sessions/
```

## Executar (150 VUs, ramp 5 min, sustain 10 min)

```bash
cd Operis

export BASE_URL="http://localhost:8000"
export CHAT_API_URL="http://localhost:8001"
export WORKSPACE_SLUG="operoz"
export SESSION_ID="<uuid-da-sessão>"
export SESSION_COOKIE="sessionid=<valor>"
export CSRF_TOKEN="<token>"
export ASYNC_MODE="1"

k6 run tests/load/assistant-chat-scaling.k6.js
```

## SLAs de referência

| Métrica               | Target            |
| --------------------- | ----------------- |
| p95 first token       | &lt; 3000 ms      |
| p95 resposta completa | &lt; 45 s         |
| Taxa de erro HTTP     | &lt; 5%           |
| Fila `assistant-chat` | &lt; 100 (alerta) |

## Relatório

Exporte resultados para comparar com baseline:

```bash
k6 run --out json=tests/load/results/assistant-150vu.json tests/load/assistant-chat-scaling.k6.js
```

Anexe o JSON ou gráficos Grafana ao card de governança no backlog.

## Monitorização durante o teste

```bash
# Filas Celery (assistant-chat limiar 100)
docker compose -f docker-compose-local.yml exec api \
  python manage.py check_celery_queues --fail-on-alert

# Alertas P95 / erro / fila
docker compose -f docker-compose-local.yml exec api \
  python manage.py check_assistant_alerts --fail-on-alert

# Métricas Prometheus (requer ASSISTANT_METRICS_TOKEN)
curl -H "Authorization: Bearer $ASSISTANT_METRICS_TOKEN" \
  http://localhost:8000/api/assistant/ops/metrics/
```
