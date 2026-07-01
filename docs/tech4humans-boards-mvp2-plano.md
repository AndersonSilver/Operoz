# Tech4Humans — Boards: planejamento MVP-2 (hub Jira)

**Objetivo:** transformar o **Board** de «pasta de projetos na sidebar» em **espaço de trabalho do time** com visões que **cruzam vários projetos** (paridade com a captura Jira: Cronograma, Backlog, Quadro, Lista, Calendário).

**MVP-1** = estrutura (`Workspace → Board → Projeto`).  
**MVP-2** = conteúdo agregado (issues e planeamento ao nível do board).

**Documentos relacionados:**

- [tech4humans-boards-plano-desenvolvimento.md](./tech4humans-boards-plano-desenvolvimento.md) — produto, §17–18 (referência Jira)
- [tech4humans-boards-implementacao.md](./tech4humans-boards-implementacao.md) — arquitetura, API, stores
- [tech4humans-boards-etapas.md](./tech4humans-boards-etapas.md) — etapas MVP-1 (0–10) e regra de paragem

**Regra de ouro (igual ao MVP-1):** terminar **uma etapa**, validar, **parar** e só avançar quando o utilizador disser que pode continuar.

**Última atualização:** maio/2026

---

## Estado atual (baseline antes do MVP-2)

| Área                             | Status                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------ | --- | --- | ---------------------------------- |
| MVP-1 (etapas 0–10)              | Concluído (+ polish: unarchive, menu board, breadcrumbs, nav projeto na sidebar)     |
| API issues agregados             | **M2-1** — concluído — `GET …/boards/{board_slug}/issues/`                           |
| Filtro Projeto (M2-2)            | Concluído — `BoardLevelWorkItemFiltersHOC` + localStorage                            |
| **M2-0** UX hub (tabs + filtros) | **Concluído** (aprovação produto)                                                    |
| **M2-3** Backlog                 | **Concluído**                                                                        |
| **M2-4** Lista                   | **Concluído**                                                                        |
| **M2-5** Quadro (Kanban)         | **Concluído**                                                                        |
| **M2-6** Cronograma              | **Concluído** — hierarquia projeto → cards (`GANTT_TIMELINE_TYPE.GROUPED`)           |
| **M2-7** Escala timeline         | **Concluído** — Semana/Mês/Trimestre + Hoje + preferência localStorage por scope     |
| **M2-8** Calendário              | **Concluído** — rota `/calendar`, issues agregados por `target_date`, filtros board  |
| **M2-9** Resumo rico             | **Concluído** — KPIs + atalhos às tabs + `GET …/boards/{slug}/meta/`                 |
| **M2-11** API modules + Gantt    | **Concluído** — `GET …/boards/{slug}/modules/` + hierarquia projeto → módulo → cards |
| **M2-12**                        | Polish transversal (Power K, DnD, limpeza)                                           | P2  | —   | **Concluído** ✓ (validado produto) |

---

## Princípios (não negociar)

1. **Board não é pai de Issue** — filtro sempre `project.board_id = board.id`.
2. **Permissões de projeto** — guest só vê issues de projetos a que tem acesso (reutilizar `_get_project_permission_filters()`).
3. **URLs de projeto inalteradas** — `/{ws}/projects/{id}/issues/...` continuam canónicas.
4. **Nomenclatura** — «Board» = time; layout Kanban de itens no projeto continua «quadro».
5. **Feature flag** — `VITE_ENABLE_BOARDS` até rollout completo do MVP-2.

---

## Mapeamento Jira ↔ Plane (vocabulário Tech4Humans)

**Regra fixa** acordada com produto (capturas Jira «Squad as a Service», maio/2026). Usar sempre estes termos em UI, docs e código.

