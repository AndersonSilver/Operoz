# 01 — Modelo de Dados · Time Tracking

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Modelos (`db/models/worklog.py`)

```python
class WorklogActivityType(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  related_name="worklog_activity_types")
    name = models.CharField(max_length=80)        # Development, Review, Meeting
    icon = models.CharField(max_length=40, blank=True)
    color = models.CharField(max_length=9, blank=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        db_table = "worklog_activity_types"
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=Q(deleted_at__isnull=True),
                name="uq_worklog_activity_ws_name"),
        ]


class Worklog(ProjectBaseModel):                  # herda workspace/project/audit/soft-delete
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE,
                              related_name="worklogs")
    author = models.ForeignKey(settings.AUTH_USER_MODEL,
                               on_delete=models.SET_NULL, null=True,
                               related_name="worklogs")
    time_spent_seconds = models.PositiveIntegerField()
    started_at = models.DateTimeField()
    description = models.TextField(blank=True)
    is_billable = models.BooleanField(default=True)
    activity_type = models.ForeignKey(WorklogActivityType,
                                      on_delete=models.SET_NULL, null=True,
                                      related_name="worklogs")

    class Meta:
        db_table = "worklogs"
        ordering = ("-started_at",)
        indexes = [
            models.Index(fields=["issue", "author"]),
            models.Index(fields=["workspace", "started_at"]),
            models.Index(fields=["author", "started_at"]),   # timesheet por user
        ]


class TimerSession(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  related_name="timer_sessions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name="timer_sessions")
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE,
                              related_name="timer_sessions")
    started_at = models.DateTimeField(auto_now_add=True)
    stopped_at = models.DateTimeField(null=True, blank=True)   # null = a correr
    worklog = models.ForeignKey(Worklog, on_delete=models.SET_NULL, null=True,
                                related_name="+")

    class Meta:
        db_table = "timer_sessions"
        constraints = [
            # no máximo um timer a correr por utilizador
            models.UniqueConstraint(
                fields=["user"],
                condition=Q(stopped_at__isnull=True, deleted_at__isnull=True),
                name="uq_single_running_timer_per_user"),
        ]
```

## Campos no Issue (estimativas)

```python
# em db/models/issue.py (aditivo, nullable)
original_estimate_seconds = models.PositiveIntegerField(null=True, blank=True)
remaining_estimate_seconds = models.PositiveIntegerField(null=True, blank=True)
# time_spent é DERIVADO (soma de worklogs) — não persistido, ou cache opcional.
```

## Notas de design

- **`time_spent` derivado:** somar worklogs no serializer/anotação evita
  divergência. Cache opcional num campo só se a performance exigir, atualizado
  por signal.
- **Timer server-side:** a `UniqueConstraint` parcial garante um único timer
  ativo por utilizador (resistente a múltiplos separadores).
- **`is_billable` + `activity_type`:** chave para o relatório FinOps e ligação ao
  Cliente 360 (horas faturáveis × custo).
- **Permissões a nível de dado:** o modelo não decide quem edita; isso é RBAC
  (ver `04-seguranca.md`).

## Migração

- `00NN_time_tracking.py`: 3 tabelas + 2 campos no Issue + seed de
  `WorklogActivityType` default por workspace (Development, Review, Meeting,
  Testing).
