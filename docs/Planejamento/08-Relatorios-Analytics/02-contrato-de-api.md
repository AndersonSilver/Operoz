# 02 — Contrato de API · Relatórios & Analytics

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Endpoints

```text
# Métricas (genérico, scope-driven)
GET /api/workspaces/{slug}/metrics/{metric_key}/?scope=cycle&scope_id=<id>
GET /api/workspaces/{slug}/metrics/{metric_key}/?scope=board&scope_id=<id>&from=&to=
GET /api/workspaces/{slug}/metrics/{metric_key}/?scope=oql&q=<oql>

# Catálogo de métricas
GET /api/workspaces/{slug}/metrics/catalog/

# Sprint report dedicado
GET /api/workspaces/{slug}/projects/{pid}/cycles/{cid}/report/

# Export
GET /api/workspaces/{slug}/metrics/{metric_key}/export/?format=csv|pdf|png&scope=…
```

## Permissões

- Leitura: `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`.
- Os dados de cada métrica são **recortados pela visibilidade do utilizador**
  (projetos acessíveis + `visible_security` da feature 07).
- Export herda a mesma verificação.

## Resolução genérica

```python
def get(self, request, slug, metric_key):
    spec = METRIC_REGISTRY[metric_key]                  # 404 se desconhecida
    scope = parse_scope(request.query_params, spec.scope_kinds)  # valida kind
    base = scoped_issue_qs(request.user, scope)         # já com visibilidade
    series = spec.compute(base, scope, context(request))
    return Response(series)
```

## Formatos de resposta (séries)

```jsonc
// burndown
{ "metric": "burndown", "ideal": [{ "date": "…", "points": 50 }],
  "actual": [{ "date": "…", "points": 47 }] }

// velocity
{ "metric": "velocity",
  "sprints": [{ "name": "Sprint 22", "committed": 30, "completed": 26 }] }

// cfd
{ "metric": "cfd",
  "series": [{ "date": "…", "by_state": { "todo": 10, "doing": 5, "done": 40 } }] }

// time_in_status
{ "metric": "time_in_status",
  "issues": [{ "id": "…", "by_state": { "doing": 86400, "review": 3600 } }] }
```

## Sprint report

```jsonc
// GET cycles/{cid}/report/
{ "completed": [...], "not_completed": [...], "removed": [...],
  "points": { "committed": 30, "completed": 26, "added": 4 } }
```

## Export

- `format=csv` → exporter existente; `pdf`/`png` → render server-side
  (template + chart). Tarefa Celery para exports grandes, com download seguro
  (token TTL).

## Notas

- Métricas pesadas usam snapshots; `from/to` limita a janela.
- `scope=oql` reusa o motor da feature 02 (mesma validação/whitelist).
- Throttle por utilizador (computação).
