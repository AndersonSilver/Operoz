# Tech4Humans — Boards: etapas de desenvolvimento (passo a passo)

**Regra de ouro:** terminar **uma etapa**, validar, **parar** e só avançar quando o utilizador disser que pode continuar para a próxima.

**Foco:** experiência de frontend (sidebar, hierarquia visual, modais, páginas do board) — backend entra só o mínimo necessário para cada etapa de UI.

**Documentos relacionados:**

- [tech4humans-boards-plano-desenvolvimento.md](./tech4humans-boards-plano-desenvolvimento.md) — produto
- [tech4humans-boards-implementacao.md](./tech4humans-boards-implementacao.md) — arquitetura técnica
- [tech4humans-boards-mvp2-plano.md](./tech4humans-boards-mvp2-plano.md) — planejamento MVP-2 (hub Jira)

---

## Hierarquia canónica Tech4Humans (sempre esta ordem)

Esta é a **única** árvore de trabalho acordada. UI, sidebar, breadcrumbs e copy devem refletir estes níveis.

```text
Workspace (empresa)
└── Board (time / «Times» na UI)
    └── Projeto (épico de negócio — um cliente, iniciativa ou entrega grande)
        └── Card (item de trabalho)
            └── Subtarefa
                └── Subtarefa …
```

| Nível (vocabulário Tech4Humans) | Entidade no Plane    | Notas                                              |
| ------------------------------- | -------------------- | -------------------------------------------------- |
| Workspace                       | `Workspace`          | ex.: Tech4Humans                                   |
| Board (time)                    | `Board` _(novo)_     | ex.: Squad as a Service                            |
| Projeto (épico)                 | `Project`            | O «épico» do negócio **é o projeto**, não o Módulo |
| Card                            | `Issue`              | Item de trabalho                                   |
| Subtarefa                       | `Issue` com `parent` | Pode aninhar vários níveis                         |

**Dentro do projeto (opcional, inalterado no Plane):** **Módulos** e **Ciclos** continuam como agrupamentos _dentro_ do épico/projeto (marcos, sprints). Não substituem Board nem Projeto.

**Sidebar (MVP):** mostrar só até **Board → Projetos**. Cards e subtarefas entram ao abrir o projeto (como hoje).

---

## Como vamos trabalhar

1. Eu implemento **só a etapa atual**.
2. Mostro o que mudou e como testar visualmente.
3. Pergunto: **«Posso continuar para a Etapa N+1?»**
4. Tu respondes sim/não ou pedes ajustes na etapa atual.

**Feature flag (recomendado):** `NEXT_PUBLIC_ENABLE_BOARDS=false` por defeito até a Etapa 6 — evita que utilizadores vejam UI a meio.

---

## Mapa das etapas

| Etapa   | Nome                | Foco                                   | Backend? | Risco de quebrar        |
| ------- | ------------------- | -------------------------------------- | -------- | ----------------------- |
| **0**   | Congelar design UI  | Doc + checklist visual                 | Não      | Nenhum                  |
| **1**   | i18n + tipos TS     | Textos «Boards», tipos vazios          | Não      | Nenhum                  |
| **2**   | Sidebar mock        | Hierarquia visual com dados falsos     | Não      | Baixo (componente novo) |
| **3**   | Modais mock         | Criar board / escolher board (sem API) | Não      | Baixo                   |
| **4**   | Página board vazia  | Layout `/boards/{slug}` estático       | Não      | Baixo                   |
| **5**   | BD + API boards     | Modelo + CRUD mínimo                   | Sim      | Médio (migração)        |
| **6**   | Ligar sidebar à API | Substituir mock por dados reais        | Sim      | Médio                   |
| **7**   | Projeto ↔ board     | POST/PATCH projeto + modal criar       | Sim      | Médio                   |
| **8**   | «Sem board» + mover | Legado D10 + mover projeto             | Sim      | Baixo                   |
| **9**   | Analytics filtro    | Seletor board nas analytics            | Sim      | Baixo                   |
| **10**  | Settings + arquivar | Gerir boards no workspace              | Sim      | Baixo                   |
| **11+** | MVP-2 (Cronograma…) | Hub Jira                               | Sim      | Alto — fase posterior   |

---

## Etapa 0 — Congelar design UI (sem código de produto)

**Objetivo:** alinhar como a sidebar e a página do board **devem parecer** antes de codar.

**Status:** proposta de design abaixo — **aguarda tua aprovação explícita** («aprovado etapa 0»).

**Especificação completa:** [tech4humans-boards-design-sidebar-etapa0.md](./tech4humans-boards-design-sidebar-etapa0.md)

**Entregáveis:**

- [x] Lista de blocos na sidebar (ordem, ícones, labels PT)
- [x] Comportamento colapsar/expandir board
- [x] Secção «Sem board» — quando aparece
- [x] Empty states: sem boards; sem projetos no board
- [x] Cores/espaçamento: reutilizar tokens existentes (`sidebar`, `Disclosure`, `projects-list`)
- [x] **Aprovação do utilizador** (maio/2026)

**Critério de pronto:** tu aprovas por escrito (chat) o esboço.

**PARAR → pedir OK para Etapa 1** ✓

---

## Etapa 1 — i18n + tipos TypeScript

**Objetivo:** fundação de texto e tipos sem alterar comportamento da app.

**Status:** concluída (maio/2026).

**Ficheiros alterados:**

