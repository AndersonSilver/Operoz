# 01 — Modelo de Dados · No-Code Rule Builder

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Observação

Esta feature é, sobretudo, **camada de apresentação + catálogo** sobre um motor
já modelado. **Reusa** os modelos existentes; adiciona pouco.

## 1. Modelos existentes (reuso)

```python
# db/models/board_automation.py — JÁ EXISTE
class BoardAutomationRule(BaseModel):
    board, workspace
    name, description, enabled, sort_order
    graph = JSONField()             # grafo em edição
    published_graph = JSONField()   # versão ativa
    published_at, published_version

class BoardAutomationRun(BaseModel):
    rule, status (pending/running/success/failed/skipped)
    context_snapshot, graph_snapshot  # JSON
```

> O builder no-code escreve no mesmo `graph` que o motor já interpreta. Zero
> alterações de schema no caminho principal.

## 2. Adições pequenas

### Templates de regra (galeria)

```python
class AutomationRuleTemplate(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  null=True, related_name="rule_templates")
    # null = template global/oficial; preenchido = template do workspace
    key = models.SlugField(max_length=120)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=60)   # housekeeping/notify/sync
    graph = models.JSONField()                   # grafo parametrizável

    class Meta:
        db_table = "automation_rule_templates"
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "key"],
                condition=Q(deleted_at__isnull=True),
                name="uq_rule_template_ws_key"),
        ]
```

## 3. Catálogo declarativo (em código)

A peça nova mais importante **não é uma tabela** — é o catálogo que descreve, de
forma declarativa, cada bloco no-code e como ele mapeia para um nó do grafo do
motor.

```python
# automation/catalog/registry.py  (estende o catalog existente)
@dataclass(frozen=True)
class CatalogBlock:
    key: str                 # "issue.transitioned"
    kind: str                # trigger|condition|action
    label_i18n: str          # chave i18n
    schema: dict             # JSON Schema do formulário (config)
    to_node: Callable        # (config) -> nó do grafo do motor

TRIGGERS = {
    "issue.created": CatalogBlock(...),
    "issue.transitioned": CatalogBlock(...),
    "scheduled.cron": CatalogBlock(...),
    "webhook.received": CatalogBlock(...),
}
CONDITIONS = { "field.equals": ..., "type.is": ..., "oql.matches": ... }
ACTIONS    = { "issue.transition": ..., "issue.assign": ...,
               "comment.add": ..., "email.send": ..., "webhook.send": ... }
```

- `condition oql.matches` reusa a **feature 02** (OQL) para condicionar regras —
  consistência entre filtros e automação.
- `schema` (JSON Schema) gera o formulário do nó no frontend automaticamente.

## Notas

- Versionamento e dry-run já existem no motor; o builder só os expõe.
- Smart values são resolvidas no executor (runtime), não persistidas expandidas.
