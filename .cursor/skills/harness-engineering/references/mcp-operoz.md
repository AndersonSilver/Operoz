# Referência MCP — Operoz

Servidor: `Operis/mcp-server/` · Docs: `Operis/docs/operis-mcp.md`

## Autenticação

| Superfície     | Auth                                                | Uso                                |
| -------------- | --------------------------------------------------- | ---------------------------------- |
| `/api/v1/*`    | `OPERIS_API_KEY` (`X-Api-Key`)                      | CRUD v1, work items por identifier |
| `/api/*` (app) | Sessão (`operis_sign_in` ou cookie)                 | Boards, módulos app, issues app    |
| Meta           | `operis_get_capabilities`, `operis_list_operations` | Descoberta                         |

## Ferramentas meta

```text
operis_get_capabilities     → domínios e contagens
operis_list_operations      → filtrar domain=modules|work_items|projects
operis_sign_in              → email/senha → sessão app
operis_api_app_request      → escape hatch GET/PATCH /api/...
operis_api_v1_request       → escape hatch /api/v1/...
```

## Backlog OPEROZDP

### Ler estado

1. `operis_list_modules_app` — `workspace_slug=operoz`, `project_id` do OPEROZDP
2. Issues com prefixo `[ OPEROZ ]`
3. Ou Django shell no container `api` (ver `mark_operoz_cards_done.py`)

### Marcar lote Done (dev)

`Operis/apps/api/operis/db/management/commands/mark_operoz_cards_done.py` →

```bash
docker compose -f Operis/docker-compose-local.yml exec api \
  python manage.py mark_operoz_cards_done --workspace operoz
```

### Card individual (MCP)

`operis_list_states_app` → `operis_update_issue_app` com `state_id` Done.

## Domínios por tarefa

| Tarefa  | domain       | Ferramentas                                           |
| ------- | ------------ | ----------------------------------------------------- |
| Cards   | `work_items` | `operis_update_issue_app`                             |
| Módulos | `modules`    | `operis_list_modules_app`, `operis_update_module_app` |
| Estados | `states`     | `operis_list_states_app`                              |

~379 tools — usar `operis_list_operations` + `domain` para focar.

## Equipa (Operoz hospedado)

MCP centralizado: ver `.cursor/mcp.json.enterprise.example` e `Operis/docs/operis-mcp-empresa.md`.  
Cada pessoa: token pessoal em `~/.cursor/mcp.json` — **sem** clone do monorepo para uso básico.
