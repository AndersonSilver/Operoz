# Operis MCP Server

Servidor [MCP](https://modelcontextprotocol.io) para o **Operis** — expõe workspaces, projetos, work items, boards, Cliente 360, ciclos, módulos, membros e mais.

## Autenticação

| Superfície    | Prefixo           | Auth                                                 |
| ------------- | ----------------- | ---------------------------------------------------- |
| API v1        | `/api/v1/`        | `OPERIS_API_KEY` (header `X-Api-Key`)                |
| API app (web) | `/api/`           | Sessão (`operis_sign_in` ou `OPERIS_SESSION_COOKIE`) |
| Instância     | `/api/instances/` | Público (setup)                                      |

**Boards e Cliente 360** usam a API **app** → precisas de sessão ou `operis_sign_in`.

## Instalação

```bash
cd mcp-server
cp .env.example .env
# Edita OPERIS_API_BASE_URL e OPERIS_API_KEY

npm install
npm run build
```

## Configurar no Cursor

Em **Cursor Settings → MCP** (ou `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "operis": {
      "command": "node",
      "args": ["/caminho/absoluto/para/Operis/Operis/mcp-server/dist/index.js"],
      "env": {
        "OPERIS_API_BASE_URL": "http://localhost:8000",
        "OPERIS_API_KEY": "seu-token-aqui"
      }
    }
  }
}
```

Reinicia o Cursor após guardar.

### Obter API key

1. Sobe o Operis (`docker compose` + `pnpm dev`).
2. Entra em http://localhost:3000 → **Definições** → **API tokens** (ou God mode).
3. Cria um token e cola em `OPERIS_API_KEY`.

## Ferramentas (**671**)

Cobertura completa das APIs **v1** e **app** do Operis (work items, boards, automação, assistente, páginas/PRD, status reports, ciclos, módulos, webhooks, analytics, assets, views, notificações, Jira Ops, IA, etc.).

- **`operis_get_capabilities`** — mapa por domínio e contagens
- **`operis_list_operations`** — lista filtrável (`domain`, `surface`)
- **Escape hatch:** `operis_api_v1_request`, `operis_api_app_request`, `operis_get_openapi_schema`

Domínios principais: `work_items`, `boards`, `automation`, `playbooks`, `assistant`, `pages`, `projects`, `workspaces`, `cycles`, `modules`, `states`, `labels`, `estimates`, `webhooks`, `views`, `analytics`, `assets`, `notifications`, `intake`, `members`, `invitations`, `stickies`, `ai`, `jira`, …

Cada ferramenta mapeia **um endpoint HTTP** (método + path documentado na descrição).

## Servidor HTTP (equipa sem clone)

### Docker (VPS / produção)

```bash
cd deployments/mcp
cp operis-mcp.env.example operis-mcp.env
# Edite OPERIS_API_BASE_URL e MCP_ALLOWED_HOSTS

docker compose --env-file operis-mcp.env up -d
curl -sS http://127.0.0.1:3100/health
```

Guia completo (NPM, GitHub Actions, Cursor): **[docs/deploy-mcp-vps.md](../docs/deploy-mcp-vps.md)**

### Local (desenvolvimento)

```bash
export OPERIS_API_BASE_URL=https://operis.sua-empresa.com
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
    "operis": {
      "url": "https://mcp.sua-empresa.com/mcp",
      "headers": {
        "Authorization": "Bearer TOKEN_PESSOAL"
      }
    }
  }
}
```

Guia completo: [docs/operis-mcp-empresa.md](../docs/operis-mcp-empresa.md)

## Desenvolvimento

```bash
npm run dev
npm run dev:http
```

## Empresa (~150 utilizadores Cursor, sem clone)

Para equipas que **só** usam Operis hospedado + Cursor (cards, boards, PRD, status report), lê o guia completo:

**[docs/operis-mcp-empresa.md](../docs/operis-mcp-empresa.md)**

Resumo: hospeda **Operis** + **MCP centralizado** (`https://mcp.sua-empresa.com`); cada pessoa põe o **token pessoal** no `~/.cursor/mcp.json`. O monorepo fica só na infra — não nos portáteis.

Modelo de config: [.cursor/mcp.json.enterprise.example](../.cursor/mcp.json.enterprise.example)

## Mesmo repositório quando o Operis estiver hospedado?

**Sim.** O `mcp-server/` pode (e deve) continuar neste monorepo — no Git, no clone e nos releases.

O que muda é **onde cada peça corre**, não o repositório:

| Componente                 | Onde hospeda                                      | No mesmo repo?                |
| -------------------------- | ------------------------------------------------- | ----------------------------- |
| API, web, workers (Operis) | Servidor / Docker / K8s                           | Sim (`apps/`, `packages/`)    |
| **MCP** (`mcp-server/`)    | Normalmente **máquina do dev** (Cursor via stdio) | Sim (código versionado junto) |

Fluxo típico em produção:

1. Operis hospedado em `https://operis.sua-empresa.com` (API + frontend).
2. Desenvolvedor clona o **mesmo** repositório, faz `npm run build` em `mcp-server/`.
3. No Cursor, `OPERIS_API_BASE_URL` aponta para a URL **hospedada** (não `localhost`).

```json
"env": {
  "OPERIS_API_BASE_URL": "https://operis.sua-empresa.com",
  "OPERIS_API_KEY": "token-de-producao-ou-staging"
}
```

O MCP **não precisa** ir no mesmo container que a API Django. Ele só faz HTTP para a API — como um cliente externo. Por isso:

- Não entra na imagem Docker `operis-api` por defeito.
- Não precisa de `pnpm dev` no servidor de produção.
- Podes publicar o repo inteiro; quem usa Cursor instala/builda só `mcp-server/` localmente.

Se no futuro quiseres MCP **remoto** (equipa sem clone local), aí sim seria outro deploy (MCP over HTTP/SSE) — ainda assim o código pode ficar neste repositório, só muda o `command`/hosting no `mcp.json`.

## Licença

AGPL-3.0 — mesmo monorepo Operis.
