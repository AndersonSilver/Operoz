# 01 — Modelo de Dados · Custom Fields

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## 1. Modelo existente (reuso e extensão)

```python
# db/models/custom_field.py — JÁ EXISTE
class CustomFieldType(TextChoices):
    TEXT, PARAGRAPH, DATE, DATETIME, CATEGORIES, SELECT, MULTI_SELECT, ...
    # ESTENDER: NUMBER, CHECKBOX, RADIO, USER, MULTI_USER, GROUP, URL,
    #           CASCADING, READONLY

class WorkspaceCustomField(BaseModel):
    workspace, key (slug), field_type, settings (JSONField)
    # settings guarda: opções (select), formato (number), cascata, etc.
```

## 2. Valores por issue (EAV controlado)

```python
class IssueCustomFieldValue(BaseModel):
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE,
                              related_name="custom_values")
    field = models.ForeignKey(WorkspaceCustomField, on_delete=models.CASCADE,
                              related_name="values")
    # colunas tipadas — preenche-se a que corresponde ao field_type
    value_text = models.TextField(blank=True, null=True)
    value_number = models.DecimalField(max_digits=20, decimal_places=4,
                                       null=True, blank=True)
    value_date = models.DateTimeField(null=True, blank=True)
    value_json = models.JSONField(null=True, blank=True)  # select/multi/user/cascade

    class Meta:
        db_table = "issue_custom_field_values"
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "field"],
                condition=Q(deleted_at__isnull=True),
                name="uq_issue_custom_value"),
        ]
        indexes = [
            models.Index(fields=["field", "value_text"]),
            models.Index(fields=["field", "value_number"]),
            models.Index(fields=["field", "value_date"]),
        ]
```

> **EAV controlado** (colunas tipadas, não um único `value` string): permite
> índices e ordenação reais, e suporta OQL `cf[<id>]` com operadores corretos
> por tipo.

## 3. Field configuration

```python
class FieldConfiguration(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  related_name="field_configurations")
    name = models.CharField(max_length=255)

class FieldConfigItem(BaseModel):
    configuration = models.ForeignKey(FieldConfiguration, on_delete=models.CASCADE,
                                      related_name="items")
    field = models.ForeignKey(WorkspaceCustomField, on_delete=models.CASCADE,
                              related_name="config_items")
    is_required = models.BooleanField(default=False)
    is_hidden = models.BooleanField(default=False)
    is_readonly = models.BooleanField(default=False)
    default_value = models.JSONField(null=True, blank=True)
    # contexto: a que tipos de issue/projeto se aplica
    issue_type = models.ForeignKey("db.IssueType", on_delete=models.CASCADE,
                                   null=True, related_name="+")
```

## 4. Components e Resolution (entidades dedicadas)

```python
class ProjectComponent(ProjectBaseModel):
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    lead = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                             null=True, related_name="+")
    default_assignee = models.ForeignKey(settings.AUTH_USER_MODEL,
                                         on_delete=models.SET_NULL, null=True,
                                         related_name="+")
    class Meta:
        db_table = "project_components"

class Resolution(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  related_name="resolutions")
    name = models.CharField(max_length=80)   # Fixed, Won't Fix, Duplicate…
    class Meta:
        db_table = "resolutions"

# Issue: components (M2M via IssueComponent), resolution FK (nullable)
```

## Migração

- `00NN_custom_fields.py`: `IssueCustomFieldValue`, `FieldConfiguration(+Item)`,
  `ProjectComponent`, `Resolution`, M2M `IssueComponent`, FK
  `Issue.resolution`. Novos valores de `CustomFieldType`. Aditivo.
