# Deploy do MCP na VPS (Operis)

Servidor HTTP MCP para Cursor em equipa, sem clone do monorepo.

## Arquitetura

```text
Cursor  →  https://mcp.seudominio.com/mcp  →  operis-mcp:3100  →  https://operis.seudominio.com (API)
```

Cada utilizador envia o **token pessoal** do Operis no header `Authorization: Bearer …` (não vai no `.env` do servidor).

## Ficheiros no repositório

| Ficheiro                                           | Função                                                  |
| -------------------------------------------------- | ------------------------------------------------------- |
| `mcp-server/Dockerfile`                            | Imagem `operis-mcp`                                     |
| `deployments/mcp/docker-compose.yml`               | Stack isolada (recomendado com NPM)                     |
| `deployments/mcp/operis-mcp.env.example`           | Variáveis da VPS                                        |
| `deployments/cli/community/docker-compose.mcp.yml` | Overlay no `plane-app` (rede interna `http://api:8000`) |
| `.github/scripts/vps-deploy-mcp.sh`                | Deploy automático (Actions)                             |

## 1. Configuração única na VPS

```bash
cd ~/operis-selfhost/Operis
git pull origin preview

cp deployments/mcp/operis-mcp.env.example deployments/mcp/operis-mcp.env
nano deployments/mcp/operis-mcp.env
```

Ajuste:

```env
OPERIS_API_BASE_URL=https://operis.webcycle.com.br
MCP_ALLOWED_HOSTS=mcp.operis.webcycle.com.br
MCP_PUBLISH=127.0.0.1:3100
MCP_IMAGE=myoperis/operis-mcp:stable
```

## 2. Deploy manual (primeira vez ou sem Actions)

```bash
cd ~/operis-selfhost/Operis/mcp-server
docker build -t myoperis/operis-mcp:local .

cd ~/operis-selfhost/Operis
docker compose -f deployments/mcp/docker-compose.yml \
  --env-file deployments/mcp/operis-mcp.env up -d

curl -sS http://127.0.0.1:3100/health
```

Resposta esperada: `{"ok":true,"service":"operis-mcp","operis":"https://..."}`

## 3. Nginx Proxy Manager (no seu VPS)

1. DNS: `mcp.operis.webcycle.com.br` → IP da VPS.
2. **Hosts → Proxy Hosts → Add**:
   - Domain: `mcp.operis.webcycle.com.br`
   - Forward: `http://172.17.0.1:3100` (gateway Docker no Linux) ou `http://<IP-da-VPS>:3100` se `MCP_PUBLISH=0.0.0.0:3100`
   - SSL: Let's Encrypt
3. **Websockets**: ativado (recomendado para MCP HTTP).

Teste:

```bash
curl -sS https://mcp.operis.webcycle.com.br/health
```

## 4. Cursor (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "operis": {
      "url": "https://mcp.operis.webcycle.com.br/mcp",
      "headers": {
        "Authorization": "Bearer SEU_TOKEN_API_OPERIS"
      }
    }
  }
}
```

Token: Operis → **Definições** / God mode → **API tokens**.

Se o Agent do Cursor falhar com URL direta, workaround:

```json
{
  "mcpServers": {
    "operis": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.operis.webcycle.com.br/mcp"],
      "env": {
        "MCP_REMOTE_HEADERS": "{\"Authorization\":\"Bearer SEU_TOKEN\"}"
      }
    }
  }
}
```

## 5. GitHub Actions

Em cada push na `preview` (ou workflow **Deploy Operis** com alvo `web` ou `mcp`):

1. Build `ghcr.io/<owner>/operis/operis-mcp:preview`
2. SSH → `vps-deploy-mcp.sh`

Variable opcional: `OPERIS_MCP_ENV` = caminho absoluto do `operis-mcp.env` na VPS.

## Troubleshooting

| Problema                   | Solução                                                                           |
| -------------------------- | --------------------------------------------------------------------------------- |
| NPM não alcança o MCP      | Use `172.17.0.1:3100` ou publique `0.0.0.0:3100`                                  |
| `401` no Cursor            | Token em falta ou inválido no header                                              |
| `Invalid Host`             | `MCP_ALLOWED_HOSTS` deve incluir o domínio do proxy                               |
| Health OK mas `/mcp` falha | Websockets no NPM; testar `mcp-remote`                                            |
| Boards no MCP              | API app ainda exige sessão — ver [operis-mcp-empresa.md](./operis-mcp-empresa.md) |

Ver também: [deploy-github-actions.md](./deploy-github-actions.md), [operis-mcp-empresa.md](./operis-mcp-empresa.md).