| No Jira (o que vês)                                      | No Plane                             | Exemplo                      |
| -------------------------------------------------------- | ------------------------------------ | ---------------------------- |
| Espaço / organização                                     | **Workspace**                        | Tech4Humans                  |
| **Squad as a Service** (título do board + abas)          | **Board** (time)                     | Board `squad-as-a-service`   |
| **OPS-17** `[Allianz] Ouvidoria` — linha **pai** / épico | **Projeto**                          | Um cliente ou entrega grande |
| **OPS-18**, **OPS-45**, **OPS-307**… — filhos indentados | **Card** (`Issue`)                   | Trabalho dentro do projeto   |
| Subtarefa abaixo de um card                              | **Subtarefa** (`Issue` com `parent`) | Aninhável                    |

**Importante:** «épico» no Jira **não** é Módulo do Plane. O **épico de negócio = Projeto**. Módulos e Ciclos continuam opcionais _dentro_ do projeto.

```text
Workspace
└── Board (time)                    ex.: Squad as a Service
    └── Projeto (épico Jira)        ex.: OPS-17 → [Allianz] Ouvidoria
        ├── Card                    ex.: OPS-18, OPS-45
        └── Subtarefa               ex.: filho de OPS-18
```

O identificador **OPS** no Plane pertence ao **projeto**; **OPS-18** é o 18.º **card** desse projeto (não um segundo projeto).

### Implicações para o MVP-2

| Vista no board (time)        | O que mostra                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| **Sidebar**                  | Board → **projetos** (cada um ≈ um épico tipo OPS-17) — MVP-1                             |
| **Backlog / Lista / Quadro** | **Cards** agregados de vários projetos; filtro **Projeto** = qual épico                   |
| **Cronograma** (se incluído) | Linha de **1.º nível = projetos** do board; expandir = **cards** com datas (como no Jira) |

O board **não** tem entidade «cronograma» na BD — só vistas que leem projetos e issues dos projetos filhos (`project.board_id`).

---

## Mapa de entregas (prioridade)

| ID           | Entregável                                                | Prioridade | Referência Jira        | Status                                                        |
| ------------ | --------------------------------------------------------- | ---------- | ---------------------- | ------------------------------------------------------------- |
| **M2-0**     | Congelar UX das tabs + barra de filtros                   | P0         | Abas + filtros no topo | **Concluído**                                                 |
| **M2-1**     | API issues agregados estável                              | P0         | Lista cross-project    | **Concluído**                                                 |
| **M2-2**     | Filtros board (Projeto, Estado, Responsável, busca)       | P0         | Dropdown Projeto       | **Concluído**                                                 |
| **M2-3**     | Tab **Backlog** completa                                  | P0         | Backlog                | **Concluído**                                                 |
| **M2-4**     | Tab **Lista**                                             | P0         | Lista                  | **Concluído**                                                 |
| **M2-5**     | Tab **Quadro** (Kanban multi-projeto)                     | P0         | Quadro                 | **Concluído**                                                 |
| **M2-6**     | Tab **Cronograma** (timeline)                             | P1         | Cronograma             | **Concluído**                                                 |
| **M2-7**     | Escala timeline (Semanas / Meses / Trimestres)            | P1         | Zoom da timeline       | **Concluído**                                                 |
| **M2-8**     | Tab **Calendário**                                        | P2         | Calendário             | **Concluído**                                                 |
| **M2-9**     | Tab **Resumo** rica (KPIs, alertas)                       | P2         | Resumo                 | **Concluído**                                                 |
| **M2-10**    | Polish analytics / débito (meta coberto em **M2-9**)      | P2         | —                      | Fundido em M2-12                                              |
| **M2-11**    | `GET …/boards/{slug}/modules/` (épicos na timeline)       | P1         | Barras no Gantt        | **Concluído**                                                 |
| **M2-12**    | Polish transversal (Power K, DnD boards, limpeza `team*`) | P2         | —                      | **Concluído** ✓ (validado produto)                            |
| **M2-13…15** | Ícones (tabs, projeto, tipo)                              | —          | —                      | **Cancelado** (mai/2026)                                      |
| **M2-16**    | CRUD tipos de card                                        | P1         | Tipos de ticket Jira   | **Movido** → [BC-1](./tech4humans-board-config-mvp3-plano.md) |

