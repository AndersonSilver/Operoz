# Deploy automático com GitHub Actions

Workflow: [`.github/workflows/deploy-operis.yml`](../.github/workflows/deploy-operis.yml)  
Scripts VPS: [`.github/scripts/`](../.github/scripts/)

## O que faz

1. **Push na branch `preview`** (ou execução manual):
   - Compila `apps/web/Dockerfile.web` no runner do GitHub (com `VITE_ENABLE_BOARDS=true`).
   - Publica em `ghcr.io/<owner>/operis/plane-frontend:preview` e `:sha`.
2. **SSH no VPS**:
   - `git pull` do repo em `OPERIS_REPO_PATH`.
   - `docker pull` da imagem no GHCR.
   - `docker tag` → `myoperis/plane-frontend:stable` (compatível com o `plane-app` atual).
   - `docker compose up -d --force-recreate web`.
3. **MCP** (mesmo workflow):
   - Build `operis-mcp` → GHCR.
   - `vps-deploy-mcp.sh` sobe `deployments/mcp/docker-compose.yml`.
   - Guia NPM + Cursor: [deploy-mcp-vps.md](./deploy-mcp-vps.md).

Build no GitHub evita 20–40 min de CPU no VPS a cada deploy.

## Configuração única

### Secrets (Settings → Secrets and variables → Actions)

| Secret        | Exemplo                       |
| ------------- | ----------------------------- |
| `VPS_HOST`    | `72.61.51.247`                |
| `VPS_USER`    | `root`                        |
| `VPS_SSH_KEY` | conteúdo da chave privada SSH |

### Variables (opcional)

| Variable           | Default                           |
| ------------------ | --------------------------------- |
| `OPERIS_WEB_URL`   | `https://operis.webcycle.com.br`  |
| `OPERIS_REPO_PATH` | `/root/operis-selfhost/Operis`    |
| `OPERIS_APP_PATH`  | `/root/operis-selfhost/plane-app` |

### Repositório GHCR

- Pacote: **Packages** no GitHub → `operis/plane-frontend`.
- Repo **privado**: o `GITHUB_TOKEN` do workflow já autentica o pull no VPS via script.
- Primeira execução: em **Settings → Actions → General**, permitir read/write para workflows.

### VPS

- Docker e docker compose instalados.
- `operis.env` com `DOCKERHUB_USER=myoperis`, `APP_RELEASE=stable`, `PULL_POLICY=never`.
- Clone do repo em `OPERIS_REPO_PATH` (mesmo branch `preview`).

## Execução manual

**Actions → Deploy Operis → Run workflow**

| Input        | Uso                                                          |
| ------------ | ------------------------------------------------------------ |
| `web`        | Só frontend (padrão no push)                                 |
| `mcp`        | Só MCP HTTP (porta 3100)                                     |
| `full`       | Build + deploy api, space, admin, live, proxy (demora muito) |
| `skip_build` | Só puxa `:preview` já publicada e recria contentores         |

## Deploy só no VPS (sem Actions)

```bash
cd ~/operis-selfhost/Operis
git pull origin preview
docker build --no-cache -f apps/web/Dockerfile.web \
  --build-arg VITE_ENABLE_BOARDS=true \
  --build-arg VITE_API_BASE_URL=https://operis.webcycle.com.br \
  -t myoperis/plane-frontend:local .
docker tag myoperis/plane-frontend:local myoperis/plane-frontend:stable
cd ~/operis-selfhost/plane-app
docker compose --env-file operis.env up -d --no-deps --pull never --force-recreate web
```

## Troubleshooting

| Problema                                       | Solução                                                                                                                                            |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pull access denied` no VPS                    | Verificar login GHCR no script; repo privado precisa do token do workflow                                                                          |
| Compose pede `:stable` inexistente             | Script faz `docker tag` para `stable`; confirmar `operis.env`                                                                                      |
| Boards não aparecem                            | Imagem antiga; verificar tag do contentor `docker ps`                                                                                              |
| CRON de automação não dispara / e-mail não sai | Confirmar serviços `automation-worker`, `automation-email-worker` e `beat-worker` no compose; ver [automation-workers.md](./automation-workers.md) |
| Filas `automation` / `assistant` acumuladas    | `python manage.py check_celery_queues --alert-threshold 50`; subir workers em falta; purgar filas stale no RabbitMQ se necessário                  |

### Workers de automação no VPS (self-host)

O template `deployments/cli/community/docker-compose.yml` inclui:

- `beat-worker` — agenda CRON (`dispatch_scheduled_automation_rules` a cada minuto)
- `automation-worker` — fila `automation` (execução de regras)
- `automation-email-worker` — fila `automation_email` (SMTP)
- `assistant-worker` — fila `assistant` (indexação RAG)

Após atualizar o compose no VPS (`plane-app`):

```bash
cd ~/operis-selfhost/plane-app
# Copiar/sync do repo ou aplicar diff manualmente
docker compose --env-file operis.env up -d beat-worker automation-worker automation-email-worker assistant-worker
docker compose --env-file operis.env exec api python manage.py check_celery_queues --alert-threshold 50
```

Deploy **full** (`[deploy-full]` ou workflow `full`) garante imagem `plane-backend` com os entrypoints `docker-entrypoint-automation-*.sh`.
