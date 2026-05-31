# Operis — Servidor MCP

O pacote `mcp-server/` expõe o Operis a agentes de IA (Cursor, Claude Desktop, etc.) via [Model Context Protocol](https://modelcontextprotocol.io).

## Localização

`/Operis/mcp-server/` (relativo à raiz do monorepo).

## Cobertura funcional

**379 ferramentas** geradas a partir do registo em `mcp-server/src/tools/registry/` — uma por rota HTTP (v1 + app).

| Domínio                                       | Exemplos                                                | API      |
| --------------------------------------------- | ------------------------------------------------------- | -------- |
| Work items / issues                           | CRUD, comentários, links, anexos, bulk, intake, inbox   | v1 + app |
| **Boards**                                    | CRUD, status reports, roles, custom fields, Cliente 360 | app      |
| **Pages (PRD/docs)**                          | CRUD, descrição, versões, lock, duplicate               | app      |
| Projetos                                      | CRUD, status reports, deploy boards, custom fields      | v1 + app |
| Workspaces                                    | CRUD, convites, favoritos, rascunhos, quick links       | app      |
| Ciclos, módulos, estados, labels, estimativas | CRUD + relações                                         | v1 + app |
| Webhooks, views, analytics, search            | CRUD / export                                           | app      |
| Assets                                        | v1 + v2 upload/download                                 | v1 + app |
| Notificações, utilizadores, API tokens        | —                                                       | app      |
| Jira Ops, assistente IA                       | sync, preview, ai-assistant                             | app      |
| Stickies, convites, membros                   | —                                                       | v1 + app |

Use `operis_list_operations` com `domain: "pages"` (ou `boards`, etc.) para listar só esse grupo.

## Limitações

- API **app** (boards, páginas, …) exige **sessão**; API **v1** exige **token**.
- Upload binário de assets pode precisar de `operis_api_*_request` com corpo adequado.
- O Cursor pode demorar a carregar centenas de tools; use `operis_list_operations` + domínio se precisar de foco.

## Implantação empresarial (muitos utilizadores Cursor)

Ver [operis-mcp-empresa.md](./operis-mcp-empresa.md) — MCP centralizado, token por pessoa, sem clone do repositório.

Deploy na VPS (Docker + NPM + Actions): [deploy-mcp-vps.md](./deploy-mcp-vps.md).

## Documentação de instalação

Ver [mcp-server/README.md](../mcp-server/README.md).