**Estimativa:** 6–10 semanas (1–2 devs fullstack), após MVP-1 fechado.  
**M2-13–M2-15:** ~3–5 dias úteis (paralelizável com M2-12). **M2-16:** ~1–1,5 semanas.

**Roadmap MV3–MV5:** [tech4humans-roadmap-mv3-mv5.md](./tech4humans-roadmap-mv3-mv5.md) (Status Report, PRD, papéis custom).

---

## M2-13 a M2-15 — Paridade visual Jira (ícones) — **CANCELADO**

> Substituído por [tech4humans-board-config-mvp3-plano.md](./tech4humans-board-config-mvp3-plano.md) (BC-0…BC-4 + MV3). Secção mantida só como arquivo.

Referência: capturas Jira «Squad as a Service» (maio/2026) — tabs com ícone + linha pai com ícone de épico + cards com ícone de **tipo de issue**.

### O que já existe no fork (reutilizar)

| Necessidade            | No Plane hoje                                                                                   | Onde                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Tabs com ícone         | `TabNavigationList` / `TabNavigationItem` (`@operoz/propel/tab-navigation`)                     | Navegação de **projeto** (`tab-navigation-root.tsx`)    |
| Ícones de layout       | `OverviewIcon`, `ListLayoutIcon`, `BoardLayoutIcon`, `TimelineLayoutIcon`, `CalendarLayoutIcon` | `@operoz/propel/icons`                                  |
| «Épico» visual         | `EpicIcon` (`project.epic`) — **usar para Projeto no board**, não para issue `is_epic`          | `packages/propel/src/icons/project/epic-icon.tsx`       |
| Logo de projeto/board  | `Logo` + `logo_props`                                                                           | Já no header do board                                   |
| Tipo de card na BD     | `IssueType.logo_props`, `Issue.type_id`                                                         | `plane/db/models/issue_type.py`                         |
| Coluna «tipo» na lista | `displayProperties.issue_type`                                                                  | `list/block.tsx` (já previsto)                          |
| **Gap**                | `IssueTypeIdentifier` em CE devolve `<></>`                                                     | `ce/.../issue-identifier.tsx` — **bloqueio para M2-15** |

### Mapa Jira → Tech4Humans (ícones)

| Elemento no Jira     | No nosso produto | Ícone sugerido                                           |
| -------------------- | ---------------- | -------------------------------------------------------- |
| Tab Resumo           | Tab Resumo       | `OverviewIcon`                                           |
| Tab Cronograma       | Tab Cronograma   | `TimelineLayoutIcon`                                     |
| Tab Backlog          | Tab Backlog      | `ListLayoutIcon` ou ícone backlog dedicado               |
| Tab Quadro           | Tab Quadro       | `BoardLayoutIcon`                                        |
| Tab Lista            | Tab Lista        | `ListLayoutIcon` (variante ou mesmo com label distinto)  |
| Tab Calendário       | Tab Calendário   | `CalendarLayoutIcon`                                     |
| **OPS-17** (pai)     | **Projeto**      | `EpicIcon` **ou** `ProjectLogo` se `logo_props` definido |
| **OPS-4405** (filho) | **Card**         | Ícone do `IssueType` (`logo_props` do workspace)         |

**Não confundir:** «épico Jira» = **Projeto**; `IssueType.is_epic` no Plane é outro conceito (work item épico dentro do projeto).

---

### Etapa M2-13 — Ícones nas tabs do hub

**Objetivo:** dar a «outra cara» profissional às abas do board (como no Jira).

**Entregáveis:**

