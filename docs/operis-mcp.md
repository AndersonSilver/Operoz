# Operis — Servidor MCP

O pacote `mcp-server/` expõe o Operis a agentes de IA (Cursor, Claude Desktop, etc.) via [Model Context Protocol](https://modelcontextprotocol.io).

## Localização

`/Operis/mcp-server/` (relativo à raiz do monorepo).

## Perfil de ferramentas (Cursor)

Por defeito o MCP usa **`OPERIS_MCP_PROFILE=agent`** — **7 tools** expostas, registo interno com **676 operações**:

| Tool                                               | Função                                              |
| -------------------------------------------------- | --------------------------------------------------- |
| `operis_discover`                                  | Encontra operações por intenção (`query`, `domain`) |
| `operis_execute`                                   | Executa pelo `name` devolvido pelo discover         |
| `operis_get_capabilities`                          | Mapa de domínios                                    |
| `operis_sign_in`                                   | Sessão para API app                                 |
| `operis_api_v1_request` / `operis_api_app_request` | Escape hatch genérico                               |
| `operis_get_openapi_schema`                        | Schema OpenAPI                                      |

Fluxo: `operis_discover` → `operis_execute`. Perfil `full` (`OPERIS_MCP_PROFILE=full`) expõe 1 tool por endpoint (legado/debug).

## Cobertura funcional

**676 operações** no registo (`mcp-server/src/tools/registry/`) — cobertura completa das APIs **v1** e **app** (todos os métodos por rota).

| Domínio                                       | Exemplos                                                | API      |
| --------------------------------------------- | ------------------------------------------------------- | -------- |
| Work items / issues                           | CRUD, comentários, links, anexos, bulk, intake, inbox   | v1 + app |
| **Boards**                                    | CRUD, status reports, roles, custom fields, Cliente 360 | app      |
| **Automação / playbooks**                     | Regras, packs, hooks, runs, secrets, scripts, templates | app      |
| **Assistente Operoz**                         | Sessões, chat SSE, feedback, qualidade, usage           | app      |
| **Pages (PRD/docs)**                          | CRUD, descrição, versões, lock, duplicate               | app      |
| Projetos                                      | CRUD, status reports, deploy boards, custom fields      | v1 + app |
| Workspaces                                    | CRUD, convites, favoritos, rascunhos, quick links       | app      |
| Ciclos, módulos, estados, labels, estimativas | CRUD + relações                                         | v1 + app |
| Webhooks, views, analytics, search            | CRUD / export                                           | app      |
| Assets                                        | v1 + v2 upload/download                                 | v1 + app |
| Notificações, utilizadores, API tokens        | —                                                       | app      |
| Jira Ops, assistente IA legado                | sync, preview, ai-assistant                             | app      |
| Stickies, convites, membros                   | —                                                       | v1 + app |

Use `operis_discover` com `query` e `domain` (ex.: `"list pages"`, `"boards"`) para encontrar a operação correcta antes de `operis_execute`.

## Assistente Operoz vs MCP externo

Dois caminhos complementares — o MCP expõe as rotas REST; o chat in-app usa tools curadas com RAG.

| Aspeto         | MCP externo (`mcp-server/`)     | Assistente Operoz (in-app)         |
| -------------- | ------------------------------- | ---------------------------------- |
| **Utilizador** | Agente (Cursor, Claude Desktop) | Humano no produto Operoz           |
| **Tools**      | 7 expostas (agent) / 676 (full) | ~17 curadas (registry interno)     |
| **Auth**       | Token / sessão conforme rota    | Sessão workspace + permission gate |
| **Writes**     | Diretos na API                  | Propostas com confirmação humana   |
| **RAG**        | Não (agente chama search)       | Híbrido FTS + pgvector integrado   |

### Tools do assistente interno (referência)

Expandidas na Fase 5 — ver [assistant-api-reference.md](./assistant-api-reference.md#tools-internas-llm):

- **Leitura:** `search_issues`, `get_issue`, `search_pages`, `get_page_content`, `get_client_360_summary`, `get_automation_metrics`, `get_automation_run`, `list_intake_pending`, `get_project_stats`, `list_board_projects`, `explain_automation_run`, `list_automation_packs`
- **Propostas (confirm no UI):** `propose_automation_rule`, `propose_automation_pack_install`, `propose_issue_comment`, `propose_issue_state_change`

### Quando usar cada um

- **Cursor / CI / integrações:** MCP perfil `agent` (`operis_discover` → `operis_execute`)
- **Equipa no Operoz:** chat nativo + automação `action.mcp_call` para casos que precisem de rota MCP específica
- **Documentação:** [assistant-user-guide.md](./assistant-user-guide.md), [assistant-adrs.md](./assistant-adrs.md) (ADR-003)

### Endpoints REST do assistente (também no MCP)

Prefixo `/api/workspaces/{slug}/assistant/` — sessões, chat SSE, feedback, qualidade. Domínio MCP: `assistant`. Ver [openapi/assistant.yaml](./openapi/assistant.yaml).

## Limitações

- API **app** (boards, páginas, …) exige **sessão**; API **v1** exige **token**.
- Upload binário de assets pode precisar de `operis_api_*_request` com corpo adequado.
- O Cursor limita ~40 tools entre todos os MCP servers; o perfil `agent` (default) evita esse problema.

## Implantação empresarial (muitos utilizadores Cursor)

Ver [operis-mcp-empresa.md](./operis-mcp-empresa.md) — MCP centralizado, token por pessoa, sem clone do repositório.

Deploy na VPS (Docker + NPM + Actions): [deploy-mcp-vps.md](./deploy-mcp-vps.md).

## Documentação de instalação

Ver [mcp-server/README.md](../mcp-server/README.md).
