# 02 — Contrato de API · Dashboard Builder

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Endpoints

```text
# Dashboards
GET    /api/workspaces/{slug}/dashboards/
POST   /api/workspaces/{slug}/dashboards/
GET    /api/workspaces/{slug}/dashboards/{id}/
PATCH  /api/workspaces/{slug}/dashboards/{id}/          # nome, layout_config, is_shared
DELETE /api/workspaces/{slug}/dashboards/{id}/

# Gadgets
POST   /api/workspaces/{slug}/dashboards/{id}/gadgets/
PATCH  /api/workspaces/{slug}/dashboards/{id}/gadgets/{gid}/   # position, config
DELETE /api/workspaces/{slug}/dashboards/{id}/gadgets/{gid}/

# Dados de um gadget (resolve OQL/métrica)
GET    /api/workspaces/{slug}/dashboards/{id}/gadgets/{gid}/data/

# Catálogo de gadgets (para a paleta)
GET    /api/workspaces/{slug}/dashboards/gadget-catalog/

# Partilha
GET    /api/workspaces/{slug}/dashboards/{id}/shares/
POST   /api/workspaces/{slug}/dashboards/{id}/shares/
DELETE /api/workspaces/{slug}/dashboards/{id}/shares/{sid}/
```

## Permissões

| Ação | Regra |
| --- | --- |
| Criar dashboard | `MEMBER` (fica owner) |
| Editar/apagar dashboard | owner **ou** share com `permission=edit` **ou** ADMIN |
| Ver dashboard | owner, share aplicável, ou (se `is_shared`) membro do workspace |
| Gerir shares | owner ou ADMIN |
| `gadget/data/` | mesma visibilidade do dashboard **+** recorte por dados acessíveis |

## Resolução de dados (`gadget/data/`)

```text
GET .../gadgets/{gid}/data/
  spec = GADGET_REGISTRY[gadget.gadget_type]
  if spec.source == "oql":
      issues = run_oql(workspace, request.user, gadget.config["oql"])  # feature 02
      data = aggregate(issues, group_by=gadget.config.get("field"))
  elif spec.source == "metric":
      data = compute_metric(spec.metric, scope=gadget.config)          # feature 08
  return data   # já recortado pela visibilidade do utilizador
```

> **Crucial:** os dados são resolvidos **por request do utilizador que vê**, não
> do owner. Um dashboard partilhado mostra a cada um só o que pode ver.

## Exemplo

```jsonc
// POST gadgets/
{ "gadget_type": "pie", "position": { "x": 0, "y": 0, "w": 4, "h": 3 },
  "config": { "oql": "project = \"APP\" AND status != \"Done\"",
              "field": "assignee" },
  "refresh_interval_seconds": 300 }

// GET gadgets/{gid}/data/
{ "type": "pie", "series": [ { "label": "ana", "value": 12 },
                             { "label": "joão", "value": 7 } ] }
```

## Notas

- `gadget-catalog/` devolve tipos + config schema (gera o formulário do gadget).
- Auto-refresh é do cliente (poll do `data/` conforme `refresh_interval_seconds`);
  endpoint com throttle.