1. Config central `BOARD_HUB_TABS` (key, `href`, i18n key, `icon` component).
2. Refatorar `boards/[boardSlug]/header.tsx` para `TabNavigationList` + `BoardHubNavLink` com slot de ícone (16px, `text-secondary` / `text-primary` quando ativo).
3. Replicar ícones nos **atalhos** de `board-overview.tsx` (Resumo → mesma config).
4. Opcional P2: sublinhado no tab ativo (estilo Jira) em vez de só `bg-layer-2`.

**Ficheiros principais:**

- `apps/web/app/(all)/.../boards/[boardSlug]/header.tsx`
- `apps/web/core/components/board/board-hub-tabs.ts` (novo)
- `apps/web/core/components/board/board-overview.tsx`
- `packages/i18n` — sem chaves novas se só ícones

**Critério de pronto:** todas as 6 tabs mostram ícone + label; tab ativa óbvia; navegação sem regressão React 19 (`BoardHubNavLink` mantém `startTransition`).

**PARAR → OK explícito antes de M2-14.**

---

### Etapa M2-14 — Ícone de Projeto (épico Jira)

**Objetivo:** na hierarquia agregada, a linha **Projeto** (ex. `OPS-17`) tem ícone distinto dos cards filhos.

**Entregáveis:**

1. Componente `BoardProjectIcon` — prioridade: `ProjectLogo` / `logo_props`; fallback fixo `EpicIcon` (cor tema, ~16px).
2. **Cronograma:** `BoardProjectSidebarBlock` — ícone antes do identificador (substituir só texto).
3. **Lista / Backlog / Quadro / Calendário:** reforçar badge de projeto existente com ícone (não só `ProjectLogo` pequeno onde já existe).
4. **Sidebar MVP-1:** opcional — ícone ao lado de cada projeto no board.
5. Tooltip/i18n: «Projeto» (nunca «Épico» na UI do board).

**Ficheiros principais:**

- `apps/web/core/components/board/board-project-icon.tsx` (novo)
- `apps/web/core/components/gantt-chart/sidebar/board-grouped/project-block.tsx`
- `apps/web/core/components/issues/issue-layouts/**` (badges cross-project)
- `apps/web/core/components/workspace/sidebar/board-projects-list.tsx` (opcional)

**Critério de pronto:** em timeline com ≥2 projetos, utilizador distingue linha pai (projeto) de card filho só pelo ícone + indentação.

**PARAR → OK antes de M2-15.**

---

### Etapa M2-15 — Ícone de tipo de card (`IssueType`) — só exibição

**Objetivo:** cada card mostra o ícone do **tipo** (Task, Bug, História, Deploy…), como OPS-4405 no Jira.  
**Não inclui** criar/editar tipos — isso é **M2-16** (admin). M2-15 pode usar tipos já seeded no workspace até M2-16 existir.

**Pré-requisito (débito CE):** implementar de verdade `IssueTypeIdentifier` (hoje stub vazio).

**Backend / dados (validar uma vez):**

- Workspace tem `IssueType` com `logo_props` configurados (God mode / settings).
- Issues do board trazem `type_id` no serializer (já vem em issues agregados se igual ao workspace issues).

**Entregáveis:**

1. **Store ou hook** `useIssueType(issueTypeId)` — mapa `id → { name, logo_props }` por workspace (fetch `GET …/issue-types/` ou equivalente já existente no fork).
2. **`IssueTypeIdentifier`** — render `Logo` 14–16px + tooltip com nome do tipo; tamanhos `xs` | `sm` alinhados a `IssueIdentifier`.
3. Ativar `issue_type: true` nas **display properties por defeito** das vistas board (`BOARD` store / filtros).
4. Inserir ícone à esquerda do identificador em:
   - lista e backlog (`list/block.tsx`);
   - quadro (`kanban` card);
   - sidebar do cronograma (`IssuesSidebarBlock` / `IssueGanttSidebarBlock`);
   - calendário (`issue-block.tsx`);
   - peek / modal (já chamam `IssueTypeIdentifier` — passam a funcionar).