- `packages/types/src/board/boards.ts` + `board/index.ts`
- `packages/types/src/index.ts` — export `board`
- `packages/types/src/project/projects.ts` — `board_id`, `board?`
- `packages/types/src/analytics.ts` — `board_id?` em filtros (preparação D8)
- `packages/i18n/src/locales/pt-BR/translations.ts` — `boards.*`
- `packages/i18n/src/locales/en/translations.ts` — `boards.*`

**O que NÃO fazer nesta etapa:**

- Não alterar sidebar ainda
- Não alterar API

**Como validar:** build de `@operoz/types` e `@operoz/i18n`; app igual à atual.

**PARAR → pedir OK para Etapa 2**

---

## Etapa 2 — Sidebar com dados mock (design)

**Objetivo:** ver a hierarquia **Board → Projetos** na sidebar com dados estáticos.

**Ficheiros (previstos):**

- `core/components/workspace/sidebar/boards-list.tsx` (novo)
- Integração condicional em `projects-list.tsx` ou irmão no layout da sidebar — **atrás de flag**
- Dados mock no próprio componente (2 boards, 3 projetos)

**Design (obrigatório):**

- Mesmo padrão visual que `projects-list.tsx` (`Disclosure`, `ChevronRight`, `SidebarNavItem`)
- Título da secção: `t("boards.title")` → «Boards» (times)
- Indentação: **Board → Projeto (épico)** — **não** mostrar cards na sidebar
- Secção «Sem board» no fim (projetos legados sem time)
- Breadcrumb futuro: Workspace → Board → Projeto → (cards dentro do projeto)

**Como validar:** flag `true` em dev → sidebar nova; flag `false` → sidebar atual intacta.

**PARAR → pedir OK para Etapa 3**

---

## Etapa 3 — Modais mock (design)

**Objetivo:** fluxos visuais de criar board e escolher board ao criar projeto — **sem gravar**.

**Ficheiros (previstos):**

- `core/components/board/create-board-modal.tsx`
- Alteração visual em `create-project-modal` — select board (mock)
- Toasts de sucesso simulados (opcional)

**Como validar:** abrir modais, tabulação, mobile básico; nada persiste ao refresh.

**PARAR → pedir OK para Etapa 4**

---

## Etapa 4 — Página overview do board (estática)

**Objetivo:** rota `/boards/{slug}` com header, nome, lista de projetos (mock).

**Ficheiros (previstos):**

- `app/routes/core.ts` — rota nova
- `app/(all)/[workspaceSlug]/(projects)/boards/[boardSlug]/page.tsx`
- `core/components/board/board-overview.tsx`

**Design:**

- Breadcrumb: Workspace → Board
- Botão «Abrir projeto» por linha
- Sem tabs Cronograma ainda (MVP-2)

**Como validar:** URL manual; não quebra rotas de projeto.

**PARAR → pedir OK para Etapa 5** (primeira etapa com backend)

---

## Etapa 5 — Backend: modelo + migração + API boards

**Objetivo:** API funcional; frontend ainda pode usar mock ou ligar parcialmente.

**Ver:** [tech4humans-boards-implementacao.md](./tech4humans-boards-implementacao.md) §4–§5.

**PARAR → pedir OK para Etapa 6**

---

## Etapa 6 — Ligar sidebar à API

**Objetivo:** remover mock; `BoardStore` + `board.service.ts`.

**PARAR → pedir OK para Etapa 7**

---

## Etapa 7 — Projeto obrigatório com board

**Objetivo:** criar projeto só com board; validação D2/D2b.

**PARAR → pedir OK para Etapa 8**

---

## Etapas 8–10

Resumo — detalhe em [implementação](./tech4humans-boards-implementacao.md):

- **8:** Sem board + mover projeto
- **9:** Analytics
- **10:** Settings workspace + arquivar board

Cada uma com **PARAR** antes da seguinte.

---

## MVP-2 — Hub Jira (após MVP-1 fechado)

Cronograma, backlog cross-project, Kanban no board, etc. — **não** fazem parte das etapas 0–10.

**Planejamento completo:** [tech4humans-boards-mvp2-plano.md](./tech4humans-boards-mvp2-plano.md) (etapas M2-0 a M2-10, PRs, critérios de aceite).

**Em curso (maio/2026):** **M2-1** concluída — `GET /api/workspaces/{slug}/boards/{board_slug}/issues/` + front `BoardService.getBoardIssues`.

**Fatia backlog:** rota `/boards/{slug}/backlog`, store `EIssuesStoreType.BOARD` (ligado ao endpoint novo).

**Próxima ação sugerida:** **M2-4** (tab Lista) e **M2-5** (Quadro). M2-2/M2-3 (filtro Projeto + backlog) implementados em maio/2026.

---

## Estado atual

| Etapa | Status                                                                                  |
| ----- | --------------------------------------------------------------------------------------- |
| 0     | Aprovada — [design-sidebar-etapa0](./tech4humans-boards-design-sidebar-etapa0.md)       |
| 1     | Concluída — tipos + i18n                                                                |
| 2–10  | Concluídas (MVP-1 estrutural + polish sidebar/nav)                                      |
| MVP-2 | Planejado — [mvp2-plano](./tech4humans-boards-mvp2-plano.md); backlog parcial em código |

---

## Checklist «não quebrar»

Antes de cada merge/continuação:

- [ ] Feature flag desligada em produção até Etapa 6 completa
- [ ] `projects-list` original ainda funciona com flag off
- [ ] Rotas de projeto não alteradas
- [ ] `pnpm exec tsc -p apps/web/tsconfig.json --noEmit` sem erros
- [ ] Smoke: login → workspace → abrir um projeto → issues
