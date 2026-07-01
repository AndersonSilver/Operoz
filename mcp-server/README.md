# Operoz MCP Server

Servidor [MCP](https://modelcontextprotocol.io) para o **Operoz** — expõe workspaces, projetos, work items, boards, Cliente 360, ciclos, módulos, membros e mais.

## Autenticação

| Superfície    | Prefixo           | Auth                                                 |
| ------------- | ----------------- | ---------------------------------------------------- |
| API v1        | `/api/v1/`        | `OPEROZ_API_KEY` (header `X-Api-Key`)                |
| API app (web) | `/api/`           | Sessão (`operoz_sign_in` ou `OPEROZ_SESSION_COOKIE`) |
| Instância     | `/api/instances/` | Público (setup)                                      |

**Boards e Cliente 360** usam a API **app** → precisas de sessão ou `operoz_sign_in`.

## Instalação

```bash
cd mcp-server
cp .env.example .env
# Edita OPEROZ_API_BASE_URL e OPEROZ_API_KEY

npm install
npm run build
```

## Configurar no Cursor

Em **Cursor Settings → MCP** (ou `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "operoz": {
      "command": "node",
      "args": ["/caminho/absoluto/para/Operoz/Operoz/mcp-server/dist/index.js"],
      "env": {
        "OPEROZ_API_BASE_URL": "http://localhost:8000",
        "OPEROZ_API_KEY": "seu-token-aqui",
        "OPEROZ_MCP_PROFILE": "agent"
      }
    }
  }
}
```

Reinicia o Cursor após guardar.

### Obter API key

1. Sobe o Operoz (`docker compose` + `pnpm dev`).
2. Entra em http://localhost:3000 → **Definições** → **API tokens** (ou God mode).
3. Cria um token e cola em `OPEROZ_API_KEY`.

## Ferramentas

### Perfil `agent` (default — Cursor)

**7 tools** expostas; cobertura total via discover → execute:

| Tool                            | Função                                                         |
| ------------------------------- | -------------------------------------------------------------- |
| **`operoz_discover`**           | Encontra operações por intenção (`query`, `domain`, `surface`) |
| **`operoz_execute`**            | Executa operação pelo `name` devolvido pelo discover           |
| **`operoz_get_capabilities`**   | Mapa de domínios e contagens                                   |
| **`operoz_sign_in`**            | Sessão para API app (boards, web)                              |
| **`operoz_api_v1_request`**     | Escape hatch `/api/v1/*`                                       |
| **`operoz_api_app_request`**    | Escape hatch `/api/*`                                          |
| **`operoz_get_openapi_schema`** | Schema OpenAPI                                                 |

Fluxo típico no Agent:

1. `operoz_discover` — `{ "query": "list work items", "domain": "work_items" }`
2. `operoz_execute` — `{ "operation": "operoz_…", "workspace_slug": "…", … }`

Configure `OPEROZ_MCP_PROFILE=agent` no `.env` ou no `mcp.json` (default se omitido).

### Perfil `full` (legado / debug)

`OPEROZ_MCP_PROFILE=full` expõe **676** ferramentas (1 por endpoint HTTP). Útil fora do Cursor ou para testes; no Agent do Cursor prefira `agent` (limite ~40 tools entre todos os MCP servers).

Domínios no registo interno: `work_items`, `boards`, `automation`, `playbooks`, `assistant`, `pages`, `projects`, `workspaces`, `cycles`, `modules`, `states`, `labels`, `estimates`, `webhooks`, `views`, `analytics`, `assets`, `notifications`, `intake`, `members`, `invitations`, `stickies`, `ai`, `jira`, …

## Servidor HTTP (equipa sem clone)

### Docker (VPS / produção)

```bash
cd deployments/mcp
cp operoz-mcp.env.example operoz-mcp.env
# Edite OPEROZ_API_BASE_URL e MCP_ALLOWED_HOSTS

docker compose --env-file operoz-mcp.env up -d
curl -sS http://127.0.0.1:3100/health
```

Guia completo (NPM, GitHub Actions, Cursor): **[docs/deploy-mcp-vps.md](../docs/deploy-mcp-vps.md)**

### Local (desenvolvimento)

```bash
export OPEROZ_API_BASE_URL=https://operoz.sua-empresa.com
export MCP_HTTP_HOST=0.0.0.0
export MCP_HTTP_PORT=3100
export MCP_ALLOWED_HOSTS=mcp.sua-empresa.com

npm run build
npm run start:http
```

Cada utilizador no `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "operoz": {
      "url": "https://mcp.sua-empresa.com/mcp",
      "headers": {
        "Authorization": "Bearer TOKEN_PESSOAL"
      }
    }
  }
}
```

Guia completo: [docs/operoz-mcp-empresa.md](../docs/operoz-mcp-empresa.md)

## Desenvolvimento

```bash
npm run dev
npm run dev:http
```

## Empresa (~150 utilizadores Cursor, sem clone)

Para equipas que **só** usam Operoz hospedado + Cursor (cards, boards, PRD, status report), lê o guia completo:

**[docs/operoz-mcp-empresa.md](../docs/operoz-mcp-empresa.md)**

Resumo: hospeda **Operoz** + **MCP centralizado** (`https://mcp.sua-empresa.com`); cada pessoa põe o **token pessoal** no `~/.cursor/mcp.json`. O monorepo fica só na infra — não nos portáteis.

Modelo de config: [.cursor/mcp.json.enterprise.example](../.cursor/mcp.json.enterprise.example)

## Mesmo repositório quando o Operoz estiver hospedado?

**Sim.** O `mcp-server/` pode (e deve) continuar neste monorepo — no Git, no clone e nos releases.

O que muda é **onde cada peça corre**, não o repositório:

| Componente                 | Onde hospeda                                      | No mesmo repo?                |
| -------------------------- | ------------------------------------------------- | ----------------------------- |
| API, web, workers (Operoz) | Servidor / Docker / K8s                           | Sim (`apps/`, `packages/`)    |
| **MCP** (`mcp-server/`)    | Normalmente **máquina do dev** (Cursor via stdio) | Sim (código versionado junto) |

Fluxo típico em produção:

1. Operoz hospedado em `https://operoz.sua-empresa.com` (API + frontend).
2. Desenvolvedor clona o **mesmo** repositório, faz `npm run build` em `mcp-server/`.
3. No Cursor, `OPEROZ_API_BASE_URL` aponta para a URL **hospedada** (não `localhost`).

```json
"env": {
  "OPEROZ_API_BASE_URL": "https://operoz.sua-empresa.com",
  "OPEROZ_API_KEY": "token-de-producao-ou-staging"
}
```

O MCP **não precisa** ir no mesmo container que a API Django. Ele só faz HTTP para a API — como um cliente externo. Por isso:

- Não entra na imagem Docker `operoz-api` por defeito.
- Não precisa de `pnpm dev` no servidor de produção.
- Podes publicar o repo inteiro; quem usa Cursor instala/builda só `mcp-server/` localmente.

Se no futuro quiseres MCP **remoto** (equipa sem clone local), aí sim seria outro deploy (MCP over HTTP/SSE) — ainda assim o código pode ficar neste repositório, só muda o `command`/hosting no `mcp.json`.

## Licença

AGPL-3.0 — mesmo monorepo Operoz.
