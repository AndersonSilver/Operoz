# 01 — Modelo de Dados · Board Hub Cross-Project

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Observação

Esta feature é **maioritariamente de leitura/agregação**. O modelo `Board` já
existe; as adições são pequenas (config de vistas e WIP).

## 1. Modelo existente (reuso)

```python
# db/models/board.py — JÁ EXISTE
class Board(BaseModel):
    workspace
    slug (unique per workspace), identifier, category
    board_lead, default_assignee
```

A relação Board→Projetos já existe (projetos têm `board_id`).

## 2. Adições

### Configuração de vistas/colunas do board

```python
class BoardViewConfig(BaseModel):
    board = models.OneToOneField("db.Board", on_delete=models.CASCADE,
                                 related_name="view_config")
    # ordenação e visibilidade de colunas do Kanban agregado
    column_states = models.JSONField(default=list)   # [state_id, ...] ordem
    wip_limits = models.JSONField(default=dict)       # {state_id: limite}
    swimlane_by = models.CharField(max_length=30, default="none")  # epic/assignee/priority/type/none
    card_fields = models.JSONField(default=list)      # campos visíveis no card
    default_layout = models.CharField(max_length=20, default="kanban")

    class Meta:
        db_table = "board_view_configs"
```

### Vista guardada por board (filtro + layout)

```python
class BoardSavedView(BaseModel):
    board = models.ForeignKey("db.Board", on_delete=models.CASCADE,
                              related_name="saved_views")
    name = models.CharField(max_length=255)
    layout = models.CharField(max_length=20)          # kanban/list/gantt/calendar
    filters = models.JSONField(default=dict)          # rich-filter
    oql_query = models.TextField(blank=True, default="")  # OQL equivalente (feature 02)
    is_shared = models.BooleanField(default=True)

    class Meta:
        db_table = "board_saved_views"
        constraints = [
            models.UniqueConstraint(
                fields=["board", "name"],
                condition=Q(deleted_at__isnull=True),
                name="uq_board_saved_view_name"),
        ]
```

## 3. KPIs do board (`meta/`) — sem tabela

Os KPIs (contagem por estado, por tipo, por membro, throughput) são **computados
on-read** a partir das issues do board, com cache curto (Redis), seguindo o
padrão de enriquecimento on-read do `WorkspaceClient360ViewSet`.

## Notas

- `column_states`/`wip_limits` em JSON mantêm flexibilidade sem migração por
  mudança de configuração.
- Nenhuma issue é duplicada: o board agrega via `board_id` dos projetos.
- `BoardSavedView` partilha a mesma semântica de filtros que `View` de projeto,
  para reuso de componentes.
