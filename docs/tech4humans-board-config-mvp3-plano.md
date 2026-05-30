# Tech4Humans — Configuração do Board + Status Report (plano mestre)

**Data:** maio/2026  
**Contexto:** Referência Jira «Configurações do espaço» ([NOVO] Squad as a Service).  
**Modo atual:** **implementação** — Fases 1–4 em código; Fases 5–10 aguardam OK por fase.  
**Decisão de produto:** **M2-13, M2-14 e M2-15 (ícones)** **cancelados** — foco em configuração operacional do board + **Status Report**.

**Documentos relacionados:**

- [tech4humans-boards-mvp2-plano.md](./tech4humans-boards-mvp2-plano.md) — hub e vistas (M2-0…M2-12 concluídos)
- [tech4humans-roadmap-mv3-mv5.md](./tech4humans-roadmap-mv3-mv5.md) — MV4 PRD, MV5 RBAC
- [jira-vs-plane-comparativo.md](./jira-vs-plane-comparativo.md)

**Regra de ouro:** terminar **uma fase** → validar com produto → **PARAR** → só avançar com OK explícito.

---

## Índice

| Secção | Conteúdo |
|--------|----------|
| [A. Contexto](#a-contexto-e-referência) | Vocabulário, o que já existe, sidebar Jira, fora de escopo |
| [B. Roadmap de fases](#b-roadmap-de-fases-resumo) | Tabela Fase 1…10 + ordem + dependências |
| [Fase 1](#fase-1--shell-e-informações-bc-0) | Shell settings + Informações |
| [Fase 2](#fase-2--tipos-de-card-bc-1) | Tipos de card |
| [Fase 3](#fase-3--campos-no-board-bc-2) | Campos custom |
| [Fase 4](#fase-4--schema-do-projeto-bc-3) | Schema do Projeto (épico) |
| [Fase 5](#fase-5--acesso-e-funções-bc-4) | Acessar, funções, permissões (completo) |
| [Fase 6](#fase-6--notificações-bc-5) | Notificações |
| [Fase 7](#fase-7--automação-bc-6) | Automação |
| [Fase 8](#fase-8--configuração-do-quadro-bc-7) | Config Quadro |
| [Fase 9](#fase-9--configuração-do-cronograma-bc-8) | Config Cronograma |
| [Fase 10](#fase-10--status-report-mv3) | Status Report |
| [C. Critérios globais](#c-critérios-de-aceite-globais) | Checklist MVP config + MV3 |
| [D. Decisões e planejamento](#d-decisões-em-aberto-e-próximo-passo) | Perguntas + próximos prints |

**Legenda IDs antigos:** `BC-0` = Fase 1, `BC-1` = Fase 2, … `BC-8` = Fase 9, `MV3` = Fase 10.

---

## A. Contexto e referência

### A.1 Vocabulário (fixo — não negociar na UI do board)

| No Jira | No Tech4Humans / Plane |
|---------|-------------------------|
| Espaço | **Workspace** |
| Squad / board Jira | **Board** (time) |
| Épico (OPS-17, linha pai) | **Projeto** |
| Story/Task (OPS-18…) | **Card** (`Issue`) |
| Tipo de ticket «Projeto» | **Schema do Projeto** (≠ `IssueType.is_epic`) |
| Kickoff, Deploy, Imersão… | **Tipos de card** (`IssueType` + catálogo do board) |

```text
Workspace
└── Board (time)                    ex.: Squad as a Service
    └── Projeto (épico Jira)        ex.: OPS-17 → [Allianz] Ouvidoria
        ├── Card                    ex.: OPS-18, OPS-45
        └── Subtarefa               ex.: filho de OPS-18
```

### A.2 O que já existe no fork (não repetir)

| # | Pedido | Estado no fork |
|---|--------|----------------|
| **1** | Configuração do espaço (nome, chave, ícone…) | **Workspace** + `/{ws}/settings/boards` (lista de boards) |
| Hub | Backlog, Lista, Quadro, Cronograma, Calendário, Resumo | **M2-3…M2-9** ✓ |
| API agregada | Issues, meta, modules | **M2-1, M2-9, M2-11** ✓ |
| Filtros no board | Projeto, estado, responsável… | **M2-2** ✓ |

**Princípios herdados (MVP-2):**

1. Board não é pai de Issue — filtro `project.board_id`.
2. Permissões de projeto — guest só vê projetos permitidos.
3. URLs de projeto inalteradas.
4. Nomenclatura: Board = time; Kanban de projeto = «quadro».
5. Feature flag `VITE_ENABLE_BOARDS` até rollout completo.

### A.3 Menu lateral Jira — inventário completo (validado produto)

**Fonte:** print «Configurações do espaço» aberta (maio/2026).  
**Decisão:** implementar **tudo** desta lista, **exceto** «Cadeia de ferramentas» e «Apps».

#### Cabeçalho da sidebar (não clicável)

| Elemento Jira | Plane (Fase 1) |
|---------------|----------------|
| Título «Configurações do espaço» | **Configurações do board** |
| Nome `[NOVO] Squad as a Service` | Nome do **board** + logo |
| Subtítulo «Espaço de software» | Opcional: «Board» / «Time» |

#### Breadcrumb

`Espaços / [NOVO] Squad as a Service / Configurações do espaço`  
→ `Workspace / {board} / Configurações do board`

#### Mapa sidebar → Fase → Rota

| # | Item Jira | Subitens | Fase | Rota Plane |
|---|-----------|----------|------|------------|
| 1 | **Informações** | Detalhes | **1** | `…/settings/boards/{slug}` |
| 2 | **Acessar** | — | **5** | `…/acesso` |
| 3 | **Notificações** ▼ | Configurações; Auditoria de e-mails | **6** | `…/notificacoes`, `…/auditoria-email` |
| 4 | **Automação** | — | **7** | `…/automacao` |
| 5 | **Campos** | — | **3** | `…/campos` |
| 6 | **Tipos de ticket** ▼ | lista abaixo | **2** + **4** | `…/tipos`, `…/tipos/projeto` |
| 7 | **Funções** | — | **5** | `…/funcoes` |
| 8 | **Quadro** ▼ | TBD (prints) | **8** | `…/quadro` |
| 9 | **Cronograma** | TBD (prints) | **9** | `…/cronograma` |
| — | ~~Cadeia de ferramentas~~ | — | **Fora** | — |
| — | ~~Apps~~ | Checklist Jira, etc. | **Fora** | — |

#### Submenu «Tipos de ticket»

| Item Jira | Plane | Fase |
|-----------|-------|------|
| **Projeto** | Schema do **Projeto** | **4** |
| Backlog, Deploy, Desenvolvimento, Homologação ext./int., Imersão, Kickoff, Operação assistida, Sustentação, Tarefa | Tipos de **card** | **2** |
| **+ Adicionar tipo do ticket** | Criar tipo de card | **2** |

#### Página «Informações» / Detalhes (campos — implementados na Fase 1)

| Campo Jira | Fase 1 v1 | Notas |
|------------|-----------|-------|
| Ícone + «Alterar ícone» | Sim | `logo_props` |
| Nome * | Sim | `board.name` |
| Chave do espaço * (OPS) | Sim | `board.slug` (read-only após criar?) |
| Categoria | A definir | Pode ficar fora v1 |
| Proprietário do espaço | A definir | «Lead do board»? |
| Responsável padrão | A definir | Default assignee em novos cards? |
| Salvar (disabled até mudar) | Sim | Padrão Plane settings |

### A.4 Fora de escopo e cancelamentos

| Item | Motivo |
|------|--------|
| **M2-13, M2-14, M2-15** | Ícones (tabs, projeto, tipo) — cancelado mai/2026 |
| **Cadeia de ferramentas** | Confirmado fora |
| **Apps** (Checklist Jira, etc.) | Confirmado fora |
| **M2-16** | Renomeado → **Fase 2** (tipos de card) |

---

## B. Roadmap de fases (resumo)

### B.1 Tabela mestra

| Fase | ID legado | Nome | Sidebar Jira | Prioridade | Estimativa | Estado planejamento |
|------|-----------|------|--------------|------------|------------|---------------------|
| **1** | BC-0 | Shell + Informações | Informações + menu completo | P0 | 3–5 d | ✓ detalhado |
| **2** | BC-1 | Tipos de card | Tipos de ticket (exc. Projeto) | P0 | 1–1,5 sem | ✓ detalhado |
| **3** | BC-2 | Campos no board | Campos | P0 | 1,5–2 sem | ✓ detalhado |
| **4** | BC-3 | Schema do Projeto | Tipos → Projeto | P0 | 1–1,5 sem | ✓ detalhado |
| **5** | BC-4 | Acesso e funções | Acessar + Funções | P1 | 2–6 sem | ✓ detalhado (prints) |
| **6** | BC-5 | Notificações | Notificações ▼ | P1 | ~1 sem | ⏳ aguarda prints |
| **7** | BC-6 | Automação | Automação | P1 | 1–2 sem | ⏳ aguarda prints |
| **8** | BC-7 | Config Quadro | Quadro ▼ | P2 | TBD | ⏳ aguarda prints |
| **9** | BC-8 | Config Cronograma | Cronograma | P2 | TBD | ⏳ aguarda prints |
| **10a** | MV3 | Status Report (estrutura fixa) | (hub) | P1 | 2–3 sem | ✓ detalhado — **MVP atual** |
| **10b+** | MV3.1 | Modelos dinâmicos de report | settings ou hub | P1 | +1–3 sem | ✓ esboço §10.8 — **após OK 10a** |
| **11** | MV6 | **Rebranding Kortex** (marca UI; `@kortex/*` opcional) | — | P2 | ~1–3 sem | ✓ [roadmap MV6](./tech4humans-roadmap-mv3-mv5.md#mv6--rebranding-kortex-fecho-do-mvp) — **última fase do MVP** |

### B.2 Ordem recomendada de implementação (após planejamento fechado)

```text
Fase 1  — shell + Informações + links placeholder para todo o menu
    ├── Fase 2  — tipos de card
    ├── Fase 3  — campos ──────────────┐
    │                                  ├──► Fase 4 — schema Projeto
    ├── Fase 5  — acesso + funções
    ├── Fase 6  — notificações
    ├── Fase 7  — automação
    ├── Fase 8  — config quadro (prints)
    └── Fase 9  — config cronograma (prints)
Fase 10a — Status Report v1 (estrutura fixa; após Fase 1; ideal após 2–3)
Fase 10b+ — Modelos dinâmicos de report (pós-MVP 10a; ver §10.8)
    └── Fases 6–9 — notificações, automação, configs (conforme prints)
    └── Fase 11 — Rebranding Kortex (MV6; ver roadmap — **fecho do MVP**)
```

### B.3 Dependências entre fases

| Fase | Depende de | Motivo |
|------|------------|--------|
| 1 | MVP-2 hub (M2-12) | Header board, rotas |
| 2 | 1 | Menu `…/tipos` |
| 3 | 1 | Menu `…/campos` |
| 4 | 3 | Campos disponíveis para layout Projeto |
| 5 | 1 | Menu `…/acesso`, `…/funcoes` |
| 6–9 | 1 | Itens na sidebar |
| 10a | 1; ideal 2–3 | Meta + campos no report (estrutura fixa) |
| 10b+ | 10a + OK produto | Modelos de report configuráveis (secções, templates) |
| 11 | 10a estável; ideal 4–5 ou 10b+ fechados | Não quebrar imports/features; só marca (e opcional renome npm) |

---

## Fase 1 — Shell e Informações (BC-0)

**Objetivo:** entrada única nas configurações do board, como Jira «Configurações do espaço», com **menu lateral completo** e página **Informações** funcional.

### 1.1 Entrada no hub (validado — Jira)

No header do board (`BoardOverviewHeader`), menu **`⋯`** ao lado do nome:

| Item menu Jira | Plane Fase 1 |
|----------------|--------------|
| **Configurações do espaço** (engrenagem) | **Configurações do board** → `/{ws}/settings/boards/{boardSlug}` |
| Remover de marcados com estrela | Fora (ou favoritos WS) |
| Adicionar pessoas | Opcional: atalho → Fase 5 `…/acesso` |
| Salvar como template | Fora |
| Definir plano de fundo | Fora |
| **Arquivar espaço** | Sim — atalho (já existe em WS settings) |
| Excluir espaço | Fora v1 (ou só ADMIN) |
| Espaço de software | Fora |

**Código alvo:** `apps/web/app/(all)/…/boards/[boardSlug]/header.tsx` — hoje só breadcrumb + tabs; falta `CustomMenu` `⋯`.

### 1.2 Árvore de rotas (todas criadas na Fase 1; conteúdo real só onde indicado)

```text
/{workspaceSlug}/settings/boards/{boardSlug}/
  ├── (default)                 → Informações / Detalhes     [Fase 1: formulário]
  ├── acesso                    → placeholder → Fase 5
  ├── notificacoes              → placeholder → Fase 6
  │   └── auditoria-email       → placeholder → Fase 6
  ├── automacao                 → placeholder → Fase 7
  ├── campos                    → placeholder → Fase 3
  ├── tipos                     → placeholder → Fase 2
  │   └── projeto               → placeholder → Fase 4
  ├── funcoes                   → placeholder → Fase 5
  ├── quadro                    → placeholder → Fase 8
  └── cronograma                → placeholder → Fase 9
```

### 1.3 UI shell

- Layout settings: sidebar esquerda + área de conteúdo (copiar padrão `settings/projects/[projectId]/layout.tsx`).
- Breadcrumb: `Workspace / {board} / Configurações do board`.
- Sidebar: **todos** os itens da tabela A.3 (exceto Apps/Cadeia).
- Submenus expansíveis: **Notificações**, **Tipos de ticket** (e **Quadro** quando Fase 8 tiver subitens).
- Páginas não-Fase-1: título correto + «Em breve» ou empty state.

### 1.4 Conteúdo «Informações» (única página com formulário na Fase 1)

Ver tabela em [A.3 — Página Informações](#página-informações--detalhes-campos--implementados-na-fase-1).

### 1.5 Critérios de pronto — Fase 1

- [ ] ADMIN: `⋯` → Configurações do board abre settings.
- [ ] Sidebar mostra **9 blocos** Jira (sem Apps/Cadeia) na ordem correta.
- [ ] Informações: editar nome, slug (regra definida), ícone, Salvar.
- [ ] MEMBER/GUEST: 403 ou redirect em settings do board.
- [ ] Cada item do menu navega para rota correta (placeholder OK).

**PARAR → OK explícito antes de Fase 2.**

---

## Fase 2 — Tipos de card (BC-1, ex-M2-16)

**Objetivo:** catálogo de tipos de **card** do board (Kickoff, Deploy…), CRUD só ADMIN, sync com projetos.

**Referência Jira:** sidebar «Tipos de ticket» — **não** inclui «Projeto» (Fase 4).

### 2.1 Lista seed (alinhar Jira)

Backlog, Deploy, Desenvolvimento, Homologação externa, Homologação interna, Imersão, Kickoff, Operação assistida, Sustentação, Tarefa.

### 2.2 Entregáveis

| Área | Detalhe |
|------|---------|
| Modelo | `IssueType` + `BoardIssueType` ([roadmap MV3–MV5](./tech4humans-roadmap-mv3-mv5.md)) |
| API | CRUD `GET/POST/PATCH/DELETE …/boards/{slug}/issue-types/` — só ADMIN escreve |
| UI | Lista, criar, editar nome/ícone (`logo_props`), ativar/desativar, ordem |
| Produto | Novo card: só tipos habilitados no board; novo projeto no board → sync `ProjectIssueType` |
| CE | `IssueTypeSelect`, `FilterIssueTypes` (stubs vazios hoje) |

### 2.3 Onde fica na UI

```text
Configurações do workspace → Boards → [Board] → Tipos de card
ou
/{ws}/settings/boards/{slug}/tipos
```

### 2.4 Critérios de pronto — Fase 2

- [ ] ADMIN cria tipo «Deploy» com ícone.
- [ ] MEMBER vê tipo no criar card (projetos do board).
- [ ] Desativar tipo não quebra cards antigos (`type_id` histórico).
- [ ] ≥2 boards podem ter catálogos diferentes.

**PARAR → OK antes de Fase 3.**

---

## Fase 3 — Campos no board (BC-2)

**Objetivo:** campos custom **reutilizáveis** nos projetos/cards do board (Cliente, Criticidade, datas de homologação…).

**Referência Jira:** «Campos» — tabela (Nome, Tipo, Descrição, Ações) + **Adicionar campo** + drawer checkboxes + **Criar campo novo**.

### 3.1 Entregáveis

| # | Entregável |
|---|------------|
| 1 | `BoardCustomField` ou extensão: quais custom fields do WS estão **ativos no board** |
| 2 | UI lista + remover do board |
| 3 | Drawer «Adicionar campos» — campos globais WS ainda não no board |
| 4 | «Criar campo novo» — tipos: texto curto, parágrafo, data, número, select, pessoas |
| 5 | Campos disponíveis para Fase 4 (Projeto) e Fase 2 (tipos) |

### 3.2 Notas técnicas

- Reutilizar mecanismo Plane de custom properties / issue properties (investigar EE vs fork antes de codar).
- **Fora v1:** campos «BLOQUEADO» estilo Jira Objetivos; integrações Checklist.

### 3.3 Critérios de pronto — Fase 3

- [ ] ADMIN adiciona campo «Cliente» (select) ao board.
- [ ] Campo aparece no formulário de card de projeto do board.

**PARAR → OK antes de Fase 4.**

---

## Fase 4 — Schema do Projeto (BC-3)

**Objetivo:** definir **que campos um Projeto (épico)** tem neste board — entidade **Projeto** Plane, não `IssueType`.

**Referência Jira:** «Tipos de ticket» → **Projeto** — «Campos de descrição» + «Campos de contexto»; drag-and-drop; obrigatórios; painel «Campos» à direita.

### 4.1 Entregáveis

| # | Entregável |
|---|------------|
| 1 | `BoardProjectFieldLayout` (ordem, obrigatório, secção descrição vs contexto) |
| 2 | Campos candidatos = Fase 3 + sistema (nome, responsável, datas, % conclusão…) |
| 3 | Criar/editar **Projeto** respeita layout |
| 4 | i18n: **Projeto**, nunca «Épico» no board |

### 4.2 Campos Jira (exemplo — validar com produto)

Resumo, Cliente, Descrição, Responsável, Desenvolvedor, Responsável (cliente), Pontos de atenção, Status, Controle de tempo, Start date, Data limite, % conclusão.

### 4.3 Critérios de pronto — Fase 4

- [x] ADMIN configura layout em `…/settings/boards/{slug}/tipos/projeto` (secções Descrição/Contexto, ordem, obrigatório, meia/largura total).
- [x] Campos sistema: nome, chave (só create), descrição, lead, assignee padrão, visibilidade, timezone.
- [x] Campos custom do board adicionáveis ao layout; valores em `ProjectCustomFieldValue`.
- [x] Criar/editar projeto com `board_id` usa layout dinâmico; validação de custom obrigatórios.
- [ ] Smoke test produto: marcar campo «Cliente» obrigatório e validar create + edit.

**Implementado (maio/2026):** migração `0131`, API `project-field-layout` / `project-form-layout` / `custom-field-values`, UI settings + formulários.

**PARAR → OK antes de Fase 5 (ou Fase 10 se priorizar report).**

---

## Fase 5 — Acesso e funções (BC-4)

**Objetivo:** paridade Jira em **Acessar** + **Funções** + funções custom com matriz de permissões.

**Referência:** prints maio/2026 (página, modais, scroll «Criar função»).  
**Sub-entregas documentadas:** 5.1 Página Acessar · 5.2 Adicionar pessoas · 5.3 Gerenciar funções · 5.4 Criar função · 5.5 Alternativa 4a.

**Rota:** `…/acesso`, `…/funcoes` (modal ou página).

---

### 5.1 Página «Acessar» (BC-4.1 — validado)

#### Cabeçalho

| Elemento Jira | Plane | Notas |
|---------------|-------|-------|
| Título **Acesso** | **Acesso** / «Acesso ao board» | |
| **Adicionar pessoas** (primário) | Igual | → 5.2 |
| **Gerenciar funções** (secundário) | Igual | → 5.3 |
| «Este espaço tem **69** funções» + ℹ️ | Contagem dinâmica | Só com 5.4b (funções custom) |

#### Bloco «Acesso ao espaço»

| Elemento Jira | Plane |
|---------------|-------|
| **Acesso ao espaço** | **Acesso ao board** |
| Estado **Limitado** | Board privado vs aberto no WS |
| **Alterar acesso ao espaço** | Fluxo mudança política |
| Caixa explicativa | Ver/comentar vs criar/editar (adaptar D3) |

#### Abas

| Aba | Plane |
|-----|-------|
| **Usuários atuais** | Lista principal |
| **Solicitações de acesso** (badge) | Fila pedidos ou empty state v1 |

**Pendente planejamento:** fluxo **Alterar acesso**; comportamento quando badge > 0.

#### Barra ferramentas

| Elemento Jira | Plane |
|---------------|-------|
| **Pesquisar funções** | **Pesquisar pessoas** (nome/e-mail) |
| **Select Funções** | Filtro multi: Administrador, Membro, Observador, Member (Com Delete)… |

#### Tabela

| Coluna | Comportamento |
|--------|---------------|
| **Nome** | Avatar + nome; ordenável |
| **E-mail** | |
| **Função** | Dropdown («Membro», «Várias (2 funções)»…) |
| **Ação** | **Remover** |

**Exemplos:** Alexandre do Amaral — Membro; Anderson Silveira — Várias (2 funções).

---

### 5.2 Modal «Adicionar pessoas» (BC-4.2 — validado)

| Campo / ação | Jira | Plane | Obr. |
|--------------|------|-------|------|
| **Nomes ou e-mails** | Multi + placeholder | Convite / pick membros WS | * |
| Google + chips sugestão | Sim | **Fora v1** | |
| **Função** | Dropdown default Membro | Funções 5.3 ou WS em 5.5a | * |
| reCAPTCHA | Sim | Fora | |
| **Cancelar** / **Adicionar** | | Igual | |

**Fluxo:** modal → e-mail/membro → função → Adicionar → linha na tabela 5.1.

---

### 5.3 Modal «Gerenciar funções» (BC-4.3 — validado)

| Função | Resumo | Ações |
|--------|--------|-------|
| **Administrador** | Settings, admins | Duplicar |
| **Convidado - Colaborador** | Um espaço; externo | Duplicar |
| **Membro** | Editar, colaborar | Duplicar |
| **Observador** | Ver, comentar | Duplicar |
| **Member (Com Delete)** | Membro + delete | Duplicar + **Eliminar** |

**Regra:** sistema → só duplicar; custom → duplicar + apagar.

**Rodapé:** **Criar função** (→ 5.4) · **Fechar**

---

### 5.4 Modal «Criar função» (BC-4.3b — validado)

**Fonte:** 5 prints scroll Jira. Substituir `{board}` pelo nome do board.

#### Formulário

| Campo | Obr. | UI |
|-------|------|-----|
| **Nome** | * | «Dê um nome único para a função» |
| **Descrição** | * | «Faça uma descrição breve…» |
| **As pessoas nessa função podem:** | — | Árvore checkboxes, scroll |
| **Atribua essa função a:** | opt. | Pesquisa nome/e-mail/grupo |
| **Criar** / **Descartar** | — | |

**Duplicar:** mesmo form pré-preenchido (ação 5.3).

#### Catálogo completo de permissões (`permission_key`)

| # | `permission_key` | Título Jira (PT) | Pai | Plane | Entrega |
|---|------------------|------------------|-----|-------|---------|
| 1 | `board.administer` | **Administrar** {board} | — | Settings, pessoas, tipos, campos | 5.4b-v1 |
| 2 | `items.manage` | **Gerenciar itens** {board} | — | Meta gestão cards | 5.4b-v1 |
| 2.1 | `items.watchers.manage` | Gerenciar lista de espectadores | 2 | Seguidores | 5.4b-v1 |
| 2.2 | `items.attachments.delete_any` | Excluir anexos (qualquer) | 2 | | 5.4b-v1 |
| 2.3 | `items.comments.delete_any` | Excluir comentários (qualquer) | 2 | | 5.4b-v1 |
| 2.4 | `items.delete` | Excluir itens (permanente) | 2 | Apagar card | 5.4b-v1 |
| 3 | `items.archive_any` | Arquivar qualquer item | — | | 5.4b-v2 |
| 4 | `items.restore_archived` | Restaurar arquivado | — | | 5.4b-v2 |
| 5 | `items.worklog.delete_any` | Excluir worklog (qualquer) | — | | P2 |
| 6 | `items.comments.edit_any` | Editar comentários (qualquer) | — | | 5.4b-v2 |
| 7 | `items.due_date.edit` | Editar datas de vencimento | — | `target_date` | 5.4b-v2 |
| 8 | `items.worklog.edit_any` | Editar worklog (qualquer) | — | | P2 |
| 9 | `items.reporter.modify` | Modificar relatores | — | | P2 |
| 10 | `sprints.manage` | **Gerenciar sprints** {board} | — | Ciclos | P2 |
| 11 | `versions.manage` | **Gerenciar versões** {board} | — | Releases | P2 |
| 12 | `dev_tools.access` | Ferramentas de desenvolvimento | — | | **Fora** |
| 13 | `items.work` | **Trabalhar nos itens** {board} | — | | 5.4b-v1 |
| 13.1 | `items.assign` | Atribuir qualquer item | 13 | Responsáveis | 5.4b-v1 |
| 13.2 | `items.worklog.delete_own` | Excluir worklog próprio | 13 | | P2 |
| 13.3 | `items.edit` | Editar qualquer item | 13 | Card + CF | 5.4b-v1 |
| 13.4 | `items.worklog.edit_own` | Editar worklog próprio | 13 | | P2 |
| 13.5 | `items.link` | Vincular qualquer item | 13 | Links | 5.4b-v1 |
| 13.6 | `items.worklog.log` | Registrar trabalho | 13 | Tempo | P2 |
| 13.7 | `items.restrict_visibility` | Restringir qualquer item | 13 | | P2 |
| 14 | `items.move` | Mover qualquer item | — | Outro projeto | P2 |
| 15 | `items.transition` | Transição de qualquer item | — | Estado | 5.4b-v1 |
| 16 | `items.create` | **Criar itens** {board} | — | | 5.4b-v1 |
| 17 | `items.collaborate` | **Colaborar nos itens** {board} | — | | 5.4b-v1 |
| 17.1 | `items.attachments.add` | Adicionar anexos | 17 | | 5.4b-v1 |
| 17.2 | `items.comments.add` | Adicionar comentários | 17 | | 5.4b-v1 |
| 17.3 | `items.attachments.delete_own` | Excluir anexos próprios (em card alheio) | 17 | | 5.4b-v1 |
| 17.4 | `items.comments.delete_own` | Excluir comentários próprios | 17 | | 5.4b-v1 |
| 17.5 | `items.comments.edit_own` | Editar comentários próprios | 17 | | 5.4b-v1 |
| 17.6 | `items.watchers.view` | Ver seguidores | 17 | | 5.4b-v1 |

**Total:** 11 grupos topo + 18 sub = **29 chaves**. Definir na implementação se checkbox pai grava flag ou só agrupa.

#### Textos de ajuda Jira (i18n `boards.permissions.*`)

- **Administrar:** acesso, pessoas, permissões, tipos, campos, funções projeto, excluir projeto.  
- **Gerenciar itens:** relatores, seguidores, comentários, anexos, worklog, excluir itens.  
- **Trabalhar nos itens:** editar, atribuir, transição, vincular, worklog.  
- **Colaborar:** comentar, anexar; sub-itens «próprios» em conteúdo alheio.  
- **Criar / Mover / Transição / Arquivar / Restaurar:** conforme títulos.

#### Sub-entregas técnicas 5.4b

| Sub | Chaves | Prazo indicativo |
|-----|--------|------------------|
| **5.4b-v1** | administer, create, edit, assign, transition, delete, collaborate+17.x, manage+2.1–2.4 | ~2–3 sem |
| **5.4b-v2** | archive, restore, due_date, edit/delete any comments/attachments | +1 sem |
| **5.4b-v3 / Fora** | sprints, versions, dev_tools, worklog*, move, restrict, reporter | P2 / fora |

#### Modelo de dados (esboço)

```text
BoardRole { board_id, name, description, is_system }
BoardRolePermission { role_id, permission_key, granted }
BoardMemberRole { board_id, user_id, role_id }   # N linhas = «Várias funções»
```

Funções sistema: `is_system=true`, não apagar; permissões pré-definidas.

---

### 5.5 Alternativa «BC-4a» (acesso simplificado)

| Entregável | Detalhe |
|------------|---------|
| Lista | Membros WS (herança D3) |
| Função | Só Admin / Member / Guest WS |
| Fora | Custom, multi-função, solicitações |

**Estimativa:** ~1 semana. Usar só se produto quiser adiar 5.4b.

### 5.6 Critérios de pronto — Fase 5

**Se 5.4b (recomendado):**

- [ ] Página Acessar conforme 5.1.
- [ ] Adicionar pessoas (5.2).
- [ ] Gerenciar + Criar + Duplicar função (5.3–5.4).
- [x] Matriz 5.4b-v1 enforced na API (cards + settings com `board.administer`). Ver `docs/tech4humans-board-roles-smoke-test.md`.
- [x] UI esconde ações sem permissão (`useBoardIssueCapabilities` + `GET …/board-permissions/`).
- [ ] Utilizador com 2 funções mostra «Várias (2 funções)».

**PARAR → OK antes de Fase 6.**

---

## Fase 6 — Notificações (BC-5)

**Objetivo:** configurações de notificação do board (paridade Jira sidebar **Notificações** ▼).

**Estado planejamento:** ⏳ **aguarda prints** do utilizador.

### 6.1 Subitens esperados (sidebar Jira — pré-documentado)

| Subitem Jira | Rota Plane | Estado |
|--------------|------------|--------|
| Configurações | `…/notificacoes` | ⏳ detalhar com print |
| Auditoria de e-mails | `…/notificacoes/auditoria-email` | ⏳ detalhar com print |

### 6.2 Placeholder entregáveis (atualizar após prints)

- Regras de e-mail / notificações por evento do board.
- Lista auditoria de e-mails enviados (se aplicável).

**Estimativa:** ~1 semana (após spec).

**PARAR → OK após inventário Jira completo (prints).**

---

## Fase 7 — Automação (BC-6)

**Objetivo:** regras de automação ao nível do board (Jira **Automação**).

**Estado planejamento:** ⏳ **aguarda prints**.

### 7.1 Placeholder

- Rota `…/automacao`.
- Possível reutilizar padrão `settings/projects/…/automations` adaptado ao board.

**Estimativa:** 1–2 semanas.

**PARAR → OK após prints + spec.**

---

## Fase 8 — Configuração do Quadro (BC-7)

**Objetivo:** settings do **Quadro** Kanban no contexto do espaço/board (Jira **Quadro** ▼) — distinto da tab hub «Quadro» (`/views`).

**Estado planejamento:** ⏳ **aguarda prints** (submenu Quadro em settings).

### 8.1 Placeholder

- Rota `…/quadro` (+ subrotas TBD).
- Pode incluir: colunas, swimlanes, card layout, filtros default — **definir com print**.

**Estimativa:** TBD.

---

## Fase 9 — Configuração do Cronograma (BC-8)

**Objetivo:** settings da **Cronograma** no espaço (Jira **Cronograma** em settings) — distinto da tab hub `/timeline`.

**Estado planejamento:** ⏳ **aguarda prints**.

### 9.1 Placeholder

- Rota `…/cronograma`.
- Pode incluir: escala default, campos na timeline, hierarquia — **definir com print**.

**Estimativa:** TBD.

---

## Fase 10 — Status Report (MV3)

**Objetivo:** relatório de status **periódico** do board para stakeholders — **não** duplicar Resumo ao vivo (M2-9).

**Decisão produto (mai/2026):** implementar primeiro **10a (v1 estrutura fixa)**; após conclusão e OK, evoluir para **modelos dinâmicos** (10b/10c) — ver [§10.8](#108-modelos-dinâmicos-pós-mvp--10b10c).

### 10.1 O que é / não é

| É | Não é |
|---|--------|
| Snapshot no tempo (semana/quinzena) | KPIs live do overview |
| Narrativa + métricas + export | Substituto do Resumo M2-9 |

### 10.2 Conteúdo v1

| Secção | Fonte |
|--------|-------|
| Cabeçalho | Board, período, autor, data publicação |
| Resumo executivo | Editor texto livre |
| Por projeto (épico) | Projetos board + % + issues período |
| Destaques / entregas | Issues concluídas (filtro data) |
| Riscos e bloqueios | Overdue / bloqueado (`meta/` + filtros) |
| Métricas | `GET …/boards/{slug}/meta/` + delta período anterior |
| Distribuição estado | `state_distribution` |

### 10.3 UI / rotas

```text
/{workspaceSlug}/boards/{boardSlug}/status-report
/{workspaceSlug}/boards/{boardSlug}/status-report/{reportId}
```

Tab no header do board ou link no Resumo — **decisão em aberto** (secção D).

### 10.4 API (novo)

| Método | Path |
|--------|------|
| GET | `…/boards/{slug}/status-reports/` |
| POST | `…/boards/{slug}/status-reports/` |
| GET/PATCH | `…/status-reports/{id}/` |
| GET | `…/status-reports/{id}/export/` (v1 = Markdown) |

**Modelo:** `BoardStatusReport` (`board_id`, `period_start`, `period_end`, `content`, `published_at`, `created_by`).

### 10.5 Permissões

| Ação | Quem |
|------|------|
| Ver publicados | MEMBER+; GUEST se projetos visíveis |
| Criar/editar/publicar | ADMIN v1 |
| Exportar | Quem pode ver |

### 10.6 Fora de 10a (v1)

- Email automático semanal  
- IA redige report  
- Confluence (MV3.1)  
- Comentários no report  
- **Modelos/templates customizáveis** → [§10.8](#108-modelos-dinâmicos-pós-mvp--10b10c) (pós-MVP)

**Estimativa 10a:** 2–3 semanas (ideal após Fases 2–3).

### 10.7 Critérios de pronto — Fase 10a (MVP)

- [ ] ADMIN gera report da semana, vê por projeto, exporta MD, consulta histórico.
- [ ] `content` em JSON com secções estáveis (preparado para templates futuros — ver 10.8.3).

**PARAR → OK produto na 10a → só então iniciar 10b ou MV4 (PRD).**

### 10.8 Modelos dinâmicos (pós-MVP — 10b/10c)

**Intenção:** depois da 10a fechada, permitir **padrões reutilizáveis** e **criação de modelos** pelo ADMIN (secções ligáveis, ordem, duplicar), sem refazer o núcleo de publicação/histórico/export.

| Sub-fase | Entregável | Estimativa |
|----------|------------|------------|
| **10b** | Biblioteca de modelos no board; 2–3 templates sistema; criar/editar/duplicar; ao criar report escolher modelo → rascunho pré-montado | +1–1,5 sem |
| **10c** | Builder: blocos extras, placeholders (`{{board.name}}`, métricas), «salvar report como modelo» | +1,5–2 sem |

#### 10.8.1 Ferramentas previstas (10b)

| Ferramenta | Descrição |
|------------|-----------|
| Lista de modelos | `…/boards/{slug}/status-report/modelos` (ou settings do board) |
| Editor de secções | Ligar/desligar e ordenar blocos (resumo, métricas, por projeto, entregas, riscos, estados) |
| Duplicar modelo | A partir de template sistema ou custom |
| Aplicar ao criar | `POST …/status-reports/` com `template_id` |

#### 10.8.2 Modelo de dados (esboço — 10b)

| Entidade | Campos principais |
|----------|-------------------|
| `BoardStatusReportTemplate` | `board_id`, `name`, `slug`, `sections` (JSON: `key`, `enabled`, `sort_order`), `is_system`, `created_by` |

Relação: `BoardStatusReport.template_id` (opcional, FK).

#### 10.8.3 Contrato `content` (10a → 10b)

Na **10a**, persistir `content` como JSON versionado, por exemplo:

```json
{
  "schema_version": 1,
  "sections": {
    "executive_summary": { "html": "..." },
    "metrics": { "snapshot": {} },
    "by_project": [],
    "highlights": [],
    "risks": [],
    "state_distribution": {}
  }
}
```

Objetivo: na 10b o template só define **quais chaves** entram e em que ordem; o motor de geração reutiliza o mesmo payload.

#### 10.8.4 Critérios de pronto — 10b (quando priorizado)

- [ ] ADMIN cria modelo custom no board (secções on/off + ordem).
- [ ] Novo report pode nascer a partir de modelo (dados auto + texto editável).
- [ ] Templates sistema não apagáveis; custom duplicáveis.

**Fora de 10b:** drag-and-drop visual de blocos arbitrários (10c); variáveis em texto livre (10c).

---

## C. Critérios de aceite globais

**«MVP Config Board + Status Report» fechado em produção:**

- [ ] **Fase 1:** settings board com menu completo (9 itens Jira, sem Apps/Cadeia) + Informações.
- [ ] **Fase 2:** tipos de card ADMIN.
- [ ] **Fase 3:** campos board + criar campo.
- [x] **Fase 4:** layout campos **Projeto** (aguarda smoke test produto).
- [ ] **Fase 5:** Acessar + funções (5.4a **ou** 5.4b acordado).
- [ ] **Fases 6–9:** conforme specs fechadas com prints.
- [ ] **Fase 10:** Status Report criar/publicar/histórico/export MD.
- [ ] **Fase 11 (MV6):** rebranding **Kortex** — UI sem marca Plane; ver [doc dedicado](./tech4humans-rebranding-remocao-plane.md).
- [ ] Hub M2-0…M2-12 sem regressão.
- [ ] Guest: sem settings board; pode ver report publicado se acesso aos projetos.

---

## D. Decisões em aberto e próximo passo

### D.1 Decisões produto (antes de codar)

| # | Pergunta | Opções |
|---|----------|--------|
| 1 | **Fase 5** | **5.4b** (Jira completo, recomendado) vs **5.4a** (rápido) |
| 2 | **Fase 10** | Tab «Relatório» no header vs só rota + link Resumo |
| 3 | **Fase 3** | Reutilizar custom fields Plane vs tabela `Board*` nova |
| 4 | **Fase 4** | Schema Projeto por **board** vs default por board em cada projeto |
| 5 | **Ordem** | Confirmar 1→2→3→4→5→**10a**→6–9; **10b+** após OK na 10a |
| 6 | **Fase 10 — modelos** | ✓ **Decidido:** 10a fixo agora; dinâmico (10b/10c) **após** MVP 10a |
| 7 | **Fase 11 — marca** | ✓ **Decidido:** **Kortex**; executar **por último** no MVP (MV6); detalhe em [rebranding](./tech4humans-rebranding-remocao-plane.md) |

### D.2 Planejamento em curso (prints a receber)

| Fase | O que falta documentar |
|------|------------------------|
| **6** | Tela Notificações + Auditoria e-mails |
| **7** | Tela Automação |
| **8** | Submenu Quadro em settings |
| **9** | Cronograma em settings |
| **5** | Alterar acesso Limitado; Solicitações de acesso (badge > 0) |

### D.3 Quando começar código

Responde decisões D.1 (pode ser curto). Depois: **«pode seguir Fase 1»** (não «BC-0» — usar número da fase).

**Ícones M2-13…15:** cancelados salvo pedido explícito.

---

## Histórico de renomeação (referência rápida)

| ID legado | Fase atual |
|-----------|------------|
| BC-0 | Fase 1 |
| BC-1 / M2-16 | Fase 2 |
| BC-2 | Fase 3 |
| BC-3 | Fase 4 |
| BC-4 | Fase 5 |
| BC-5 | Fase 6 |
| BC-6 | Fase 7 |
| BC-7 | Fase 8 |
| BC-8 | Fase 9 |
| MV3 | Fase 10 |
