# 04 — Segurança · Board Hub Cross-Project

Baseline em [`00-VISAO-GERAL/03-seguranca-transversal.md`](../00-VISAO-GERAL/03-seguranca-transversal.md).

## Risco central: agregação cross-project vaza permissões

O board agrega múltiplos projetos. O perigo é mostrar issues de um projeto a que
o utilizador **não** tem acesso, só porque pertence ao board.

| Ameaça | Vetor | Mitigação |
| --- | --- | --- |
| Fuga cross-project | Membro do board vê issues de projeto restrito | `accessible_board_project_ids(user, board)` filtra projetos a que o user tem acesso, **antes** de agregar |
| Bypass via `project` param | `?project=<id>` de projeto não acessível | Validar que o id está no conjunto acessível; senão `403/404` |
| Fuga via OQL no board | `?q=` tenta alargar visibilidade | OQL aplica-se **depois** do filtro de projetos acessíveis (feature 02) |
| KPIs revelam dados restritos | `meta/` conta issues invisíveis | `meta/` calcula só sobre o conjunto acessível |
| Cache cross-user | Cache de `meta/` partilhado entre users com permissões diferentes | Chave de cache inclui user (ou conjunto de projetos acessíveis) |

## Regra de ouro

```python
project_ids = accessible_board_project_ids(request.user, board)
# TODAS as queries (issues, meta, timeline, calendar) partem deste conjunto.
# Nada no hub do board pode ler fora dele.
```

- `accessible_board_project_ids` combina: projetos do board ∩ projetos visíveis
  ao utilizador (membership + visibilidade pública/privada).

## RBAC

- Ler o hub: `MEMBER`; o conteúdo é recortado por projeto acessível.
- Config de vistas/WIP/swimlane: `ROLE.ADMIN` ou board-admin
  (`BoardRolePermission` chave `board.configure`).
- Saved views partilhadas: `view.manage_shared`.

## Validação

- `group_by`, `swimlane_by`, `zoom`, `layout` validados contra enums.
- `wip_limits` valida que `state_id` pertence aos estados dos projetos do board.

## Performance como segurança (anti-DoS)

- `meta/`/`timeline/` com throttle e cache curto; paginação obrigatória nas
  issues.
- Evitar N+1: `select_related`/`prefetch_related` no queryset agregado.

## Auditoria

- Alterações de `BoardViewConfig` registam ator (audit do `BaseModel`).
- Não há escrita de issues neste hub (é leitura + config), reduzindo superfície.
