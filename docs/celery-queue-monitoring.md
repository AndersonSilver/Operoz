# Monitoramento de filas Celery (Operoz)

Comando de saúde para profundidade das filas RabbitMQ usadas por automação e assistente.

## Comando

```bash
docker compose -f docker-compose-local.yml exec api \
  python manage.py check_celery_queues

# Alerta se alguma fila >= 500 mensagens (exit code 1)
docker compose -f docker-compose-local.yml exec api \
  python manage.py check_celery_queues --alert-threshold 500 --fail-on-alert
```

## Filas monitoradas

| Fila               | Worker                    | Uso                         |
| ------------------ | ------------------------- | --------------------------- |
| `automation`       | `automation-worker`       | Execução de regras e grafos |
| `automation_email` | `automation-email-worker` | SMTP assíncrono             |
| `assistant`        | `assistant-worker`        | Indexação RAG               |
| `assistant-chat`   | `assistant-chat-worker`   | Jobs de chat async (Fase 3) |
| `celery`           | `worker`                  | Tarefas gerais              |

Nomes customizados via `AUTOMATION_CELERY_QUEUE`, `AUTOMATION_EMAIL_CELERY_QUEUE`, `ASSISTANT_CELERY_QUEUE`, `ASSISTANT_CHAT_CELERY_QUEUE`.

### Limiares por fila

| Fila                 | Alerta default | Variável                                   |
| -------------------- | -------------- | ------------------------------------------ |
| `automation`         | 500            | `CELERY_QUEUE_ALERT_THRESHOLD`             |
| `automation_email`   | 500            | idem                                       |
| `assistant`          | 500            | idem                                       |
| **`assistant-chat`** | **100**        | **`ASSISTANT_CHAT_QUEUE_ALERT_THRESHOLD`** |
| `celery`             | 500            | idem                                       |

O comando aplica limiares **por fila** quando `--alert-threshold` não sobrescreve o global:

```bash
python manage.py check_celery_queues --fail-on-alert
# assistant-chat alerta em >= 100; outras filas em >= 500 (default)
```

## Alertas (Grafana / cron)

1. **Cron no host ou sidecar:** executar `check_celery_queues --fail-on-alert` a cada 5 minutos; notificar se exit code ≠ 0.
2. **RabbitMQ Management UI:** fila `automation` com crescimento sustentado indica workers insuficientes — escalar com `docker compose up -d --scale automation-worker=3`.
3. **Limiares sugeridos:**
   - `automation`: alerta ≥ 500, crítico ≥ 2000
   - `automation_email`: alerta ≥ 200 (SMTP lento)
   - `assistant`: alerta ≥ 1000 (backfill RAG)
   - `assistant-chat`: alerta ≥ 100 (jobs de chat async)

## Variáveis relacionadas

| Variável                       | Default     | Descrição                                           |
| ------------------------------ | ----------- | --------------------------------------------------- |
| `CELERY_QUEUE_ALERT_THRESHOLD` | —           | Limiar global (sobrescrito por `--alert-threshold`) |
| `RABBITMQ_HOST`                | `localhost` | Broker AMQP                                         |
| `RABBITMQ_PORT`                | `5672`      | Porta AMQP                                          |
