# 01 — Modelo de Dados · Advanced Roadmaps (Plans)

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Modelos (`db/models/plan.py`)

```python
class Plan(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  related_name="plans")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                              null=True, related_name="+")
    hierarchy = models.JSONField(default=list)   # níveis: [initiative, epic, story]
    settings = models.JSONField(default=dict)    # zoom default, colorir por, etc.

    class Meta:
        db_table = "plans"


class PlanSource(BaseModel):
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name="sources")
    source_type = models.CharField(max_length=20)   # project/board/oql
    source_ref = models.CharField(max_length=200)   # id ou query OQL

    class Meta:
        db_table = "plan_sources"


class TeamCapacity(BaseModel):
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE,
                             related_name="capacities")
    board = models.ForeignKey("db.Board", on_delete=models.CASCADE,
                              related_name="capacities")   # squad = equipa
    cycle = models.ForeignKey("db.Cycle", on_delete=models.CASCADE,
                              related_name="capacities", null=True)
    capacity_points = models.FloatField(null=True, blank=True)
    capacity_hours = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = "plan_team_capacities"
        constraints = [
            models.UniqueConstraint(
                fields=["plan", "board", "cycle"],
                condition=Q(deleted_at__isnull=True),
                name="uq_plan_capacity"),
        ]


class PlanScenario(BaseModel):
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE,
                             related_name="scenarios")
    name = models.CharField(max_length=255)
    # overlay de mudanças sobre o baseline (não duplica issues)
    changes = models.JSONField(default=dict)
    # { issue_id: { start_date?, target_date?, cycle?, board? }, ... }

    class Meta:
        db_table = "plan_scenarios"
```

## Versions / Releases

```python
class ProjectVersion(ProjectBaseModel):
    name = models.CharField(max_length=120)        # v2.1
    description = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    release_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, default="unreleased")  # unreleased/released/archived

    class Meta:
        db_table = "project_versions"

# Issue: fix_version FK, affects_version FK (nullable, SET_NULL)
```

## Design

- **Dependências cross-project** reusam `IssueRelation` (blocks/is blocked by) —
  o Plan apenas visualiza e deteta conflitos; não cria modelo novo de
  dependência.
- **Scenario como overlay:** `changes` guarda só os deltas por issue; o baseline
  permanece intacto. Comparar baseline vs scenario é diff de overlay.
- **Capacity por board (squad):** alinha com o modelo de equipa do Operoz; por
  ciclo permite over/under allocation.

## Migração

- `00NN_plans.py`: tabelas de Plan + Versions + FKs `Issue.fix_version`/
  `affects_version`. Aditivo, sem alterar issues existentes.
