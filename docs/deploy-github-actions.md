# Deploy automático com GitHub Actions

Workflow: [`.github/workflows/deploy-operis.yml`](../.github/workflows/deploy-operis.yml)  
Scripts VPS: [`.github/scripts/`](../.github/scripts/)

## O que faz

### Deploy `web` (push na `preview` ou manual)

1. Build `plane-frontend` no GitHub com `VITE_API_BASE_URL` = `OPERIS_WEB_URL`.
2. SSH no VPS → pull imagem GHCR → sync `operis.env` (WEB_URL, CORS) → recreate `web`.

### Deploy `full` (manual ou push com variável)

1. Build no GHCR: `plane-frontend`, `plane-backend`, `plane-space`, `plane-admin`, `plane-live`, **`plane-proxy`**.
2. SSH no VPS → pull todas as imagens → migrações → `docker compose up` com **overlay do assistente** (`assistant-worker`, `api-chat`, `assistant-chat-worker`) → recreate `proxy` + `web` → health check.

Não é preciso rebuild manual do proxy na VPS nem correr `vps-setup-assistant-workers.sh` — o deploy `full` faz isso.

## Configuração única

### Secrets (Settings → Secrets and variables → Actions)

| Secret        | Exemplo                       |
| ------------- | ----------------------------- |
| `VPS_HOST`    | `72.61.51.247`                |
| `VPS_USER`    | `root`                        |
| `VPS_SSH_KEY` | conteúdo da chave privada SSH |

### Variables (obrigatórias para produção)

| Variable                    | Valor recomendado                 |
| --------------------------- | --------------------------------- |
| `OPERIS_WEB_URL`            | `https://www.operoz.io`           |
| `OPERIS_REPO_PATH`          | `/root/operis-selfhost/Operis`    |
| `OPERIS_APP_PATH`           | `/root/operis-selfhost/plane-app` |
| `OPERIS_DEPLOY_ON_PUSH`     | `web` ou `full` (opcional)        |
| `OPERIS_SELF_HOSTED_RUNNER` | `true` se usar runner no VPS      |

**Importante:** `OPERIS_WEB_URL` controla o build do frontend (`VITE_API_BASE_URL`) e sincroniza `WEB_URL` / `CORS_ALLOWED_ORIGINS` no `operis.env` durante o deploy.

### VPS

- Docker e docker compose instalados.
- `operis.env` com `DOCKERHUB_USER=myoperis`, `APP_RELEASE=stable`, `PULL_POLICY=never`.
- Clone do repo em `OPERIS_REPO_PATH` (branch `preview`).
- Nginx Proxy Manager: forward para `172.17.0.1:8080` (fora do Actions — configuração única).

## Como publicar

**Actions → Deploy Operis → Run workflow**

| Input        | Uso                                                                |
| ------------ | ------------------------------------------------------------------ |
| `full`       | **Recomendado** após mudanças em API, proxy, assistente ou domínio |
| `web`        | Só frontend (rápido, ~5–15 min)                                    |
| `mcp`        | Só MCP HTTP (porta 3100)                                           |
| `skip_build` | Só pull `:preview` no GHCR e recreate (sem rebuild no GitHub)      |

### Push na branch `preview`

- Por defeito: só **web** (build frontend + recreate web).
- Com `OPERIS_DEPLOY_ON_PUSH=full`: stack completa em cada push.
- Ou commit com `[deploy-full]` na mensagem para full pontual.

## Checklist pós-deploy

1. GitHub Variable `OPERIS_WEB_URL=https://www.operoz.io` definida.
2. Run workflow → **full** (primeira vez após migração de domínio ou fix do Caddy).
3. Site abre sem "servidor offline" (frontend buildado com URL certa).
4. Assistente: indexação e chat (workers sobem via overlay no deploy full).

## Troubleshooting

| Problema                           | Solução                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `pull access denied` no VPS        | Repo privado: token GHCR no script; permissões Actions read/write        |
| Proxy em restart loop              | Deploy **full** (imagem `plane-proxy` vem do GHCR com Caddyfile atual)   |
| "Servidor offline" no browser      | `OPERIS_WEB_URL` errada → corrigir variable → deploy **web** ou **full** |
| Indexação / chat não funcionam     | Deploy **full** (sobe `assistant-worker`, `api-chat`, etc.)              |
| 502 no NPM                         | Forward `172.17.0.1:8080`, não `127.0.0.1`                               |
| Health check falhou no log Actions | Ver logs `proxy` no VPS; confirmar `LISTEN_HTTP_PORT=8080` no operis.env |
