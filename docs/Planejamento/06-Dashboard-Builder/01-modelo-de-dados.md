# 01 — Modelo de Dados · Dashboard Builder

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Modelos (`db/models/dashboard.py`)

```python
class Dashboard(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  related_name="dashboards")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL,
                              on_delete=models.SET_NULL, null=True,
                              related_name="dashboards")
    layout_config = models.JSONField(default=dict)  # grid global (cols, rowHeight)
    is_shared = models.BooleanField(default=False)

    class Meta:
        db_table = "dashboards"
        indexes = [models.Index(fields=["workspace", "owner"])]


class DashboardGadget(BaseModel):
    dashboard = models.ForeignKey(Dashboard, on_delete=models.CASCADE,
                                  related_name="gadgets")
    gadget_type = models.CharField(max_length=40)   # filter_results/pie/bar/line/
                                                    # burndown/velocity/sprint_health/
                                                    # created_vs_resolved/activity/text
    position = models.JSONField(default=dict)        # {x, y, w, h}
    config = models.JSONField(default=dict)          # {oql?, metric?, field?, project_id?, ...}
    refresh_interval_seconds = models.PositiveIntegerField(default=0)  # 0 = manual

    class Meta:
        db_table = "dashboard_gadgets"
        ordering = ("created_at",)


class DashboardShare(BaseModel):
    dashboard = models.ForeignKey(Dashboard, on_delete=models.CASCADE,
                                  related_name="shares")
    shared_with_type = models.CharField(max_length=20)  # workspace/project/user
    shared_with_id = models.CharField(max_length=36, blank=True)  # null p/ workspace
    permission = models.CharField(max_length=10, default="view")  # view/edit

    class Meta:
        db_table = "dashboard_shares"
        constraints = [
            models.UniqueConstraint(
                fields=["dashboard", "shared_with_type", "shared_with_id"],
                condition=Q(deleted_at__isnull=True),
                name="uq_dashboard_share"),
        ]
```

## Design

- **Tudo flexível em JSON:** `position` (grid), `config` (fonte+opções) e
  `layout_config` permitem novos tipos de gadget sem migração. Espelha a
  filosofia do grafo de automação.
- **Fonte de dados desacoplada:** `config.oql` (feature 02) para gadgets de
  issues; `config.metric` (feature 08) para agile. O gadget não tem query
  própria embutida no modelo.
- **Partilha granular:** `DashboardShare` por workspace/projeto/user com
  view/edit.

## Catálogo de gadgets (código)

```python
# dashboards/gadgets.py
GADGET_REGISTRY = {
    "filter_results": GadgetSpec(source="oql", renderer="table"),
    "pie":            GadgetSpec(source="oql", renderer="pie", group_by=True),
    "bar":            GadgetSpec(source="oql", renderer="bar", group_by=True),
    "line":           GadgetSpec(source="oql", renderer="line", time_series=True),
    "burndown":       GadgetSpec(source="metric", metric="burndown"),
    "velocity":       GadgetSpec(source="metric", metric="velocity"),
    "sprint_health":  GadgetSpec(source="metric", metric="sprint_health"),
    "created_vs_resolved": GadgetSpec(source="metric", metric="created_vs_resolved"),
    "activity":       GadgetSpec(source="activity"),
    "text":           GadgetSpec(source="static"),
}
```

## Migração

- `00NN_dashboards.py`: 3 tabelas. Sem data migration (feature aditiva).
