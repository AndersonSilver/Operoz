# 01 — Modelo de Dados · Relatórios & Analytics

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Observação

Relatórios são sobretudo **computação**, não armazenamento. Reusam-se dados
existentes (issues, `IssueActivity`, cycles). Só se adicionam snapshots para
séries históricas pesadas.

## 1. Fontes existentes (reuso)

- `Issue` (estado, datas, estimate_point) — base de quase tudo.
- `IssueActivity` — transições de estado para **time-in-status** e CFD
  (idealmente alimentado pela feature 01 que regista cada transição).
- `Cycle` (sprint) — fronteiras temporais de burndown/velocity.
- `Worklog` (feature 05) — relatórios de tempo.

## 2. Snapshots para histórico (Celery)

```python
class CycleMetricSnapshot(BaseModel):
    cycle = models.ForeignKey("db.Cycle", on_delete=models.CASCADE,
                              related_name="metric_snapshots")
    snapshot_date = models.DateField()
    remaining_points = models.FloatField()
    completed_points = models.FloatField()
    scope_points = models.FloatField()        # para burnup
    open_count = models.PositiveIntegerField()
    done_count = models.PositiveIntegerField()

    class Meta:
        db_table = "cycle_metric_snapshots"
        constraints = [
            models.UniqueConstraint(
                fields=["cycle", "snapshot_date"],
                condition=Q(deleted_at__isnull=True),
                name="uq_cycle_snapshot_date"),
        ]
        indexes = [models.Index(fields=["cycle", "snapshot_date"])]


class BoardFlowSnapshot(BaseModel):
    board = models.ForeignKey("db.Board", on_delete=models.CASCADE,
                              related_name="flow_snapshots")
    snapshot_date = models.DateField()
    counts_by_state = models.JSONField(default=dict)   # {state_id: n} → CFD
    class Meta:
        db_table = "board_flow_snapshots"
```

- Um Celery beat diário cria os snapshots do dia (idempotente: `UniqueConstraint`
  por data). Burndown/CFD leem snapshots + ponto "hoje" calculado on-read.

## 3. Motor de métricas (código)

```python
# analytics/metrics/registry.py
@dataclass(frozen=True)
class MetricSpec:
    key: str                 # "burndown"
    compute: Callable        # (scope, context) -> series
    scope_kinds: tuple       # ("cycle",) | ("project","board","oql")

METRIC_REGISTRY = {
    "burndown":  MetricSpec("burndown", compute_burndown, ("cycle",)),
    "burnup":    MetricSpec("burnup", compute_burnup, ("cycle",)),
    "velocity":  MetricSpec("velocity", compute_velocity, ("project","board")),
    "cfd":       MetricSpec("cfd", compute_cfd, ("board","project")),
    "control":   MetricSpec("control", compute_control_chart, ("project","board")),
    "created_vs_resolved": MetricSpec(..., ("project","board","oql")),
    "time_in_status":      MetricSpec(..., ("project","board")),
    "workload":  MetricSpec("workload", compute_workload, ("project","board")),
}
```

> O mesmo `METRIC_REGISTRY` serve as páginas de relatório **e** os gadgets de
> dashboard (feature 06) — uma só implementação de cada métrica.

## Migração

- `00NN_report_snapshots.py`: 2 tabelas de snapshot. Snapshots começam a
  acumular a partir da ativação (histórico anterior reconstruído on-read quando
  possível a partir de `IssueActivity`).
