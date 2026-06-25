# 02 — Contrato de API · Time Tracking

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Endpoints

```text
# Worklogs por issue
GET    /api/workspaces/{slug}/projects/{pid}/issues/{iid}/worklogs/
POST   /api/workspaces/{slug}/projects/{pid}/issues/{iid}/worklogs/
PATCH  /api/workspaces/{slug}/projects/{pid}/issues/{iid}/worklogs/{id}/
DELETE /api/workspaces/{slug}/projects/{pid}/issues/{iid}/worklogs/{id}/

# Estimativas (patch da issue)
PATCH  /api/workspaces/{slug}/projects/{pid}/issues/{iid}/   # original/remaining_estimate_seconds

# Timer
POST   /api/workspaces/{slug}/timer/start/      { issue_id }
POST   /api/workspaces/{slug}/timer/stop/       { description?, is_billable? }
GET    /api/workspaces/{slug}/timer/current/

# Timesheet e relatórios
GET    /api/workspaces/{slug}/timesheet/?user=&from=&to=
GET    /api/workspaces/{slug}/reports/time/?project=&from=&to=&billable=

# Tipos de atividade
GET    /api/workspaces/{slug}/worklog-activity-types/
POST   /api/workspaces/{slug}/worklog-activity-types/
```

## Permissões (matriz — alinhada com feature 07)

| Ação | Permissão |
| --- | --- |
| Criar worklog | `worklog.create` (MEMBER) |
| Editar/apagar o **próprio** | `worklog.edit_own` / `worklog.delete_own` (MEMBER) |
| Editar/apagar **qualquer** | `worklog.edit_all` / `worklog.delete_all` (ADMIN) |
| Ver timesheet de outro user | `worklog.view_all` (ADMIN/lead) |
| Gerir activity types | `ROLE.ADMIN` |

> `GUEST` não regista horas. Por defeito um MEMBER só mexe nos seus worklogs.

## Serializers

- `WorklogSerializer(DynamicBaseSerializer)` — `?expand=author,activity_type`.
- `TimesheetSerializer` — agrega por dia/issue para o grid semanal.
- Validação: `time_spent_seconds > 0` e `<=` limite diário razoável (ex.: 24h);
  `started_at` não no futuro.

## Timer — fluxo

```text
POST /timer/start/ { issue_id }
  → cria TimerSession (falha 409 se já há timer a correr — constraint)
POST /timer/stop/ { description?, is_billable? }
  → calcula duração = now - started_at
  → cria Worklog e liga à sessão; fecha sessão
GET /timer/current/
  → sessão ativa (ou null) para reidratar o cronómetro na UI
```

## Exemplos

```jsonc
// POST worklogs/
{ "time_spent_seconds": 9000, "started_at": "2026-06-24T09:00:00Z",
  "description": "Refactor do parser", "is_billable": true,
  "activity_type": "<uuid>" }

// GET reports/time/?project=…&billable=true
{ "total_seconds": 432000, "billable_seconds": 390000,
  "by_member": [ { "user_id": "…", "seconds": 144000 } ],
  "by_activity": { "Development": 320000, "Review": 70000 } }
```

## Integração FinOps (Cliente 360)

- `reports/time/` é consumível pelo perfil FinOps do projeto
  (`Client360ProjectFinopsProfile`) para cruzar horas×custo. Não duplicar
  cálculo de custo aqui — expor horas, o FinOps consolida.
