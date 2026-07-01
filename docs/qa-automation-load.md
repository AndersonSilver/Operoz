# QA — Teste de carga 300 automações

Meta: enfileirar **300 regras no mesmo minuto** com fila drenada em **&lt; 2 minutos** (workers dimensionados).

## Teste automatizado (dispatch)

```bash
docker compose -f docker-compose-local.yml exec api \
  python -m pytest operoz/tests/unit/automation/test_automation_scale.py -k benchmark -q
```

Valida P95 do path **outbox → schedule** &lt; 50 ms por regra (mock Celery, sem RabbitMQ).

## Teste integrado (RabbitMQ)

1. Subir workers:
   ```bash
   docker compose -f docker-compose-local.yml up -d automation-worker assistant-worker
   docker compose -f docker-compose-local.yml up -d --scale automation-worker=3
   ```
2. Disparar benchmark ou carga real (300 eventos `issue.created` com regras publicadas).
3. Monitorar fila:
   ```bash
   python manage.py check_celery_queues --alert-threshold 300 --fail-on-alert
   ```
4. Critério: profundidade da fila `automation` volta a &lt; 50 em **&lt; 120 s**.

## Meta P95 execução (cron + e-mail async)

- Medida em `GET /api/workspaces/{slug}/assistant/quality/` → bloco `automation`.
- **Target:** `p95_duration_ms` &lt; **2000** (grafo até enfileirar e-mail; SMTP na fila `automation_email`).
- Analytics por board: `GET .../boards/{board}/automation/metrics/`.

## Referência de capacidade

| Workers `automation` | Concorrência | Throughput indicativo       |
| -------------------- | ------------ | --------------------------- |
| 1                    | 4            | ~240 runs/min (runs curtos) |
| 3                    | 4            | ~720 runs/min               |

Ajustar `AUTOMATION_WORKER_CONCURRENCY` e `--scale` conforme SLA do workspace.
