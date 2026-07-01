# 01 — Modelo de Dados · OQL

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Observação

A OQL é sobretudo **lógica de domínio** (parser + compilador), não tabelas
novas. Persistência reaproveita o modelo `View` existente. Há apenas duas
adições pequenas e opcionais.

## 1. Reuso do modelo `View`

O `View`/`WorkspaceView` já guarda filtros. Adiciona-se um campo para a forma
textual:

```python
# em db/models/view.py (campo novo, nullable — aditivo)
oql_query = models.TextField(blank=True, default="")
# A representação rich-filter existente continua; oql_query é a fonte textual
# equivalente quando o utilizador escreve OQL.
```

## 2. Histórico de pesquisas (opcional, F2)

```python
class OqlSearchHistory(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  related_name="oql_history")
    user = models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.CASCADE, related_name="oql_history")
    query = models.TextField()

    class Meta:
        db_table = "oql_search_history"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["workspace", "user", "-created_at"])]
```

- Soft-delete e audit herdados do `BaseModel`.
- Limitar a N entradas por utilizador (trim assíncrono ou no insert).

## 3. Registry de campos (em código, não DB)

O coração da OQL é o **mapa de campos** — fonte única que liga um identificador
OQL a: lookup ORM, tipo, operadores válidos e função de coerção de valor.

```python
# operoz/oql/fields.py
@dataclass(frozen=True)
class OqlField:
    key: str                      # "status"
    orm_path: str                 # "state__name"
    value_type: str               # text|number|date|user|enum|reference
    operators: tuple[str, ...]    # ("=", "!=", "IN", ...)
    coerce: Callable[[Any, Context], Any]

FIELD_REGISTRY: dict[str, OqlField] = {
    "project":  OqlField("project", "project__identifier", "reference", EQ_IN, ...),
    "status":   OqlField("status", "state__name", "text", EQ_IN, ...),
    "assignee": OqlField("assignee", "assignees", "user", EQ_IN, coerce_user),
    "priority": OqlField("priority", "priority", "enum", CMP, ...),
    "type":     OqlField("type", "type__name", "text", EQ_IN, ...),
    "label":    OqlField("label", "labels__name", "text", EQ_IN, ...),
    "cycle":    OqlField("cycle", "issue_cycle__cycle__name", "text", EQ_IN, ...),
    "created":  OqlField("created", "created_at", "date", CMP, coerce_date),
    "due":      OqlField("due", "target_date", "date", CMP, coerce_date),
    # cf[<id>] resolvido dinamicamente contra WorkspaceCustomField
}
```

> **Whitelist por construção:** só campos no registry são consultáveis. Não há
> caminho de um identificador arbitrário para um atributo do ORM — é a principal
> defesa contra fuga de dados.

## Notas

- Sem tabelas pesadas: a OQL é stateless por request.
- `cf[<id>]` valida o id contra `WorkspaceCustomField` do workspace antes de
  traduzir (feature 09).
- A coerção de `assignee = currentUser()` usa o `Context` (utilizador, workspace,
  agora) — nunca confia em valor cru do cliente.
