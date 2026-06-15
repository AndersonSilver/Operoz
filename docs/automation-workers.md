# Workers de automação Operoz

## Filas Celery

| Fila               | Worker                    | Responsabilidade                            |
| ------------------ | ------------------------- | ------------------------------------------- |
| `automation`       | `automation-worker`       | Execução de grafos, outbox, circuit breaker |
| `automation_email` | `automation-email-worker` | SMTP assíncrono de `action.send_email`      |
| `assistant`        | `assistant-worker`        | Indexação RAG do assistente                 |

Variáveis de ambiente:

| Variável                                      | Default            | Descrição                             |
| --------------------------------------------- | ------------------ | ------------------------------------- |
| `AUTOMATION_CELERY_QUEUE`                     | `automation`       | Nome da fila de automação             |
| `AUTOMATION_EMAIL_CELERY_QUEUE`               | `automation_email` | Fila dedicada a e-mails               |
| `AUTOMATION_WORKER_CONCURRENCY`               | `4`                | Processos `-c` do worker de automação |
| `AUTOMATION_EMAIL_WORKER_CONCURRENCY`         | `2`                | Processos `-c` do worker de e-mail    |
| `ASSISTANT_CELERY_QUEUE`                      | `assistant`        | Fila de indexação RAG                 |
| `ASSISTANT_WORKER_CONCURRENCY`                | `2`                | Processos `-c` do `assistant-worker`  |
| `AUTOMATION_MAX_RUNS_PER_BOARD_PER_HOUR`      | `500`              | Rate limit por board                  |
| `AUTOMATION_MAX_RUNS_PER_WORKSPACE_PER_HOUR`  | `5000`             | Rate limit global por workspace       |
| `AUTOMATION_MAX_RUNS_PER_WORKSPACE_OVERRIDES` | `{}`               | JSON `{"<workspace_id>": 10000}`      |

## Subir o stack local (todos os workers)

```bash
docker compose -f docker-compose-local.yml up -d
```

Inclui `assistant-worker` (fila `assistant`). Se o stack já estava a correr antes de este serviço existir no compose, executa `up -d` outra vez — serviços novos não arrancam sozinhos.

## Escalar workers (Docker Compose)

```bash
# Mais capacidade de execução de regras
docker compose -f docker-compose-local.yml up -d --scale automation-worker=3

# Mais throughput SMTP (independente do worker de automação)
docker compose -f docker-compose-local.yml up -d --scale automation-email-worker=2
```

Em produção (`docker-compose.yml`), use o mesmo padrão `docker compose scale automation-worker=N`.

> **Nota:** `action.send_email` enfileira na fila `automation_email` e retorna imediatamente — o worker de automação não bloqueia em SMTP.

## Benchmark 300 regras / minuto

Teste automatizado: `pytest operis/tests/unit/automation/test_automation_scale.py -k benchmark`.

Resultados de referência (CI local, mock Celery, sem RabbitMQ):

- **Dispatch outbox:** P95 &lt; 50 ms por evento com 300 regras enfileiradas no mesmo minuto
- **Fila email:** throughput limitado por `AUTOMATION_EMAIL_WORKER_CONCURRENCY` e latência SMTP

Para benchmark real com RabbitMQ, suba `automation-worker` com `--scale` e monitore fila `automation` via management UI do RabbitMQ.

## Monitoramento de filas

```bash
python manage.py check_celery_queues --alert-threshold 500 --fail-on-alert
```

Detalhes: [celery-queue-monitoring.md](./celery-queue-monitoring.md).