5. **Filtro Tipo** (opcional nesta etapa ou M2-12): dropdown com ícone + nome (`FilterIssueTypes` deixa de ser stub).

**Tipos Tech4Humans (produto):** alinhar com equipa a lista de `IssueType` no workspace (ex.: Kickoff, Imersão, Desenvolvimento, Homologação, Deploy…) — espelhar nomenclatura Jira; ícones via `logo_props` no admin Plane.

**Ficheiros principais:**

- `apps/web/ce/components/issues/issue-details/issue-identifier.tsx` (implementação real)
- `apps/web/core/store/issue-type/` ou extensão store existente (novo se necessário)
- layouts board: `board-backlog`, `board-list`, `board-kanban`, gantt sidebar, calendar
- `packages/types` — sem mudança se `type_id` já existe

**Critério de pronto:** na lista do board, cada linha mostra **[tipo] [OPS-18] título**; tipos diferentes têm ícones diferentes; guest sem `type_id` não quebra layout.

**PARAR → OK antes de M2-16 ou fecho visual.**

---

### Etapa M2-16 — Tipos de card personalizáveis (admin)

**Objetivo:** ADMIN configura tipos no board (nome + ícone), estilo «gerir etiquetas», mas **tipo ≠ etiqueta** — ver [roadmap MV3–MV5](./tech4humans-roadmap-mv3-mv5.md#tipo-de-card-vs-etiqueta-decisão-de-produto).

**Resumo técnico:** reutilizar `IssueType` + nova tabela `BoardIssueType`; settings em `/{ws}/settings/boards`; API CRUD só ADMIN; sincronizar `ProjectIssueType` nos projetos do board; implementar stubs CE (`IssueTypeSelect`, etc.).

**Critério de pronto:** admin cria «Deploy» com ícone; membro vê no dropdown ao criar card; guest não edita catálogo.

**PARAR → OK antes de considerar MVP-2 fechado em produto.**

---

### Ordem e PRs sugeridos (ícones + tipos)

| PR        | Conteúdo                        | Depende de          |
| --------- | ------------------------------- | ------------------- |
| PR-M2-13  | Tabs + overview atalhos         | —                   |
| PR-M2-14  | Projeto / épico visual          | — (paralelo com 13) |
| PR-M2-15a | Store + `IssueTypeIdentifier`   | —                   |
| PR-M2-15b | Board layouts + display default | PR-M2-15a           |

**Ordem recomendada:** M2-13 → M2-14 → M2-15 (13 e 14 podem ser um único PR se quiseres menos paragens).

### Critérios de aceite extra (MVP-2 + ícones)

- [ ] Tabs do board com ícone (6 vistas)
- [ ] Linha de projeto no cronograma com ícone distinto dos cards
- [ ] Cards com ícone de `IssueType` quando `type_id` presente
- [ ] Sem regressão de performance (ícones são SVG/`Logo`, sem N+1 de API — cache no store)

### Fora deste bloco (pós-MVP-2)

- Ícones de integrações Jira (Code, Deployments, Formulários…)
- Import automático de ícones Jira → `logo_props`
- Tabs extras (Tickets arquivados, Checklist) — não estão no hub atual

---

## Etapas de desenvolvimento (com paragens)

### Etapa M2-0 — Design UX do hub (sem código de produto) — **Concluído**

**Entregáveis:**

- Wireframe das tabs: Resumo | Backlog | Lista | Quadro | Cronograma | Calendário
- Barra de filtros sticky (Projeto multi-select, Estado, Responsável, Prioridade, pesquisa)
- Empty states por tab
- Decisão: badge de **projeto** em cada card na vista agregada
- Decisão: colunas do Kanban board (estados por projeto vs mapa global do workspace)

**Critério de pronto:** aprovação explícita («aprovado M2-0»).

**Status:** concluído (maio/2026).

---

### Etapa M2-1 — API: issues agregados por board — **Concluído**

**Objetivo:** contrato estável; não depender só de query em workspace issues.

| Método | Path                                                 | Notas                                                          |
| ------ | ---------------------------------------------------- | -------------------------------------------------------------- |
| GET    | `/api/workspaces/{slug}/boards/{board_slug}/issues/` | Paginação; mesmo serializer que workspace issues               |
| —      | Query params                                         | `project_id`, `state`, `assignee`, `priority`, datas, `search` |

**Implementação sugerida:**

- Novo `apps/api/operoz/app/views/board/issues.py` (copiar `WorkspaceViewIssuesViewSet`)
- Queryset: `Issue` onde `project__board_id = board.id` + filtros de permissão existentes
- Manter compat `?board_slug` em workspace issues até M2-3 migrar o front

**Testes:** guest em projeto privado não vê issues; board de outro workspace → 404.

---

### Etapa M2-2 — Filtros no frontend (contexto board) — **Concluído**

**Ficheiros (previstos):**

- `board-issues-filter-bar.tsx` (novo)
- Extender `BoardIssuesFilterStore` com `project_ids[]`, persistência por `boardSlug`
- Dropdown projetos = apenas projetos do board (`getProjectIdsForBoard`)

**Critério:** alterar filtro Projeto refetch da lista.

---

### Etapa M2-3 — Backlog (completar fatia atual) — **Concluído**

**Já existe:** rota, store, `board-backlog-layout-root`, tab no header.

**Completar:**

- Integrar barra de filtros M2-2
- Layout lista alinhado ao backlog de projeto
- Agrupamento / ordenação mínima (prioridade ou estado)
- Indicador visual do projeto em cada linha
- Paginação infinita ou cursor

---

### Etapa M2-4 — Lista — **Concluído**

**Rota:** `/{workspace}/boards/{slug}/list`

- Reutilizar `IssueLayoutStore` com layout **list** e `EIssuesStoreType.BOARD`
- Tab no header + breadcrumb
- Mesmos filtros que backlog

---

### Etapa M2-5 — Quadro (Kanban multi-projeto) — **Concluído**

**Rota:** `/{workspace}/boards/{slug}/views` (nome final definido no M2-0)

- Colunas conforme decisão M2-0 (estados por projeto vs normalizados)
- Drag entre colunas: PATCH issue com `state` do projeto da issue
- Cartão: projeto + identificador (ex. `OPS-17`)

---

### Etapa M2-6 — Cronograma (timeline) — **Concluído** (aguarda validação produto)

**Entregue:**

- Rota `/{workspace}/boards/{slug}/timeline` + tab no header
- `BoardTimelineLayoutRoot` — fetch issues do board, filtros Gantt, layout
- `BoardGanttRoot` → `GANTT_TIMELINE_TYPE.GROUPED` + `BoardGroupedTimelineStore`
- **Hierarquia Jira:** 1.º nível = **projetos** do board (barra agregada min/max das datas dos cards); **expandir/colapsar** (chevron) revela **cards** indentados
- Barras de projeto: intervalo derivado dos issues visíveis (fallback `start_date`/`target_date` do projeto se existirem)
- Filtro Projeto via `BoardLevelWorkItemFiltersHOC` / `WorkItemFiltersRow` (refetch API)
- Arrastar datas nos **cards** multi-projeto (`updateBlockDates` por `project_id`)
- Botão **Hoje** no header do Gantt (`showToday`)
- Issues sem data: linha na sidebar com `—`; `showAllBlocks` ativo

**Fora de M2-6 (etapas seguintes):**

| Item                                                              | Etapa       |
| ----------------------------------------------------------------- | ----------- |
| API `GET …/boards/{slug}/modules/` para barras tipo «módulo Jira» | **M2-11** ✓ |
| Toggle Semanas / Meses / Trimestres + preferência persistida      | **M2-7** ✓  |

---

### Etapa M2-7 — Escala da timeline — **Concluído**

**Já existia (reutilizado no board):**

- Toggle **Semana | Mês | Trimestre** no header do Gantt (`GanttChartHeader` + `VIEWS_LIST`)
- Botão **Hoje** — centra a timeline na data atual (`handleToday`)
- Preferência em `localStorage` (`plane_gantt_chart_view_preferences`), chave `workspace::scope` (`board:{slug}`, `project:{id}`, `module:…`, etc.)

**Correções nesta etapa:**

- `withGanttChartFocusDate` — quando não há `targetDate` (scroll horizontal), usa `currentDate` do chart em vez de `Invalid Date`
- `updateCurrentViewRenderPayload` em `useCallback` — troca de escala e «Hoje» estáveis; barras recalculam posição via `refreshBlockPositions`
- Efeito de restauração da preferência — só ao mudar workspace/scope (evita re-inicializar em loop)

**PARAR → pedir OK para M2-9+**

---

### Etapa M2-8 — Calendário (P2) — **Concluído**

**Entregue (validado no código, maio/2026):**

- Rota `/{workspace}/boards/{slug}/calendar` (`core.ts` + `calendar/page.tsx`)
- Tab **Calendário** no `BoardOverviewHeader`
- `BoardCalendarLayoutRoot` — `fetchFilters` com `preferredLayout: CALENDAR`, `BoardLevelWorkItemFiltersHOC`, `IssuePeekOverview`
- `BoardCalendarRoot` → `BaseCalendarRoot` com `EIssuesStoreType.BOARD`
- Fetch agregado: `GET …/boards/{slug}/issues/` com paginação `groupedBy: "target_date"` e intervalo mês/semana (`getCalendarPaginationOptions`)
- DnD entre dias atualiza `target_date` (e `start_date` quando aplicável) por `project_id`
- Badge de projeto nos cards (`issue-block.tsx` + `ProjectLogo`)
- i18n PT/EN: `boards.tab_calendar`, `boards.calendar_title`

**PARAR → pedir OK para M2-9+**

---

### Etapa M2-9 — Resumo rico (P2) — **Concluído**

**API:** `GET …/boards/{slug}/meta/` (`BoardMetaViewSet`) — contagens com permissões de projeto/guest:
`projects_count`, `total_issues`, `pending_issues`, `completed_issues`, `overdue_issues`, `due_this_week`, `without_target_date`, `state_distribution`.

**UI:** `BoardOverview` — grelha de KPIs (SWR), alertas clicáveis (lista / cronograma), atalhos para Backlog, Lista, Quadro, Cronograma, Calendário; lista de projetos mantida.

**PARAR → pedir OK para M2-12**

---

### Etapa M2-11 — API modules + cronograma — **Concluído**

**API:** `GET …/boards/{slug}/modules/` (`BoardModulesViewSet`) — módulos dos projetos do board acessíveis ao utilizador; query `project_id` opcional (CSV).

**Cronograma:** hierarquia **Projeto → Módulo → Cards** quando existem módulos no projeto; cards com `module_ids` agrupados; sem módulo mantém cards diretamente sob o projeto.

**PARAR → pedir OK para M2-12**

---

### Etapa M2-12 — Polish e débito (ex-M2-10) — **Concluído** ✓ (validado produto, maio/2026)

| Item         | Entregue                                                                           |
| ------------ | ---------------------------------------------------------------------------------- |
| Power K      | `open_board` (ob), `open_board_backlog` (obb) — menu de boards no Power K          |
| DnD sidebar  | Reordenar **boards** (ADMIN) e **projetos dentro do board** (arrastar pelo handle) |
| Limpeza      | Removido `board-sidebar-project-item.tsx`; `@deprecated` em `ce/store/issue/team*` |
| i18n         | `boards.reorder_failed` PT/EN; chaves Power K em EN                                |
| Teste manual | Ver checklist abaixo (sem Playwright no repo web)                                  |

**Checklist de validação M2-12:**

1. Power K (`Ctrl+K`) → «Open a board» / «Open a board backlog» → escolher board → navega certo.
2. Sidebar: arrastar handle de um board (como ADMIN) → ordem persiste após refresh.
3. Sidebar: arrastar projeto dentro de um board → ordem persiste.
4. `pnpm dev` + API Docker a correr; sem erros no console ao usar boards.

**PARAR → pedir OK para M2-13.**

---

## Rotas alvo (`apps/web/app/routes/core.ts`)

```text
:workspaceSlug/boards/:boardSlug              → Resumo        (M2-9 ✓)
:workspaceSlug/boards/:boardSlug/backlog      → Backlog       (M2-3 ✓)
:workspaceSlug/boards/:boardSlug/list         → Lista         (M2-4 ✓)
:workspaceSlug/boards/:boardSlug/views        → Quadro        (M2-5 ✓)
:workspaceSlug/boards/:boardSlug/timeline     → Cronograma    (M2-6 ✓)
:workspaceSlug/boards/:boardSlug/calendar     → Calendário    (M2-8 ✓)
```

---

## Ordem sugerida de PRs

| PR      | Conteúdo                             | Depende de                |
| ------- | ------------------------------------ | ------------------------- |
| PR-M2-1 | API `boards/{slug}/issues/` + testes | M2-0                      |
| PR-M2-2 | Filtros UI + store → nova API        | PR-M2-1                   |
| PR-M2-3 | Backlog completo                     | PR-M2-2                   |
| PR-M2-4 | Lista                                | PR-M2-2                   |
| PR-M2-5 | Quadro Kanban                        | PR-M2-2 + decisão estados |
| PR-M2-6 | API modules + timeline               | PR-M2-1                   |
| PR-M2-7 | Timeline UI + escala                 | PR-M2-6                   |
| PR-M2-8 | Calendário + Resumo + meta           | opcional                  |
| PR-M2-9 | Polish                               | fim                       |

---

## Critérios de aceite (MVP-2 fechado)

- [ ] Entrar em `/boards/{slug}/backlog` e ver issues de **vários** projetos do board
- [ ] Filtrar por um ou mais projetos sem sair do board
- [ ] Guest: só issues de projetos permitidos
- [ ] Abrir issue → detalhe no projeto; voltar mantém filtros do board
- [x] Lista e Quadro com badge de projeto (M2-4 / M2-5)
- [ ] Cronograma com itens de ≥2 projetos (P1) — **M2-6**
- [ ] Sem regressão: sidebar MVP-1, criar projeto com board, analytics por board
- [ ] `pnpm exec tsc -p apps/web/tsconfig.json --noEmit` sem erros novos
- [ ] Testes API: permissões + filtro `project_id`

---

## Fora de escopo (pós-MVP-2)

- `BoardMember` e permissão por board
- Integrações Jira (Deployments, Code)
- Space com URL pública por board
- Import Jira board → Plane board
- Notificações «resumo do board»

---

## Riscos e decisões (fechar no M2-0)

| Tema                        | Opções                                      | Impacto     |
| --------------------------- | ------------------------------------------- | ----------- |
| Colunas do Kanban board     | Estados por projeto vs mapa global          | M2-5        |
| Identificação cross-project | `project.identifier` + título em cada card  | UX          |
| Performance                 | N projetos × M issues — paginação e índices | API         |
| Nome da rota do quadro      | `/views` vs `/board` vs `/kanban`           | Rotas, i18n |

---

## Próximo passo recomendado

**Atual:** Hub MVP-2 fechado (M2-12 validado). Trabalho seguinte = **[Config board + MV3](./tech4humans-board-config-mvp3-plano.md)** (M2-13…15 cancelados).

Ordem: **BC-0** → **BC-1** (tipos card) → **BC-2** (campos) → **BC-3** (schema Projeto) → **BC-4** (acesso) → **MV3** (Status Report).

Diz **«pode seguir BC-0»** (ou outra etapa) quando quiseres implementar.
