# 02 — Contrato de API · Custom Fields

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Endpoints

```text
# Definição de campos (workspace)
GET/POST/PATCH/DELETE /api/workspaces/{slug}/custom-fields/{id}/
GET /api/workspaces/{slug}/custom-field-types/        # catálogo de tipos + schema

# Field configurations
GET/POST/PATCH /api/workspaces/{slug}/field-configurations/{id}/
POST /api/workspaces/{slug}/field-configurations/{id}/items/

# Valores por issue
GET   /api/workspaces/{slug}/projects/{pid}/issues/{iid}/custom-values/
PUT   /api/workspaces/{slug}/projects/{pid}/issues/{iid}/custom-values/{field_id}/

# Components
GET/POST/PATCH/DELETE /api/workspaces/{slug}/projects/{pid}/components/{id}/

# Resolutions
GET/POST /api/workspaces/{slug}/resolutions/
```

## Permissões

| Ação | Regra |
| --- | --- |
| Definir campos / configurations / resolutions | `ROLE.ADMIN` (workspace) |
| Gerir components | `project.admin` (feature 07) |
| Editar valor numa issue | `issue.edit` + campo não `readonly`/`hidden` no contexto |
| Ler valores | quem pode ver a issue |

## Validação por tipo (server-side)

```python
VALIDATORS = {
    "NUMBER":   validate_number,     # respeita settings (min/max/decimais)
    "SELECT":   validate_in_options, # valor ∈ settings.options
    "MULTI_SELECT": validate_subset,
    "DATE":     validate_date,
    "USER":     validate_workspace_member,   # user pertence ao workspace
    "URL":      validate_url,
    "CASCADING": validate_cascade,   # parent/child coerentes
}
```

- Cada valor é validado contra o `settings` do campo **e** contra o
  `FieldConfigItem` do contexto (required → não pode ficar vazio).
- O valor vai para a coluna tipada certa de `IssueCustomFieldValue`.

## Exemplo

```jsonc
// PUT custom-values/{field_id}/   (campo SELECT)
{ "value": "enterprise" }
// 422 se "enterprise" ∉ settings.options

// PUT custom-values/{field_id}/   (campo CASCADING)
{ "value": { "parent": "BR", "child": "SP" } }
```

## Integração OQL

- `cf[<id>]` (feature 02) resolve via `IssueCustomFieldValue`, escolhendo a
  coluna tipada e operadores conforme `field_type`. O id é validado contra o
  workspace.

## Notas

- `custom-field-types/` devolve o schema de `settings` por tipo → gera o
  formulário de definição no frontend.
- Apagar um campo é soft-delete; valores ficam órfãos mas recuperáveis.
