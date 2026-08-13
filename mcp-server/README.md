# Operoz MCP Server

Servidor [MCP](https://modelcontextprotocol.io) para o **Operoz** — expõe workspaces, projetos, work items, boards, Cliente 360, ciclos, módulos, membros e mais.

## Autenticação

| Superfície    | Prefixo           | Auth                                                      |
| ------------- | ----------------- | --------------------------------------------------------- |
| API v1        | `/api/v1/`        | `OPEROZ_API_KEY` (header `X-Api-Key`)                     |
| API app (web) | `/api/`           | `OPEROZ_API_KEY` (header `X-Api-Key`) — mesmo token da v1 |
| Instância     | `/api/instances/` | Público (setup)                                           |

**Boards e Cliente 360** usam a API **app**, mas já aceitam o mesmo `OPEROZ_API_KEY` — não é preciso sessão.
Sessão (`operoz_sign_in` ou `OPEROZ_SESSION_COOKIE`) continua a funcionar como alternativa legada, caso prefiras autenticar por email/senha em vez de token.

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

`OPEROZ_MCP_PROFILE=full` expõe **670** ferramentas (1 por endpoint HTTP). Útil fora do Cursor ou para testes; no Agent do Cursor prefira `agent` (limite ~40 tools entre todos os MCP servers).

Domínios no registo interno: `work_items`, `boards`, `automation`, `playbooks`, `assistant`, `pages`, `projects`, `workspaces`, `cycles`, `modules`, `states`, `labels`, `estimates`, `webhooks`, `views`, `analytics`, `assets`, `notifications`, `intake`, `members`, `invitations`, `stickies`, `ai`, `jira`, `users`, `search`, `misc`, `instance`.

Cada domínio vive no seu próprio arquivo em `src/tools/registry/app-<domínio>.ts` (ex.: `app-boards.ts`, `app-automation.ts`, `app-assistant.ts`) — nenhum arquivo concentra mais que ~15% do registro total, o que facilita achar/manter o endpoint certo sem cair numa gaveta de miscelânea.

## Servidor HTTP (equipa sem clone)

### Docker (VPS / produção)

```bash
cd deployments/mcp
cp operoz-mcp.env.example operoz-mcp.env
# Edite OPEROZ_API_BASE_URL e MCP_ALLOWED_HOSTS

docker compose --env-file operoz-mcp.env up -d
curl -sS http://127.0.0.1:3100/health
```

Compose e variáveis: **[deployments/mcp/](../deployments/mcp/)** (produção) e
**[deployments/mcp-hml/](../deployments/mcp-hml/)** (homologação — validar aqui primeiro).

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

Modelo de config: [.cursor/mcp.json.enterprise.example](../.cursor/mcp.json.enterprise.example)

## Conectores (Claude Desktop / claude.ai)

A tela de **Conectores** do Claude Desktop e do claude.ai só sabe adicionar servidores
MCP remotos por **OAuth 2.1** — não existe campo para colar um token estático. Para
isso o servidor HTTP suporta OAuth 2.1 completo (descoberta RFC 9728, PKCE, Dynamic
Client Registration RFC 7591), com o login e o consentimento hospedados no **próprio
Operoz** (`apps/web`), reaproveitando senha, código único e todos os SSO
("Continuar com Google" incluído). **Nenhuma senha passa pelo `mcp-server`.**

### Como funciona

```
Claude  → GET /authorize          → 302 https://<web>/mcp-authorize/<ticket>
browser → login normal do Operoz (se preciso) → tela de consentimento
        → [Aceitar] → POST <api>/api/users/mcp-connectors/authorize/ (sessão)
                      Django minta o APIToken e entrega ao MCP num POST assinado (HMAC)
        → volta para o Claude com ?code=…&state=…
Claude  → POST /token             → access/refresh token (`ozmcp_at_…` / `ozmcp_rt_…`)
```

O `APIToken` mintado aparece em **Definições → API tokens** com o label
`MCP OAuth · <nome da aplicação>` e pode ser revogado ali a qualquer momento (o
conector para de funcionar em até `MCP_OAUTH_REVALIDATE_INTERVAL` segundos).
O token é **account-wide** — não há seleção de workspace nesta versão.

### Ligar

1. **Confirmar que o reverse proxy encaminha a raiz (`/`)**, não só `/mcp`. É o
   pré-requisito que mais trava rollout: `/.well-known/*`, `/authorize`, `/token`,
   `/register`, `/revoke` e `/oauth/*` vivem fora de `/mcp`.
2. Preencher as variáveis `MCP_OAUTH_*` e `MCP_WEB_CALLBACK_SECRET` no
   `operoz-mcp.env` (ver `deployments/mcp/operoz-mcp.env.example`).
3. Pôr o **mesmo** `MCP_WEB_CALLBACK_SECRET` e o `MCP_WEB_CALLBACK_BASE_URL` do lado
   da API. Em HML é `deployments/hml/docker-compose.yaml`; em **produção é o
   `operoz.env` residente NA VPS** (`OPEROZ_APP_PATH`, default
   `/root/operis-selfhost/plane-app`) — fora deste repositório, edição manual.
4. Buildar o frontend com `VITE_MCP_BASE_URL` apontando para este MCP (é build-time:
   trocar o host depois exige **rebuild**, não só restart).
5. No Claude, adicionar `https://mcp.operoz.io/mcp` como conector personalizado.

Ordem de rollout: **`apps/api` e `apps/web` antes do `mcp-server`**. A página no ar
apontando para um MCP sem `/oauth/pending` degrada para uma tela de erro — o modo de
falha mais barato; o inverso deixa o `/authorize` a redirecionar para uma página 404.

### Compatibilidade

Configs existentes com **token estático continuam a funcionar sem qualquer
alteração**, com ou sem OAuth ligado: `X-Api-Key`, `Authorization: Bearer <token
Operoz>` (incluindo `plane_api_…` pré-rebrand) e `X-Operoz-Session` seguem o caminho
legado intacto. O discriminador é o prefixo dos tokens que **nós** emitimos
(`ozmcp_at_`), por isso nenhum token de terceiros colide com ele.

Sem `MCP_OAUTH_ISSUER_URL`, o OAuth fica desligado e o servidor comporta-se
exatamente como antes.

## Desenvolvimento

```bash
npm run dev
npm run dev:http
```

## Testes

```bash
npm test              # roda a suíte uma vez
npm run test:watch    # modo watch
npm run test:coverage # com relatório de cobertura
```

Cobertura: `OperozClient` (headers, erros, retry-after, sign-in), roteamento de
tools (`operoz_discover`/`operoz_execute`, gating por perfil `agent`/`full`),
`buildPath`/`executeOperation`, e integridade do registry (nomes únicos, path
params consistentes, nenhum domínio virando gaveta de miscelânea).

## Empresa (~150 utilizadores Cursor, sem clone)

Para equipas que **só** usam Operoz hospedado + Cursor (cards, boards, PRD, status report):
hospeda **Operoz** + **MCP centralizado** (`https://mcp.sua-empresa.com`); cada pessoa põe o **token pessoal** no `~/.cursor/mcp.json`. O monorepo fica só na infra — não nos portáteis.

Modelo de config: [.cursor/mcp.json.enterprise.example](../.cursor/mcp.json.enterprise.example)
Compose de referência: [deployments/mcp/](../deployments/mcp/)

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
