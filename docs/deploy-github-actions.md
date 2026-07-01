# Deploy automático com GitHub Actions

Workflow: [`.github/workflows/deploy-operoz.yml`](../.github/workflows/deploy-operoz.yml)  
Scripts VPS: [`.github/scripts/`](../.github/scripts/)

## O que faz

### Deploy `web` (push na `preview` ou manual)

1. Build `plane-frontend` no GitHub com `VITE_API_BASE_URL` = `OPEROZ_WEB_URL`.
2. SSH no VPS → pull imagem GHCR → sync `operoz.env` (WEB_URL, CORS) → recreate `web`.

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
| `OPEROZ_WEB_URL`            | `https://www.operoz.io`           |
| `OPEROZ_REPO_PATH`          | `/root/operoz-selfhost/Operoz`    |
| `OPEROZ_APP_PATH`           | `/root/operoz-selfhost/plane-app` |
| `OPEROZ_DEPLOY_ON_PUSH`     | `web` ou `full` (opcional)        |
| `OPEROZ_SELF_HOSTED_RUNNER` | `true` se usar runner no VPS      |

**Importante:** `OPEROZ_WEB_URL` controla o build do frontend (`VITE_API_BASE_URL`) e sincroniza `WEB_URL` / `CORS_ALLOWED_ORIGINS` no `operoz.env` durante o deploy.

### VPS

- Docker e docker compose instalados.
- `operoz.env` com `DOCKERHUB_USER=myoperoz`, `APP_RELEASE=stable`, `PULL_POLICY=never`.
- Clone do repo em `OPEROZ_REPO_PATH` (branch `preview`).
- Nginx Proxy Manager: forward para `172.17.0.1:8080` (fora do Actions — configuração única).

## Como publicar

**Actions → Deploy Operoz → Run workflow**

| Input        | Uso                                                                |
| ------------ | ------------------------------------------------------------------ |
| `full`       | **Recomendado** após mudanças em API, proxy, assistente ou domínio |
| `web`        | Só frontend (rápido, ~5–15 min)                                    |
| `mcp`        | Só MCP HTTP (porta 3100)                                           |
| `skip_build` | Só pull `:preview` no GHCR e recreate (sem rebuild no GitHub)      |

### Push na branch `preview`

- Por defeito: só **web** (build frontend + recreate web).
- Com `OPEROZ_DEPLOY_ON_PUSH=full`: stack completa em cada push.
- Ou commit com `[deploy-full]` na mensagem para full pontual.

## Checklist pós-deploy

1. GitHub Variable `OPEROZ_WEB_URL=https://www.operoz.io` definida.
2. Run workflow → **full** (primeira vez após migração de domínio ou fix do Caddy).
3. Site abre sem "servidor offline" (frontend buildado com URL certa).
4. Assistente: indexação e chat (workers sobem via overlay no deploy full).

## Troubleshooting

| Problema                           | Solução                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `pull access denied` no VPS        | Repo privado: token GHCR no script; permissões Actions read/write        |
| Proxy em restart loop              | Deploy **full** (imagem `plane-proxy` vem do GHCR com Caddyfile atual)   |
| "Servidor offline" no browser      | `OPEROZ_WEB_URL` errada → corrigir variable → deploy **web** ou **full** |
| Indexação / chat não funcionam     | Deploy **full** (sobe `assistant-worker`, `api-chat`, etc.)              |
| 502 no NPM                         | Forward `172.17.0.1:8080`, não `127.0.0.1`                               |
| Health check falhou no log Actions | Ver logs `proxy` no VPS; confirmar `LISTEN_HTTP_PORT=8080` no operoz.env |
