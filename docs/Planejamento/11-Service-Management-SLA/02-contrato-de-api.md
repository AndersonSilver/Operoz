# 02 — Contrato de API · Service Management & SLA

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Endpoints

```text
# SLA policies / goals / business hours
GET/POST/PATCH /api/workspaces/{slug}/boards/{bslug}/sla-policies/{id}/
POST   /api/.../sla-policies/{id}/goals/
GET/POST /api/workspaces/{slug}/business-calendars/

# SLA estado por issue
GET    /api/.../issues/{iid}/sla/          # timers, tempo restante, status

# Queues
GET    /api/workspaces/{slug}/boards/{bslug}/queues/
GET    /api/.../queues/{qid}/issues/       # tickets da fila (filtro + ordenação)

# Request types
GET/POST /api/workspaces/{slug}/boards/{bslug}/request-types/

# Approvals
POST   /api/.../issues/{iid}/approvals/             # criar passo
POST   /api/.../issues/{iid}/approvals/{aid}/decide/  { decision }

# Portal de cliente (público — app Space, token)
GET    /api/public/portal/{token}/request-types/
POST   /api/public/portal/{token}/requests/         # cria ticket via portal
GET    /api/public/portal/{token}/requests/{rid}/   # estado do pedido
```

## Permissões

| Ação | Regra |
| --- | --- |
| Configurar SLA/calendars/request types | board-admin (`board.configure`) |
| Ver fila e SLA de tickets | agente (MEMBER do board) |
| Decidir aprovação | estar em `approvers` |
| Portal (criar/ver pedido) | token guest, escopo mínimo (só os seus pedidos) |

## SLA estado (resposta)

```jsonc
// GET issues/{iid}/sla/
{ "timers": [
   { "metric": "time_to_first_response", "status": "running",
     "elapsed_business_seconds": 5400, "target_seconds": 14400,
     "remaining_seconds": 9000, "breach_at": "2026-06-24T17:00:00Z" },
   { "metric": "time_to_resolution", "status": "paused" } ] }
```

## Cálculo do timer (business hours)

```python
def elapsed_business_seconds(timer, now):
    # soma só intervalos dentro do work_hours do calendar,
    # exclui holidays, subtrai paused_total_seconds
    return business_delta(timer.started_at, now, timer.goal.calendar) \
           - timer.paused_total_seconds
```

- Estados configurados como "pausa" (ex.: Waiting for customer) param o timer
  via signal de transição (liga-se à feature 01).

## Escalation

- Um Celery beat (ou avaliação on-event) verifica timers perto do alvo e emite
  evento `sla.at_risk` → consumido por regra de automação (feature 03) que
  escala (reatribui, notifica, sobe prioridade). Sem motor próprio.

## Portal

- Endpoints `public/portal/{token}/` seguem o padrão guest (token TTL, escopo
  mínimo). Cliente vê só os seus pedidos.

## Notas

- Approvals podem bloquear transição no workflow (feature 01) até decisão.
- Throttle no portal público (anti-abuso).
