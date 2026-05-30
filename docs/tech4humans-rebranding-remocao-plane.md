# Tech4Humans — Plano de remoção / rebranding da marca Plane

**Objetivo:** mapear tudo o que referencia «Plane» no fork community e planear a remoção ou substituição da **marca** com o máximo de cuidado para **não quebrar** o projeto (incluindo a feature **Boards** Tech4Humans).

**Escopo deste documento:** planejamento e inventário — **não** implica alterações de código por si só.

**Documentos relacionados:**

- [tech4humans-boards-mvp2-plano.md](./tech4humans-boards-mvp2-plano.md) — Boards MVP-2
- [tech4humans-boards-implementacao.md](./tech4humans-boards-implementacao.md) — arquitetura Boards
- [tech4humans-plane-organizacao.md](./tech4humans-plane-organizacao.md) — hierarquia produto (referência histórica)

**Última atualização:** maio/2026

---

## 1. Contexto do repositório

| Item | Valor |
|------|--------|
| Monorepo | `plane/` (Plane CE ~v1.3.1) |
| Licença upstream | AGPL-3.0 |
| Customização local | Boards Tech4Humans, docs `tech4humans-*`, `VITE_ENABLE_BOARDS` |
| Marca alvo (MVP) | **Kortex** — Fase **11 / MV6**, uma das **últimas** do roadmap ([mv3-mv5](./tech4humans-roadmap-mv3-mv5.md#mv6--rebranding-kortex-fecho-do-mvp), [board-config](./tech4humans-board-config-mvp3-plano.md)) |
| Marca histórica no doc | **Tech4Humans** em exemplos antigos — tratar como workspace/cliente, não como nome do produto |

**Regra de ouro:** terminar **uma fase**, validar com o checklist (§8), **parar** e só avançar quando a equipa concordar.

---

## 2. Triagem: o que é marca vs. o que não é

Muitas ocorrências de `plane` no código **não** são branding. Renomear em massa sem triagem quebra o fork.

### 2.1 É marca Plane (substituir na UI / comunicação)

- Textos «Plane», «Novo no Plane?», links `plane.so`, `app.plane.so`
- Logos, favicons, wordmark
- Títulos SEO (`SITE_NAME`, meta tags)
- Templates de email
- Links de ajuda, changelog cloud, upsell community
- README / CONTRIBUTING upstream (makeplane)

### 2.2 É infraestrutura interna (renomear só com plano explícito)

- Pacotes npm `@plane/*` (~15 pacotes, centenas de imports)
- Pacote Python Django `apps/api/plane/` (~650 ficheiros)
- Serviços Docker: `plane-db`, `plane-redis`, `plane-mq`, `plane-minio`
- Credenciais default em `.env.example`: `POSTGRES_USER=plane`, etc.
- Constantes `PLANE_*` (ex.: `PLANE_COMMUNITY_PRODUCTS`)

### 2.3 Não confundir com marca (não renomear)

| Nome | O que é | Ação |
|------|---------|------|
| **Board** | Entidade Tech4Humans / rotas `/boards/` | Manter |
| `board.service.ts`, `board.store.ts`, etc. | Código da feature Boards | Manter |
| **Planejado** (PT) | Tradução de estado (planned) | Manter |
| `plane-pdf-exporter.tsx` | Utilitário interno live | Opcional, fase tardia |
| Pasta `c:\Workspace\PLANE` no PC | Apenas workspace local | Opcional |

### 2.4 Licença e copyright (obrigação legal, não é «só marca»)

- `LICENSE` AGPL-3.0
- Cabeçalhos `Copyright (c) 2023-present Plane Software, Inc.` em milhares de ficheiros TS/Py

**Podes** esconder a marca na UI. **Não deves** apagar o `LICENSE` nem os avisos de copyright do código-fonte que distribuis (fork AGPL). Prática habitual: **manter** headers originais e **adicionar** os teus + ficheiro `NOTICE` com atribuição ao Plane.

---

## 3. Mapa completo por categoria

### 3.1 Marca visível ao utilizador (baixo risco técnico)

| Área | Localização principal | Notas |
|------|----------------------|--------|
| i18n PT/EN | `packages/i18n/src/locales/pt-BR/translations.ts`, `en/translations.ts` | ~20+ strings de marca em PT; usar `\bPlane\b` na busca (evitar `Planejado`) |
| Empty states | `packages/i18n/src/locales/*/empty-state.ts` | Revisar caso a caso |
| Metadata / SEO | `packages/constants/src/metadata.ts` | `SITE_NAME`, `SITE_URL`, Space/Publish |
| Pagamentos / links | `packages/constants/src/payment.ts`, `endpoints.ts` | URLs `plane.so` |
| Layout web | `apps/web/app/layout.tsx`, `root.tsx` | Título hardcoded + imports de `@plane/constants` |
| Admin / Space | `apps/admin/app/root.tsx`, `apps/space/app/root.tsx` | Mesmo padrão |
| Auth | `apps/web/core/components/auth-screens/*`, `account/auth-forms/*` | Texto + logo |
| OAuth UI | `packages/ui/src/oauth/*` | Botões provedores |
| Logos | `packages/propel/src/icons/brand/plane-*.tsx`, `plane-lockup-light.svg` | 8 ficheiros com nome `plane` |
| Space assets | `apps/space/app/assets/plane-logo.svg` | |
| Spinners | `**/logo-spinner.tsx` (web, admin, space) | |
| Emails | `apps/api/templates/emails/**/*.html` | ~15 templates |
| Ajuda / updates | `help-section`, `product-updates`, `power-k` help commands | Links externos |
| Admin setup | `apps/admin/components/instance/setup-form.tsx` | Onboarding |
| Erros produção | `apps/web/app/error/prod.tsx`, space `error.tsx` | Mensagens de falha de serviços |

**Ponto de partida recomendado:** `metadata.ts` + i18n + logos (impacto máximo, diff concentrado).

---

### 3.2 Pacotes JavaScript `@plane/*` (risco médio)

**Pacotes internos** (nome em `packages/*/package.json`):

- `@plane/utils`, `@plane/types`, `@plane/constants`, `@plane/i18n`
- `@plane/editor`, `@plane/ui`, `@plane/propel`, `@plane/services`
- `@plane/shared-state`, `@plane/hooks`, `@plane/decorators`, `@plane/logger`
- `@plane/typescript-config`, `@plane/tailwind-config`, `@plane/codemods`

**Apps:**

| App | `package.json` name |
|-----|---------------------|
| Web | `web` |
| Admin | `admin` |
| Space | `space` |
| Live | `live` |
| API (wrapper) | `plane-api` |

**Raiz monorepo:** `"name": "plane"` em `package.json`.

**Volume:** imports `@plane/...` em centenas de ficheiros; `pnpm-lock.yaml` com dezenas de entradas.

**Risco ao renomear:** `package.json`, `pnpm-workspace.yaml`, paths TS/Vite, `pnpm install`, build turbo de todas as apps.

---

### 3.3 Backend Django `apps/api/plane/` (risco alto)

| Submódulo | Função |
|-----------|--------|
| `app/` | API REST principal (incl. views `board/` Tech4Humans) |
| `db/` | Models, migrações (~0123+), management commands |
| `authentication/` | OAuth, magic link, email |
| `license/` | Instância self-hosted, god-mode, config |
| `bgtasks/` | Celery |
| `space/` | API Publish / sites |
| `settings/` | Django settings |
| `tests/` | Contract + unit |

**Imports:** `from plane.*` em praticamente todo o backend.

**Não renomear o pacote Python** sem plano para `INSTALLED_APPS`, Celery, Docker, e **app_label** das migrações Django.

**Alternativa segura:** manter `plane` como nome interno; marca apenas na UI e `instance_name` na BD.

---

### 3.4 Docker e ambiente (risco médio — devops)

**Ficheiros:** `docker-compose-local.yml`, `apps/api/.env.example`, `deployments/**`, `setup.sh`, `setup.ps1`

| Tipo | Exemplos |
|------|----------|
| Nomes de serviço | `plane-db`, `plane-redis`, `plane-mq`, `plane-minio` |
| Credenciais default | `POSTGRES_USER=plane`, `POSTGRES_DB=plane`, `RABBITMQ_USER=plane` |
| Scripts deploy | `PLANE_INSTALL_DIR`, `plane.env` em `deployments/cli`, `deployments/swarm` |

**Risco:** volumes Docker existentes (`pgdata`, etc.) — renomear serviços exige alinhar `.env` local e possivelmente recriar containers.

---

### 3.5 Documentação e repositório

| Ficheiro | Conteúdo |
|----------|----------|
| `README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md` | Upstream makeplane / Plane |
| `docs/tech4humans-*.md` | Referências históricas ao Plane como produto base |
| `.github/workflows/*` | CI upstream |
| `apps/api/plane/tests/TESTING_GUIDE.md` | Guia de testes |

---

### 3.6 Editor e tipos internos (risco médio, fase tardia)

- Extensões editor em `packages/editor/` (comentários / storage keys com «plane»)
- `plane-pdf-exporter.tsx` em `apps/live/`
- Tipos e constantes de extensão ProseMirror

Validar sempre: criar/editar issue com descrição rica e página (Pages).

---

## 4. Inventário rápido (números de referência)

| Métrica | Valor aproximado (maio/2026) |
|---------|---------------------------|
| Ficheiros em `apps/api/plane/` | ~650 |
| Pacotes `@plane/*` | 15 |
| Ficheiros com `\bPlane\b` (marca) | Centenas (muitos são copyright header) |
| Ficheiros com `plane` case-insensitive | Milhares (inclui `@plane/`, paths, board, planejado) |
| URLs `plane.so` / `makeplane` | ~70+ ficheiros em grep de domínio |
| Templates email | ~15 |

> Para inventário linha a linha, correr buscas com triagem (§2) antes de codemod global.

---

## 5. Plano por fases

### Fase 0 — Decisões (sem código)

- [ ] Nome final da marca (ex.: **Tech4Humans**)
- [ ] Escopo: só UI vs. também pacotes/repos
- [ ] Texto AGPL no rodapé (ex.: «Baseado em software open-source» + link LICENSE)
- [ ] Baseline: `pnpm check`, smoke API, fluxo Boards com `VITE_ENABLE_BOARDS=true`

---

### Fase 1 — White-label visível (risco baixo, 1–3 dias)

**Ordem sugerida:**

1. `packages/constants/src/metadata.ts` (+ `payment.ts`, `endpoints.ts`)
2. Logos: `packages/propel/src/icons/brand/plane-*` → assets Tech4Humans (alias temporário opcional)
3. i18n `pt-BR` e `en` — substituir `\bPlane\b` em strings de produto
4. `apps/web/app/layout.tsx`, `root.tsx`; `apps/admin`, `apps/space`
5. Templates `apps/api/templates/emails/**/*.html`
6. Remover ou ocultar links `plane.so`, product updates, upgrade banners CE indesejados

**Não incluir nesta fase:** renomear `@plane/*` ou pacote Python.

---

### Fase 2 — Instância self-hosted (risco baixo–médio)

- [ ] Admin God Mode: `instance_name`, logo via API de instância (`license/`)
- [ ] UI prioriza nome/logo da instância vs. strings hardcoded
- [ ] Favicons: `apps/web/app/assets/favicon/`

---

### Fase 3 — Renomear monorepo npm `@plane` → `@kortex` (risco médio, 1–2 semanas) — **opcional no MVP**

1. Renomear `name` nos 15 `packages/*/package.json` + raiz
2. Codemod: `@plane/` → `@kortex/` (considerar `packages/codemods`)
3. Atualizar `pnpm-workspace.yaml`, `turbo.json`, Vite/TS paths
4. `pnpm install` + `pnpm check` + build `web`, `admin`, `space`, `live`, API

**Regra:** PR dedicado — sem misturar features Boards.

---

### Fase 4 — Renomear pacote Python `plane` (opcional, risco alto)

Só se requisito legal/comercial exigir «zero plane» no código.

- Abordagem segura: pacote shim `tech4humans` que reexporta `plane`; migrar imports gradualmente
- **Não** alterar `app_label` de migrações sem migração Django explícita

**Recomendação:** adiar ou não fazer; marca na UI é suficiente para a maioria dos forks.

---

### Fase 5 — Infra Docker (risco médio)

- Renomear serviços e variáveis em ambiente **novo** ou com script de migração `.env`
- Documentar breaking change para a equipa
- Alinhar `setup.sh` / `setup.ps1`

---

### Fase 6 — Repositório e documentação (risco baixo)

- [ ] Renomear pasta `plane/` → nome do produto (opcional)
- [ ] README, CONTRIBUTING, badges
- [ ] Atualizar docs `tech4humans-*` (trocar «No Plane» por «produto base» onde for histórico)
- [ ] Este documento: marcar fases concluídas

---

## 6. Matriz de risco

```
Impacto UX    ████████████  Fases 1–2 (i18n, metadata, logos)
Esforço       ████          Fases 1–2
Risco quebra  ██            Fases 1–2

Impacto dev   ████████████  Fase 3 (@plane packages)
Esforço       █████████     Fase 3
Risco quebra  ██████        Fase 3

Impacto dev   ████████████  Fase 4 (Django plane/)
Esforço       ███████████   Fase 4
Risco quebra  █████████     Fase 4 — evitar no curto prazo
```

---

## 7. Recomendação prática (Kortex + Boards)

**Calendário MVP:** executar rebranding **no fecho** (MV6 / Fase 11), depois de Status Report e demais fases funcionais estáveis — ver [roadmap MV6](./tech4humans-roadmap-mv3-mv5.md#mv6--rebranding-kortex-fecho-do-mvp).

Para **tirar Plane da cara do produto** sem arriscar entregas em curso:

1. Executar **Fases 0–2** (MV6.1–6.2) — utilizador passa a ver **Kortex** quase em todo o lado.
2. **Adiar Fase 3** (`@kortex/*`) para janela com CI verde, se quiseres limpar o terminal.
3. **Não fazer Fase 4** salvo necessidade forte.
4. Manter `apps/api/plane/` e `@plane/*` como detalhe interno é aceitável em forks AGPL até MV6.3.

---

## 8. Checklist anti-regressão (cada fase)

- [ ] `pnpm dev` — web sobe sem erros de import
- [ ] Login (email / magic link / OAuth se configurado)
- [ ] Workspace → projeto → item de trabalho (issue)
- [ ] **Boards:** sidebar, `/boards/{slug}`, backlog, settings de boards (`VITE_ENABLE_BOARDS=true`)
- [ ] Editor em issue e Pages
- [ ] Admin god-mode + convite workspace
- [ ] Email de teste (um template)
- [ ] Testes API smoke: `apps/api/plane/tests` (subset contract)

---

## 9. Comandos úteis para inventário

```bash
# Marca com P maiúsculo (revisar falsos positivos em copyright)
rg '\bPlane\b' plane --glob '!node_modules' --glob '!dist' --glob '!.next'

# Pacotes npm internos
rg '@plane/' plane --glob '!pnpm-lock.yaml' --count-matches

# Domínios upstream
rg -i 'plane\.so|makeplane' plane --glob '!node_modules'

# Backend Python
rg 'from plane\.|import plane' plane/apps/api --count-matches

# Docker / env
rg 'plane-db|POSTGRES_USER.*plane' plane --glob '*.yml' --glob '*.env*'

# i18n PT — cuidado com Planejado
rg 'Plane' plane/packages/i18n/src/locales/pt-BR
```

---

## 10. Registo de progresso

| Fase | Estado | Data | Notas |
|------|--------|------|-------|
| 0 — Decisões | Pendente | | |
| 1 — White-label UI | Pendente | | |
| 2 — Instância | Pendente | | |
| 3 — npm `@plane` | Pendente | | |
| 4 — Python `plane` | Pendente / opcional | | |
| 5 — Docker | Pendente | | |
| 6 — Docs/repo | Pendente | | |

---

## 11. Próximos passos sugeridos

1. Confirmar nome final na UI (**Tech4Humans** ou outro).
2. Decidir texto do rodapé AGPL.
3. Implementar Fase 1 em PR pequeno: `metadata.ts` + `layout.tsx` + amostra i18n PT.
4. Validar checklist §8 antes de merge.
