# Operoz

**Gestão de projetos, squads e custos** — com boards, Cliente 360, integrações Git e métricas de pipeline (Harness), num monorepo self-host.

O produto chama-se **Operoz**. No código e na infraestrutura persistem prefixos legados `operis` (pacotes `@operis/*`, `apps/api/operis`, serviços Docker `operis-*`).

---

## O que é o Operoz

Plataforma para equipas de entrega que precisam de:

- **Boards (squads)** — carteiras de trabalho com ciclos, estados, campos custom e visões.
- **Projetos e Cliente 360** — um projeto pode representar um cliente, com módulos, status reports e propriedades de receção.
- **Work items** — cards rastreáveis com tipos, subtarefas, comentários, anexos e ligação a PRs/commits.
- **Integrações Git** — webhooks normalizados para correlacionar atividade de repositório com cards.
- **Custos Harness** — atribuição de gasto de pipeline/CD a projeto, módulo ou card.
- **Automações** — regras disparadas por eventos (incl. formulários públicos de intake).
- **Space** — formulários públicos de receção e portal leve para stakeholders.
- **MCP** — servidor Model Context Protocol para agentes de IA (Cursor, Claude Desktop, etc.).

---

## Estrutura do monorepo

| Caminho       | Função                                          |
| ------------- | ----------------------------------------------- |
| `apps/web`    | Aplicação principal (React Router, Turbo)       |
| `apps/api`    | API Django (`operis/`) + Celery workers         |
| `apps/space`  | Portal público / intake                         |
| `apps/admin`  | God mode / administração da instância           |
| `apps/live`   | Colaboração em tempo real                       |
| `apps/e2e`    | Testes end-to-end (Playwright)                  |
| `packages/*`  | Tipos, i18n, UI, ESLint, Tailwind (`@operis/*`) |
| `mcp-server/` | Servidor MCP                                    |
| `docs/`       | Documentação interna (ex.: `operis-mcp.md`)     |

---

## Requisitos

- **Node.js** ≥ 22.18
- **pnpm** 10.32
- **Docker** e Docker Compose (Postgres, Redis/Valkey, RabbitMQ, MinIO, API e workers)

---

## Desenvolvimento local

Na raiz do repositório:

```bash
./setup.sh
docker compose -f docker-compose-local.yml up -d
pnpm dev
```

O `setup.sh` copia `.env.example` → `.env` (raiz e apps), gera `SECRET_KEY` e instala dependências com pnpm.

### URLs locais

| Serviço          | URL                                      |
| ---------------- | ---------------------------------------- |
| App web          | http://localhost:3000                    |
| Admin (God mode) | http://localhost:3001/god-mode/          |
| API              | http://localhost:8000                    |
| MinIO (S3 local) | http://localhost:9000 (consola: `:9090`) |
| Postgres         | `localhost:5432`                         |
| Redis            | `localhost:16379`                        |

### Infra Docker

Serviços: `operis-db`, `operis-redis`, `operis-mq`, `operis-minio`, `api`, `worker`, `beat-worker`, `migrator`.

Se migraste de nomes antigos de volumes, recria-os antes do `up`:

```bash
docker compose -f docker-compose-local.yml down -v
docker compose -f docker-compose-local.yml up -d
```

### Comandos úteis

```bash
pnpm build              # build Turbo de todos os pacotes
pnpm check:types        # verificação de tipos
pnpm test:f0            # smoke API + e2e F0
pnpm test:f0:api        # só smoke da API
```

Backend Python: `apps/api/operis/`. Configuração local: `operis.settings.local`.

---

## Deploy (self-host)

O workflow [`.github/workflows/deploy-operis.yml`](./.github/workflows/deploy-operis.yml) faz build, push para GHCR e deploy no VPS.

| Gatilho                      | Comportamento                                    |
| ---------------------------- | ------------------------------------------------ |
| Push na branch `preview`     | Build e deploy de **web** + **MCP**              |
| `workflow_dispatch` → `web`  | Só frontend                                      |
| `workflow_dispatch` → `mcp`  | Só servidor MCP                                  |
| `workflow_dispatch` → `full` | Stack completa (API, Space, migrations, workers) |

Secrets necessários: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`.  
Variables recomendadas: `OPERIS_WEB_URL`, `OPERIS_REPO_PATH`, `OPERIS_APP_PATH`.

Para alterações que exigem migrações Django ou novos serviços (ex.: `automation-worker`), usa o alvo **`full`**.

---

## MCP (agentes de IA)

Pacote em [`mcp-server/`](./mcp-server/README.md). Expõe workspaces, projetos, work items, boards, Cliente 360, páginas, ciclos e mais — ver [`docs/operis-mcp.md`](./docs/operis-mcp.md).

```bash
cd mcp-server
cp .env.example .env
# OPERIS_API_BASE_URL e OPERIS_API_KEY (ou sessão via operis_sign_in)
npm install && npm run build
```

Configura no Cursor em **Settings → MCP** apontando para `mcp-server/dist/index.js`.

---

## Stack

[![React Router](https://img.shields.io/badge/-React%20Router-CA4245?logo=react-router&style=for-the-badge&logoColor=white)](https://reactrouter.com/)
[![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green)](https://www.djangoproject.com/)
[![Node.js](https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

Monorepo: **pnpm** + **Turbo**. API: **Django REST** + **Celery** + **RabbitMQ**. Fila/cache: **Valkey**. Object storage: **MinIO** (local) / S3 (produção).

---

## Licença

Este projeto está licenciado sob [GNU Affero General Public License v3.0](./LICENSE.txt).
