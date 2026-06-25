# 01 — Modelo de Dados · Service Management & SLA

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## 1. Modelos existentes (reuso e extensão)

```python
# JÁ EXISTEM
# db/models/board_support_queue.py       → fila de tickets
# db/models/board_support_sla_policy.py  → política de SLA
```

Estender a SLA policy com metas por prioridade e ligação a business hours.

## 2. Business hours

```python
class BusinessCalendar(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  related_name="business_calendars")
    name = models.CharField(max_length=120)
    timezone = models.CharField(max_length=64, default="America/Sao_Paulo")
    # horário por dia da semana
    work_hours = models.JSONField(default=dict)   # {"mon": ["09:00","18:00"], ...}
    holidays = models.JSONField(default=list)      # ["2026-12-25", ...]

    class Meta:
        db_table = "business_calendars"
```

## 3. SLA goals e timers

```python
class SlaGoal(BaseModel):
    policy = models.ForeignKey("db.BoardSupportSlaPolicy", on_delete=models.CASCADE,
                               related_name="goals")
    metric = models.CharField(max_length=30)       # time_to_first_response/time_to_resolution
    priority = models.CharField(max_length=20)     # urgent/high/medium/low
    target_seconds = models.PositiveIntegerField()
    calendar = models.ForeignKey(BusinessCalendar, on_delete=models.SET_NULL,
                                 null=True, related_name="+")

    class Meta:
        db_table = "sla_goals"


class SlaTimer(BaseModel):
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE,
                              related_name="sla_timers")
    goal = models.ForeignKey(SlaGoal, on_delete=models.CASCADE, related_name="+")
    started_at = models.DateTimeField()
    paused_total_seconds = models.PositiveIntegerField(default=0)
    breached_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default="running")  # running/paused/met/breached

    class Meta:
        db_table = "sla_timers"
        indexes = [models.Index(fields=["issue", "status"])]
```

## 4. Request types e approvals

```python
class RequestType(BaseModel):
    board = models.ForeignKey("db.Board", on_delete=models.CASCADE,
                              related_name="request_types")
    name = models.CharField(max_length=120)        # "Reportar bug"
    icon = models.CharField(max_length=40, blank=True)
    intake_form = models.ForeignKey("db.BoardIntakeForm", on_delete=models.SET_NULL,
                                    null=True, related_name="+")   # reusa intake
    class Meta:
        db_table = "request_types"


class ApprovalStep(BaseModel):
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE,
                              related_name="approvals")
    approvers = models.JSONField(default=list)     # [user_id...] ou grupo
    decision = models.CharField(max_length=20, default="pending")  # pending/approved/rejected
    decided_by = models.ForeignKey(settings.AUTH_USER_MODEL,
                                   on_delete=models.SET_NULL, null=True, related_name="+")
    decided_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table = "approval_steps"
```

## Design

- **Timer com business hours:** o tempo decorrido conta só dentro do
  `BusinessCalendar`; pausas (ex.: estado "Waiting for customer") somam em
  `paused_total_seconds`. Cálculo em função pura.
- **Escalation** não é modelo: é uma regra de automação (feature 03) disparada
  pelo evento "SLA em risco" emitido quando o timer cruza um limiar.
- **Approvals** podem ser um passo no workflow (feature 01) que bloqueia
  transição até `approved`.
- **Request types** reaproveitam Intake forms existentes.

## Migração

- `00NN_service_management.py`: BusinessCalendar, SlaGoal, SlaTimer, RequestType,
  ApprovalStep + extensão da SLA policy. Aditivo.
