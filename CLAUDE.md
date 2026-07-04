# Operoz

Plataforma de gestão de projetos, squads e custos para times/agências de
desenvolvimento — fork/rebrand do [Plane](https://github.com/makeplane/plane).
Cobre boards de work items, "Cliente 360" (cliente modelado como projeto),
squads, custos de pipelines de CI/CD (Harness), automações (incluindo formulários
públicos de intake), um portal leve para stakeholders ("Space") e um MCP server
próprio para agentes de IA (Cursor, Claude Code).

## Estrutura do monorepo (pnpm + Turbo)

- `apps/web` — SPA principal (React Router + Vite, estado com MobX)
- `apps/api` — backend Django REST + Celery (`apps/api/operoz/`): módulos
  `alerts`, `analytics`, `assistant`, `automation`, `authentication`,
  `discord_integration`, `workflow`, `license`, `packs`, `space`, `db`,
  `middleware`, `devops`
- `apps/space` — portal público de intake
- `apps/admin` — "God mode" (administração da instância)
- `apps/live` — serviço de colaboração em tempo real
- `apps/e2e` — testes end-to-end (Playwright)
- `apps/proxy` — config de nginx/proxy
- `packages/*` — libs compartilhadas `@operoz/*` (ui, i18n, types, hooks,
  shared-state, editor, logger, services, tailwind-config, eslint/typescript
  config, codemods, propel, decorators, utils, constants)
- `mcp-server/` — servidor MCP standalone que expõe workspaces, boards, work
  items, Cliente 360, ciclos, módulos e mais (ver `mcp-server/README.md`)
- `deployments/` — Docker Compose, Kubernetes, Swarm e imagem all-in-one
- `packs/`, `templates/prd/` — automation packs e templates de PRD/review

## Stack

- Frontend: React Router, Vite, MobX, Storybook (`@operoz/ui`)
- Backend: Django REST + Celery + RabbitMQ, Postgres (pgvector), Valkey
  (Redis-compatible), MinIO/S3
- Lint/format: oxlint/oxfmt, husky + lint-staged (pre-commit)
- CI: GitHub Actions — `ci-operoz-release.yml` (build web + testes da API na
  branch `preview`), `ci-assistant.yml` (testes do módulo assistant), 
  `deploy-operoz.yml` (build, push pro GHCR, deploy via SSH em VPS)

## Convenções de engenharia

### Princípios gerais

1. Correção antes de velocidade — não proponha solução que você não entende
   completamente.
2. Simplicidade deliberada — a solução mais simples que resolve o problema
   real, sem abstração especulativa (YAGNI).
3. Sem código morto ou branches para casos hipotéticos que ninguém pediu.
4. Legibilidade > esperteza. Siga os padrões já estabelecidos no código ao
   redor antes de escrever algo novo.
5. Decisões de arquitetura relevantes vêm com o trade-off explícito.

### Frontend (`apps/web`, `packages/ui`)

- Componentes pequenos, uma responsabilidade; extraia lógica reutilizável para
  hooks. Props tipadas, evite `any`.
- Estado de servidor via lib de data-fetching, não `useState`+`useEffect`
  manual. Estado global só para o que é realmente global.
- Não otimize (`useMemo`/`useCallback`/`memo`) sem problema medido. Listas
  grandes (>100 itens) → virtualização.
- Acessibilidade não é opcional: HTML semântico, navegação por teclado, `alt`,
  labels em formulários, contraste AA.
- Todo componente com fetch trata loading/erro/vazio, não só o caminho feliz.

### Backend (`apps/api`)

- Camadas separadas: rota/view → service (regra de negócio) → repository/ORM.
  Validação de input na borda, nunca confiar em dado do client.
- Endpoints RESTful versionados (`/api/v1/...`), paginação obrigatória em
  listagens, erros em formato consistente com status HTTP correto.
- Toda query de produção com índice condizente; N+1 é bug. Migrations sempre
  reversíveis, nunca destrutivas em uma etapa só.
- Timeout explícito em toda chamada externa; retry só com backoff + jitter em
  operação idempotente. Logs estruturados, nunca com dado sensível.
- Nada de segredo hardcoded — env var / secret manager, validado no boot.

### Testes (`apps/e2e`, testes unitários por pacote)

- Pirâmide: muitos unitários, alguns de integração, poucos e2e. Teste
  comportamento observável, não detalhe de implementação.
- Priorize regras de negócio e edge cases (vazio, nulo, limite, erro) — não só
  o caminho feliz. Nome do teste descreve o comportamento esperado.
- Testes determinísticos e isolados: sem `sleep`, sem dependência de ordem,
  sem `Math.random()` sem seed. Todo bug corrigido ganha teste de regressão.

### Segurança (sempre, não só quando pedido)

- Nunca concatenar input em query SQL (parametrização/ORM); nunca HTML dinâmico
  sem escape; nunca input do usuário em `eval`/`exec`/shell.
- Toda rota que retorna/modifica dado de um usuário específico verifica
  permissão sobre aquele recurso (evitar IDOR), não só "está logado".
- Segredos só via env var/secret manager. Nunca logar senha, token, dado
  sensível. Cookies de sessão `HttpOnly`/`Secure`/`SameSite`.
- SSRF: validar/restringir destino de requisições para URL fornecida pelo
  usuário. Rate limiting em endpoints sensíveis (login, reset de senha).

### Infra/DevOps (`deployments/`, `.github/workflows/`, Dockerfiles)

- Multi-stage build, imagem mínima com versão fixada, usuário não-root.
- Pipeline lint → test → build → deploy; segredos de CI via secret manager do
  provedor, nunca hardcoded no workflow.
- Todo deploy com rollback claro (migration reversível, versão anterior
  disponível); health checks reais, não só "processo de pé".

### Git & Pull Requests

- Conventional Commits: `tipo(escopo): descrição no imperativo`
  (`feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`).
- Commits atômicos e revertíveis isoladamente; nunca misturar refactor com
  feature no mesmo commit.
- PR pequeno e focado, descreve o quê/por quê/como testou/riscos. Self-review
  antes de pedir revisão.

## Skills disponíveis (`.claude/skills/`)

- `code-review`, `api-design`, `architecture-decisions`,
  `performance-optimization`, `security-audit`, `testing-strategy`,
  `deployment-checklist` — portadas do kit `.cursor/skills/` já existente no
  repo (mesmo conteúdo, formato nativo do Claude Code).
- `feature-ideation` — nova skill específica do Operoz: usa o MCP do Operoz
  (`mcp-server/`) para inspecionar boards/work items reais do workspace e
  sugerir funcionalidades priorizadas, ancoradas no domínio (Cliente 360,
  squads, custos de pipeline, automações).

## MCP do Operoz

O projeto tem seu próprio MCP server em `mcp-server/`, que expõe a API do
Operoz (workspaces, boards, work items, Cliente 360, ciclos, módulos,
automações etc.) via duas tools principais: `operoz_discover` (encontra
operação por intenção) e `operoz_execute` (executa a operação encontrada). Ver
`mcp-server/README.md` para configuração completa (perfil `agent` vs `full`,
deploy HTTP para equipe). Configuração local deste repo em `.mcp.json` (a API
key nunca é commitada — vem de variável de ambiente).
