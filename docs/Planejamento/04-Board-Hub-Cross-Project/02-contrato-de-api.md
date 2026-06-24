# 02 — Contrato de API · Board Hub Cross-Project

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Endpoints

```text
# Issues agregadas do board (todos os projetos do board)
GET /api/workspaces/{slug}/boards/{bslug}/issues/?group_by=state&project=<id>&q=<oql>&cursor=

# KPIs / Resumo
GET /api/workspaces/{slug}/boards/{bslug}/meta/        # contagens, throughput

# Cronograma agregado (issues + módulos com datas)
GET /api/workspaces/{slug}/boards/{bslug}/timeline/?from=&to=&zoom=week

# Calendário agregado
GET /api/workspaces/{slug}/boards/{bslug}/calendar/?month=2026-06

# Config de vistas
GET   /api/workspaces/{slug}/boards/{bslug}/view-config/
PATCH /api/workspaces/{slug}/boards/{bslug}/view-config/

# Vistas guardadas do board
GET    /api/workspaces/{slug}/boards/{bslug}/saved-views/
POST   /api/workspaces/{slug}/boards/{bslug}/saved-views/
PATCH  /api/workspaces/{slug}/boards/{bslug}/saved-views/{id}/
```

## Permissões

- Leitura (issues, meta, timeline, calendar): `@allow_permission([ROLE.ADMIN,
  ROLE.MEMBER])` + filtro por projetos do board **a que o utilizador tem
  acesso** (ver segurança).
- Config de vistas (escrita): `ROLE.ADMIN` (workspace) ou board-admin via
  `BoardRolePermission`.
- Saved views: criar partilhadas exige `view.manage_shared`; pessoais por
  qualquer membro.

## Agregação (issues do board)

```python
def get_queryset(self):
    project_ids = accessible_board_project_ids(self.request.user, board)
    qs = Issue.objects.filter(project_id__in=project_ids)
    if project := self.request.query_params.get("project"):
        qs = qs.filter(project_id=project)
    if oql := self.request.query_params.get("q"):
        qs = qs.filter(compile_oql(oql, context))   # feature 02
    return qs.select_related("state", "project", "type") \
             .prefetch_related("assignees", "labels")
```

- `group_by=state` usa `GroupedOffsetPaginator` (colunas do Kanban paginadas por
  grupo).
- Cada issue serializada inclui `project` (badge de projeto no card).

## `meta/` (resposta)

```jsonc
{
  "by_state": { "backlog": 40, "started": 12, "completed": 88 },
  "by_type": { "Bug": 22, "Task": 60 },
  "by_assignee": [ { "user_id": "…", "count": 14 } ],
  "throughput_14d": 23,
  "wip_over_limit": [ { "state_id": "…", "limit": 5, "current": 7 } ]
}
```

Cache curto (ex.: 60s) por board+utilizador (visibilidade afeta o conjunto).

## Timeline / Calendar

- `timeline/` devolve issues e **módulos** com `start_date`/`target_date` +
  dependências (feature 10 aprofunda); `zoom` controla a granularidade.
- `calendar/` agrupa por dia dentro do mês pedido.

## Notas

- Reuso máximo dos serializers Lite de issue; sem novos formatos de issue.
- Throttle no `meta/`/`timeline/` (computação) para evitar abuso.
