# Deploy do MCP na VPS (Operoz)

Servidor HTTP MCP para Cursor em equipa, sem clone do monorepo.

## Arquitetura

```text
Cursor  →  https://mcp.seudominio.com/mcp  →  operoz-mcp:3100  →  https://operoz.seudominio.com (API)
```

Cada utilizador envia o **token pessoal** do Operoz no header `Authorization: Bearer …` (não vai no `.env` do servidor).

## Ficheiros no repositório

| Ficheiro                                           | Função                                                  |
| -------------------------------------------------- | ------------------------------------------------------- |
| `mcp-server/Dockerfile`                            | Imagem `operoz-mcp`                                     |
| `deployments/mcp/docker-compose.yml`               | Stack isolada (recomendado com NPM)                     |
| `deployments/mcp/operoz-mcp.env.example`           | Variáveis da VPS                                        |
| `deployments/cli/community/docker-compose.mcp.yml` | Overlay no `plane-app` (rede interna `http://api:8000`) |
| `.github/scripts/vps-deploy-mcp.sh`                | Deploy automático (Actions)                             |

## 1. Configuração única na VPS

```bash
cd ~/operoz-selfhost/Operoz
git pull origin preview

cp deployments/mcp/operoz-mcp.env.example deployments/mcp/operoz-mcp.env
nano deployments/mcp/operoz-mcp.env
```

Ajuste:

```env
OPEROZ_API_BASE_URL=https://operoz.webcycle.com.br
MCP_ALLOWED_HOSTS=mcp.operoz.webcycle.com.br
MCP_PUBLISH=127.0.0.1:3100
MCP_IMAGE=myoperoz/operoz-mcp:stable
```

## 2. Deploy manual (primeira vez ou sem Actions)

```bash
cd ~/operoz-selfhost/Operoz/mcp-server
docker build -t myoperoz/operoz-mcp:local .

cd ~/operoz-selfhost/Operoz
docker compose -f deployments/mcp/docker-compose.yml \
  --env-file deployments/mcp/operoz-mcp.env up -d

curl -sS http://127.0.0.1:3100/health
```

Resposta esperada: `{"ok":true,"service":"operoz-mcp","operoz":"https://..."}`

## 3. Nginx Proxy Manager (no seu VPS)

1. DNS: `mcp.operoz.webcycle.com.br` → IP da VPS.
2. **Hosts → Proxy Hosts → Add**:
   - Domain: `mcp.operoz.webcycle.com.br`
   - Forward: `http://172.17.0.1:3100` (gateway Docker no Linux) ou `http://<IP-da-VPS>:3100` se `MCP_PUBLISH=0.0.0.0:3100`
   - SSL: Let's Encrypt
3. **Websockets**: ativado (recomendado para MCP HTTP).

Teste:

```bash
curl -sS https://mcp.operoz.webcycle.com.br/health
```

## 4. Cursor (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "operoz": {
      "url": "https://mcp.operoz.webcycle.com.br/mcp",
      "headers": {
        "Authorization": "Bearer SEU_TOKEN_API_OPEROZ"
      }
    }
  }
}
```

Token: Operoz → **Definições** / God mode → **API tokens**.

Se o Agent do Cursor falhar com URL direta, workaround:

```json
{
  "mcpServers": {
    "operoz": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.operoz.webcycle.com.br/mcp"],
      "env": {
        "MCP_REMOTE_HEADERS": "{\"Authorization\":\"Bearer SEU_TOKEN\"}"
      }
    }
  }
}
```

## 5. GitHub Actions

Em cada push na `preview` (ou workflow **Deploy Operoz** com alvo `web` ou `mcp`):

1. Build `ghcr.io/<owner>/operoz/operoz-mcp:preview`
2. SSH → `vps-deploy-mcp.sh`

Variable opcional: `OPEROZ_MCP_ENV` = caminho absoluto do `operoz-mcp.env` na VPS.

## Troubleshooting

| Problema                     | Solução                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------- |
| NPM 502 / connection refused | `MCP_PUBLISH=0.0.0.0:3100`; `docker logs operoz-mcp`; `ss -tlnp \| grep 3100`     |
| `401` no Cursor              | Token em falta ou inválido no header                                              |
| `Invalid Host`               | `MCP_ALLOWED_HOSTS` deve incluir o domínio do proxy                               |
| Health OK mas `/mcp` falha   | Websockets no NPM; testar `mcp-remote`                                            |
| Boards no MCP                | API app ainda exige sessão — ver [operoz-mcp-empresa.md](./operoz-mcp-empresa.md) |

Ver também: [deploy-github-actions.md](./deploy-github-actions.md), [operoz-mcp-empresa.md](./operoz-mcp-empresa.md).
