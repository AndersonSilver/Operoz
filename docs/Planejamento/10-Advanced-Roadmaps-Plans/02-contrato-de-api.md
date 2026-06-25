# 02 — Contrato de API · Advanced Roadmaps (Plans)

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Endpoints

```text
# Plans
GET/POST/PATCH/DELETE /api/workspaces/{slug}/plans/{id}/
POST   /api/workspaces/{slug}/plans/{id}/sources/        # add projeto/board/oql
DELETE /api/workspaces/{slug}/plans/{id}/sources/{sid}/

# Timeline do plano (issues agregadas + dependências)
GET    /api/workspaces/{slug}/plans/{id}/timeline/?zoom=month&scenario=<sid>

# Capacity
GET/PUT /api/workspaces/{slug}/plans/{id}/capacity/      # por board/ciclo

# Scenarios
GET/POST /api/workspaces/{slug}/plans/{id}/scenarios/
PATCH  /api/workspaces/{slug}/plans/{id}/scenarios/{sid}/   # editar overlay
POST   /api/workspaces/{slug}/plans/{id}/scenarios/{sid}/commit/   # aplicar ao baseline

# Dependências (relatório)
GET    /api/workspaces/{slug}/plans/{id}/dependencies/

# Versions / Releases
GET/POST/PATCH /api/workspaces/{slug}/projects/{pid}/versions/{id}/
GET    /api/workspaces/{slug}/projects/{pid}/versions/{id}/report/   # release tracking
```

## Permissões

| Ação | Regra |
| --- | --- |
| Criar/editar plano | `MEMBER` (fica owner) / share |
| Editar capacity/scenarios | owner do plano ou ADMIN |
| `scenario/commit/` (altera issues reais) | exige `issue.edit` nos projetos afetados |
| Gerir versions | `project.admin` |
| Ver timeline | recortado por `accessible_board_project_ids` (feature 04) |

## Timeline (agregação)

```python
def plan_timeline(plan, user, scenario=None):
    project_ids = resolve_sources(plan, user)   # só fontes acessíveis ao user
    issues = Issue.objects.filter(project_id__in=project_ids) \
                          .filter(visible_security(user, plan.workspace))
    bars = to_bars(issues)                       # start/target + hierarquia
    if scenario:
        bars = apply_overlay(bars, scenario.changes)   # what-if, não persiste
    deps = relations_between(issues)             # IssueRelation blocks
    return { "bars": bars, "dependencies": deps,
             "capacity": capacity_summary(plan), "conflicts": detect_conflicts(...) }
```

- `scenario` aplica overlay **só na resposta** (sem efeitos colaterais até
  `commit/`).
- `conflicts`: dependência que viola datas, ou sprint acima da capacidade.

## scenario/commit

```jsonc
// POST scenarios/{sid}/commit/
// Aplica as mudanças do overlay às issues reais, numa transação,
// verificando issue.edit em cada projeto afetado. Audita o commit.
```

## Versions report (release tracking)

```jsonc
// GET versions/{id}/report/
{ "version": "v2.1", "status": "unreleased",
  "issues": { "done": 30, "in_progress": 8, "to_do": 12 },
  "completion": 0.6, "at_risk": [ { "id": "…", "reason": "blocked" } ] }
```

## Notas

- Capacity vs committed calculado a partir de estimates das issues no ciclo.
- Throttle nas timelines (computação pesada cross-project).
