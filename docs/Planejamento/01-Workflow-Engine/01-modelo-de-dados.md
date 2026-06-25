# 01 — Modelo de Dados · Workflow Engine

Padrões base em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Modelos (`db/models/workflow.py`)

```python
class Workflow(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  related_name="workflows")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_draft = models.BooleanField(default=True)
    initial_state = models.ForeignKey("db.State", on_delete=models.SET_NULL,
                                      null=True, related_name="+")
    published_at = models.DateTimeField(null=True, blank=True)
    published_version = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "workflows"
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=Q(deleted_at__isnull=True),
                name="uq_workflow_workspace_name"),
        ]
        indexes = [models.Index(fields=["workspace", "is_active"])]


class WorkflowTransition(BaseModel):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE,
                                 related_name="transitions")
    from_state = models.ForeignKey("db.State", on_delete=models.CASCADE,
                                   null=True, related_name="+")  # null = global
    to_state = models.ForeignKey("db.State", on_delete=models.CASCADE,
                                 related_name="+")
    name = models.CharField(max_length=120)        # "Start Progress", "Close"
    is_global = models.BooleanField(default=False) # de qualquer estado
    sort_order = models.FloatField(default=10000)

    class Meta:
        db_table = "workflow_transitions"
        indexes = [models.Index(fields=["workflow", "from_state"])]


class TransitionCondition(BaseModel):
    transition = models.ForeignKey(WorkflowTransition, on_delete=models.CASCADE,
                                   related_name="conditions")
    condition_type = models.CharField(max_length=40)  # role/assignee_only/
                                                       # reporter_only/group
    config = models.JSONField(default=dict)


class TransitionValidator(BaseModel):
    transition = models.ForeignKey(WorkflowTransition, on_delete=models.CASCADE,
                                   related_name="validators")
    validator_type = models.CharField(max_length=40)  # required_fields/
                                                       # has_comment/regex
    config = models.JSONField(default=dict)


class TransitionPostFunction(BaseModel):
    transition = models.ForeignKey(WorkflowTransition, on_delete=models.CASCADE,
                                   related_name="post_functions")
    function_type = models.CharField(max_length=40)  # assign/clear_field/
                                                     # update_field/fire_event/webhook
    config = models.JSONField(default=dict)
    sort_order = models.FloatField(default=10000)


class TransitionScreen(BaseModel):
    transition = models.OneToOneField(WorkflowTransition,
                                      on_delete=models.CASCADE,
                                      related_name="screen")
    fields = models.JSONField(default=list)  # [{field_id, required}]


class WorkflowScheme(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  related_name="workflow_schemes")
    name = models.CharField(max_length=255)
    is_default = models.BooleanField(default=False)

    class Meta:
        db_table = "workflow_schemes"


class WorkflowSchemeEntry(BaseModel):
    scheme = models.ForeignKey(WorkflowScheme, on_delete=models.CASCADE,
                               related_name="entries")
    issue_type = models.ForeignKey("db.IssueType", on_delete=models.CASCADE,
                                   null=True, related_name="+")  # null=default
    workflow = models.ForeignKey(Workflow, on_delete=models.PROTECT,
                                 related_name="+")

    class Meta:
        db_table = "workflow_scheme_entries"
        constraints = [
            models.UniqueConstraint(
                fields=["scheme", "issue_type"],
                condition=Q(deleted_at__isnull=True),
                name="uq_scheme_issue_type"),
        ]
```

## Notas de design

- **Estados reutilizados:** as transições referenciam o `State` existente do
  projeto; o workflow não duplica estados.
- **`config` JSON** mantém condições/validadores/post-functions extensíveis sem
  migração por tipo novo (catálogo no código, dados em JSON — padrão da
  automação).
- **Versionamento:** `published_version` + `published_at`; o grafo editável vive
  nos modelos relacionais; ao publicar, congela-se a versão (snapshot
  serializado opcional em `Workflow.published_graph` JSON, espelhando
  `BoardAutomationRule`).
- **Associação ao projeto:** o `Project` ganha FK opcional `workflow_scheme`;
  fallback para esquema default do workspace.

## Migração

- `db/migrations/00NN_workflow_engine.py` cria as 8 tabelas + FK
  `Project.workflow_scheme` (nullable, `SET_NULL`).
- Data migration leve: criar um `WorkflowScheme` default por workspace com um
  workflow derivado dos estados atuais (preserva comportamento existente).

## Índices e performance

- `WorkflowTransition(workflow, from_state)` para resolver transições válidas de
  um estado em O(1).
- Carregar transições com `prefetch_related("conditions", "validators",
  "post_functions")` ao avaliar uma issue.
