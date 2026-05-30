# Tech4Humans — Plano de desenvolvimento: Boards (Workspace → Board → Projeto)

Documento interno de engenharia e produto. Descreve o que existe hoje no fork, o que falta para ter hierarquia estilo Jira (**Espaço de trabalho → Board → Projetos**), e um plano de implementação detalhado em backend, frontend e produto.

**Referência de contexto:** [tech4humans-plane-organizacao.md](./tech4humans-plane-organizacao.md)

**Guia técnico (arquitetura, segurança, PRs, validação):** [tech4humans-boards-implementacao.md](./tech4humans-boards-implementacao.md)

**Etapas passo a passo (parar e pedir OK):** [tech4humans-boards-etapas.md](./tech4humans-boards-etapas.md)

**Status:** planejamento — não implementado  
**Última atualização:** maio/2026

---

## Sumário

1. [Objetivo de produto](#1-objetivo-de-produto)
2. [Estado atual do código (varredura)](#2-estado-atual-do-código-varredura)
3. [Decisões de produto obrigatórias](#3-decisões-de-produto-obrigatórias)
4. [Modelo alvo (recomendado)](#4-modelo-alvo-recomendado)
5. [Fase 0 — Alinhamento e especificação](#5-fase-0--alinhamento-e-especificação)
6. [Fase 1 — Base de dados e migrações](#6-fase-1--base-de-dados-e-migrações)
7. [Fase 2 — API (Django)](#7-fase-2--api-django)
8. [Fase 3 — Permissões e segurança](#8-fase-3--permissões-e-segurança)
9. [Fase 4 — Pacotes compartilhados](#9-fase-4--pacotes-compartilhados)
10. [Fase 5 — Frontend Web](#10-fase-5--frontend-web)
11. [Fase 6 — Impactos transversais](#11-fase-6--impactos-transversais)
12. [Fase 7 — Migração de dados existentes](#12-fase-7--migração-de-dados-existentes)
13. [Fase 8 — Testes, rollout e operação](#13-fase-8--testes-rollout-e-operação)
14. [Alternativa leve (só UI)](#14-alternativa-leve-só-ui)
15. [Estimativa e riscos](#15-estimativa-e-riscos)
16. [Checklist mestre](#16-checklist-mestre)
17. [Referência Jira — board Tech4Humans](#17-referência-jira--board-tech4humans)
18. [Roadmap de entregas (MVP vs pós-MVP)](#18-roadmap-de-entregas-mvp-vs-pós-mvp)

---

## 1. Objetivo de produto

### 1.0 Hierarquia canónica (regra fixa Tech4Humans)

**Sempre nesta ordem** — produto, design e código não inventam níveis extra:

```text
Workspace → Board (time) → Projeto (épico) → Card → Subtarefa → Subtarefa …
```

| Vocabulário equipa | No Plane | Exemplo |
|--------------------|----------|---------|
| Workspace | `Workspace` | Tech4Humans |
| Board / time | `Board` | Squad as a Service |
| Projeto / épico | `Project` | `[Allianz] Ouvidoria` |
| Card | `Issue` | OPS-17 |
| Subtarefa | `Issue` (filho) | aninhável |

- **«Épico» = Projeto** no modelo de dados. Não confundir com **Módulo** (agrupamento opcional *dentro* do projeto).
- **Board** não contém cards diretamente; contém **projetos**. Cards vivem no projeto (como hoje).
- **MVP estrutural:** sidebar e rotas até Board + Projeto; cards/subtarefas na UI atual do projeto.

### 1.1 O que se quer (estilo Jira)

| Nível | Papel | Exemplo Tech4Humans |
|-------|--------|---------------------|
| Workspace | Empresa / instância lógica | Tech4Humans |
| **Board** | Time, círculo, área (container + **visões cross-project** no MVP-2) | `Squad as a Service`, Implantação Esteira, Webapp |
| **Projeto (épico)** | Cliente / iniciativa / entrega grande | `[Allianz] Ouvidoria`, `[MAPFRE] Agiliza Corretor` |
| Módulo | Marco ou tema *opcional dentro do projeto* | Sprint theme, fase — **não** é o épico do board |
| Card | Item de trabalho | Issue no quadro/lista |
| Subtarefa | Filho do card | Sub-issue (vários níveis) |

### 1.2 O que **não** é este board

- **Não** é o quadro Kanban de itens (layout `board` dentro de um projeto).
- **Não** é `DeployBoard` / publicação Space (modelo `deploy_boards` / `project_deploy_boards`).
- **Não** é o stub CE `teamspace` (frontend retorna `null`; modelo `TeamMember` / `TeamPage` foi removido em migrações antigas).

### 1.3 Critérios de sucesso (MVP)

- [ ] Sidebar: lista hierárquica **Board → Projetos** (colapsável), entre itens de workspace e projetos soltos.
- [ ] CRUD de boards no workspace (admin; regras de membro definidas na Fase 0).
- [ ] Todo **projeto novo** pertence a exatamente um board (`board_id` obrigatório na criação — ver D2).
- [ ] Projetos **legados** podem ficar em «Sem board» até reclassificação manual (D10).
- [ ] Criar/editar projeto permite escolher e mover board (D5).
- [ ] Todos os membros do workspace **veem** todos os boards; acesso a **projetos** segue regras atuais (D3).
- [ ] Rotas: `/{workspaceSlug}/boards/{boardSlug}` (overview) sem quebrar `/{workspaceSlug}/projects/{projectId}/...` (D7).
- [ ] Analytics do workspace com filtro por board no MVP (D8).

> **Nota:** Os critérios acima correspondem ao **MVP-1 (estrutura)**. Visões agregadas ao nível do board (Cronograma, Backlog transversal, etc.) estão no **MVP-2** — ver [§17](#17-referência-jira--board-tech4humans) e [§18](#18-roadmap-de-entregas-mvp-vs-pós-mvp).

---

## 2. Estado atual do código (varredura)

### 2.1 Hierarquia de dados hoje

```
Workspace (db.Workspace)
    └── Project (FK workspace, SEM pai intermediário)
            └── Module, Cycle, Issue, Page, View, State, ...
```

- **Projeto:** `apps/api/operis/db/models/project.py` — `workspace = ForeignKey(WorkSpace)`.
- **Entidades de projeto:** herdam `ProjectBaseModel` / `WorkspaceBaseModel` com `workspace` + `project`.

### 2.2 Modelo `Team` (legado parcial)

- **Existe:** `Team` em `apps/api/operis/db/models/workspace.py` (`name`, `description`, `workspace`, `logo_props`).
- **Removido:** `TeamMember`, `TeamPage` (migração `0086_*`).
- **Sem** FK `board`/`team` em `Project`.
- **Frontend CE:** `teamspace-list.tsx` exporta componente que **retorna `null`**; stores `ce/store/issue/team*` existem para rotas `teamspaceId` que **não** estão no `core.ts` de rotas ativas.
- **Conclusão:** não reutilizar «teamspace» CE como solução; ou evoluir `Team` com novo contrato, ou criar entidade `Board` explícita (recomendado na [seção 4](#4-modelo-alvo-recomendado)).

### 2.3 API — padrão de URLs

Quase tudo segue:

```http
/api/workspaces/{slug}/projects/{project_id}/...
```

Exemplos: issues, modules, cycles, pages, states, views, webhooks, analytics de projeto.

Listagem de projetos:

```http
GET /api/workspaces/{slug}/projects/
GET /api/workspaces/{slug}/projects/details/
```

Implementação: `apps/api/operis/app/views/project/base.py` (`ProjectViewSet`) — filtra por `workspace__slug`, membership (`ProjectMember`, rede pública/privada), `sort_order` via `ProjectUserProperty`.

### 2.4 Permissões hoje

- **Workspace:** `WorkspaceMember.role` (Admin 20, Member 15, Guest 5) — decorator `@allow_permission(..., level="WORKSPACE")`.
- **Projeto:** `ProjectMember` — `level="PROJECT"` (default), `project_id` no kwargs.
- **Sem** nível intermediário entre workspace e projeto.

Arquivos-chave:

- `apps/api/operis/app/permissions/base.py`
- `apps/api/operis/app/permissions/project.py`

### 2.5 Frontend Web — navegação

| Área | Arquivo / nota |
|------|----------------|
| Rotas workspace | `apps/web/app/routes/core.ts` — `/:workspaceSlug`, `/:workspaceSlug/projects/:projectId/...` |
| Sidebar projetos (lista plana) | `core/components/workspace/sidebar/projects-list.tsx` |
| Itens fixos workspace | `core/components/workspace/sidebar/sidebar-menu-items.tsx` |
| Constantes sidebar | `packages/constants/src/workspace.ts` (`WORKSPACE_SIDEBAR_*`) |
| Store projetos | `core/store/project/project.store.ts` — `fetchProjects`, `joinedProjectIds`, favoritos |
| Serviços HTTP | `packages/services` — paths com `workspaces/.../projects/...` |
| Tipos | `packages/types/src/project/projects.ts` — `IProject` sem `board_id` |
| Settings workspace | `packages/constants/src/settings/workspace.ts` — sem tab «boards» |
| Home / recentes | widgets no workspace home — referenciam projetos, não boards |
| Power K / busca | `top-nav-power-k.tsx` — comandos por workspace/projeto |
| Onboarding | convite de equipa (texto), não estrutura board |

### 2.6 Outros apps

| App | Impacto boards |
|-----|----------------|
| **web** | Principal — sidebar, rotas, stores, modais |
| **space** | Publicação por projeto; sem hierarquia board na URL pública hoje |
| **admin** | Instance/workspace admin; listagem workspace + contagem projetos |
| **api** | Fonte de verdade |

### 2.7 O que a doc de organização já diz

Ver [tech4humans-plane-organizacao.md](./tech4humans-plane-organizacao.md) §4–5:

- Não existe **Workspace → Board → Projetos** nativo.
- Implementação real = semanas de trabalho (DB, API, permissões, web).
- Alternativa UI-only = agrupamento visual sem `board_id` na BD.

Este plano assume **implementação real** (modelo + API + UI), salvo decisão explícita pela alternativa leve.

---

## 3. Decisões de produto obrigatórias

**Status:** decidido em workshop com produto Tech4Humans (maio/2026).  
**Participante:** Anderson Silveira (+ agente de planeamento).

### 3.1 Tabela de decisões (registro oficial)

| # | Pergunta | **Decisão Tech4Humans** | Implicação técnica |
|---|----------|-------------------------|-------------------|
| **D1** | Nome na UI (PT) | **Board / Boards** na interface (sidebar: «Boards»). Código e BD: entidade `Board`. | i18n: chaves `boards.*`; evitar «Quadro» para não confundir com layout Kanban de itens. |
| **D2** | Projeto sem board? | **Obrigatório para projetos novos** — criação exige escolher um board. | Validação API `POST /projects/` (`board_id` required). UI: select obrigatório no modal. |
| **D3** | Quem vê um board? | **Todos os membros ativos do workspace** veem todos os boards (não arquivados). Acesso ao **conteúdo** do projeto mantém regras atuais (`ProjectMember`, rede pública/privada, guest). | **MVP sem `BoardMember`.** Permissão de board = membership workspace; não é necessário nível `BOARD` no decorator para listar. |
| **D4** | Quem cria board? | **Só administradores do workspace.** | `@allow_permission(..., level="WORKSPACE", roles=[ADMIN])` em `POST /boards/`. |
| **D5** | Mover projeto entre boards? | **Sim** — após criado, via edição do projeto ou ação «Mover para board…». | `PATCH /projects/{id}/` com `board_id`; validar mesmo `workspace_id`. |
| **D6** | Board arquivado? | **Sim** — `archived_at`; board some da sidebar principal; **projetos continuam acessíveis** por URL direta e busca. | Filtro default `archived_at IS NULL` nas listagens; secção opcional «Boards arquivados» em settings. |
| **D7** | URL canônica | **Slug legível** — `/{workspaceSlug}/boards/{boardSlug}` (único por workspace). UUID interno só na API/BD. | Campo `slug` em `Board` + validador (como workspace); redirect se slug antigo mudar (fase 2). |
| **D8** | Analytics workspace | **Incluir no MVP** — filtros/agregação por board nas telas de analytics do workspace. | Endpoints analytics aceitam `?board_id=` ou agregam por board; UI seletor de board. |
| **D9** | Modelo na BD | **Novo modelo `Board`** (não reutilizar tabela `teams` legada). | Tabela `boards`; ignorar `Team` órfão ou deprecar em migração futura. |
| **D10** | Migração projetos existentes | **Não criar board «Geral» automático** — projetos atuais ficam com `board_id = null` até classificação manual. | Secção sidebar **«Sem board»** (só projetos legados); admins organizam ao longo do tempo. **Novos** projetos não podem ficar null (D2). |
| **D2b** | Voltar a «Sem board»? | **Não** — depois que um projeto recebe `board_id`, `PATCH` não aceita `null`. | Serializer/validação em `PATCH /projects/{id}/`; UI sem opção «Remover do board». |

### 3.2 Regras derivadas (combinar D2 + D10 + D2b)

Estas duas decisões parecem contraditórias mas combinam assim:

1. **Base de dados:** `Project.board_id` continua **nullable** (projetos históricos).
2. **API criação:** `board_id` **obrigatório** em `POST /projects/` (erro 400 se ausente).
3. **API atualização:** permitir atribuir `board_id` a projeto legado (`PATCH`); **após atribuído, não permitir voltar a `null`** (decisão confirmada — consistência com D2).
4. **Sidebar:** três zonas — lista de **Boards** (com projetos dentro) + **Sem board** (legado) + fluxo de classificação para admins.
5. **Empty state:** workspace sem nenhum board → admin deve criar o primeiro board antes de qualquer membro criar projeto.

### 3.3 O que fica fora do MVP (explícito)

| Item | Motivo |
|------|--------|
| `BoardMember` e permissão por board | D3: visibilidade = workspace inteiro |
| Rotas públicas Space com board | Space permanece por projeto |
| Slug de board na URL de **projeto** | Projeto mantém `/{workspaceSlug}/projects/{projectId}/...` |
| Renomear/reaproveitar modelo `Team` | D9 |

### 3.4 Campos obrigatórios no modelo `Board` (pós-decisões)

Além dos campos do §4.2, incluir desde o MVP:

| Campo | Motivo |
|-------|--------|
| `slug` | D7 — URLs legíveis, único por workspace |
| `archived_at` | D6 |

### 3.5 Checklist pós-workshop

- [x] D1–D10 respondidos
- [ ] Wireframes alinhados com «Boards» + secção «Sem board»
- [x] Regra PATCH: projeto com board não pode voltar a «Sem board»
- [ ] Validar com 1 admin Tech4Humans: lista de boards iniciais (nomes/slugs) antes da migração
- [ ] Comunicar à equipa: projetos antigos em «Sem board» até reclassificação

---

## 4. Modelo alvo (recomendado)

### 4.1 Entidades

```text
Workspace
  └── Board (novo)
        ├── BoardMember (novo, opcional no MVP se usar só herança workspace)
        └── Project.board_id (FK nullable, on_delete=SET_NULL ou PROTECT)
```

### 4.2 Campos sugeridos — `Board`

| Campo | Tipo | Notas |
|-------|------|--------|
| `id` | UUID | PK (padrão `BaseModel`) |
| `workspace_id` | FK | CASCADE |
| `name` | string 255 | único por workspace (soft-delete aware) |
| `slug` | slug 48 | único por workspace (D7); usado na URL |
| `description` | text | opcional |
| `archived_at` | datetime | null = ativo (D6) |
| `logo_props` | JSON | alinhado a projeto/workspace |
| `sort_order` | float | ordenação na sidebar |
| `archived_at` | datetime | null = ativo |
| `created_by` / timestamps | | padrão BaseModel |

Índices: `(workspace_id, name)` unique com `deleted_at IS NULL`.

### 4.3 Campos sugeridos — `BoardMember` (se D3 = membros explícitos)

| Campo | Tipo |
|-------|------|
| `board_id` | FK |
| `member_id` | FK User |
| `role` | smallint (Admin/Member/Guest do board) |
| `is_active` | bool |

### 4.4 Alteração em `Project`

```python
board = models.ForeignKey(
    "db.Board",
    on_delete=models.SET_NULL,  # ou PROTECT — decidir em D5/D6
    null=True,
    blank=True,
    related_name="board_projects",
)
```

- Manter `workspace` denormalizado (já existe) — validar em `save()` que `board.workspace_id == project.workspace_id`.

### 4.5 O que **não** muda no MVP

- Módulos, ciclos, issues, páginas, estados — continuam **só** sob projeto.
- URLs de recurso profundo: `.../projects/{id}/issues/...` (sem prefixo board obrigatório).

---

## 5. Fase 0 — Alinhamento e especificação

**Duração estimada:** 3–5 dias

### Entregáveis

- [x] Respostas documentadas às decisões D1–D10 (§3.1 deste arquivo).
- [ ] Wireframes: sidebar, modal criar board, modal criar projeto (select board), settings workspace «Boards».
- [ ] Contrato OpenAPI esboçado (endpoints §7).
- [ ] Matriz de permissões (tabela workspace × board × projeto × guest).
- [ ] Política de migração (§12) aprovada por negócio.

### Artefatos

- Figma ou screenshots anotados na pasta `docs/` (opcional).
- ADR curto: «Por que Board e não reuso Team».

---

## 6. Fase 1 — Base de dados e migrações

**Duração estimada:** 1 semana

### 6.1 Tarefas Django

| # | Tarefa | Arquivo / ação |
|---|--------|----------------|
| 1.1 | Criar modelo `Board` | `apps/api/operis/db/models/board.py` (ou `workspace.py`) |
| 1.2 | Criar modelo `BoardMember` (se aplicável) | idem |
| 1.3 | Registrar em `db/models/__init__.py` | export |
| 1.4 | Adicionar `Project.board` | `db/models/project.py` |
| 1.5 | `save()` / constraint | validar workspace coerente |
| 1.6 | Migration `CreateModel Board` | `db/migrations/XXXX_*.py` |
| 1.7 | Migration `AddField project.board` | nullable |
| 1.8 | Data migration | **nenhuma** atribuição automática — projetos existentes permanecem `board_id = null` (D10) |
| 1.9 | Índices | `board_id`, `(workspace_id, sort_order)` |

### 6.2 Migração de dados (detalhe)

**Decisão D10:** não há script que preencha `board_id` em massa.

```sql
-- Apenas schema; dados legados intactos
-- projects.board_id permanece NULL para registos existentes
-- Novos INSERTs de projeto exigem board_id (constraint ou validação app)
```

- Projetos arquivados: permanecem `board_id = null` até admin classificar.
- Backup obrigatório antes de aplicar em produção.
- Após deploy: admins criam boards (ex. «Implantação Esteira», «Webapp») e movem projetos via UI.

### 6.3 Rollback

- Migration reversa: remover FK, dropar tabelas board (após export se necessário).

---

## 7. Fase 2 — API (Django)

**Duração estimada:** 1,5–2 semanas

### 7.1 Endpoints novos

Prefixo: `/api/workspaces/{slug}/boards/`

| Método | Path | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/boards/` | Listar boards do workspace | WORKSPACE member+ |
| POST | `/boards/` | Criar board | WORKSPACE admin |
| GET | `/boards/{board_id}/` | Detalhe | board access |
| PATCH | `/boards/{board_id}/` | Atualizar nome, logo, sort | board admin |
| DELETE | `/boards/{board_id}/` | Soft delete | WORKSPACE admin |
| POST | `/boards/{board_id}/archive/` | Arquivar | WORKSPACE admin |
| GET | `/boards/{board_id}/projects/` | Projetos do board | composto board + project rules |
| PATCH | `/boards/{board_id}/projects/reorder/` | Reordenar `sort_order` projetos | PROJECT admin no board |

Membros do board (se `BoardMember`):

| Método | Path |
|--------|------|
| GET/POST | `/boards/{board_id}/members/` |
| PATCH/DELETE | `/boards/{board_id}/members/{id}/` |

### 7.2 Alterações em endpoints existentes

| Endpoint | Alteração |
|----------|-----------|
| `GET /projects/`, `GET /projects/details/` | Incluir `board_id`, `board` lite (id, name, logo_props); filtro `?board_id=` |
| `POST /projects/` | **`board_id` obrigatório**; validar workspace e existência do board |
| `PATCH /projects/{id}/` | Permitir mover `board_id` entre boards; **rejeitar `board_id: null`** se o projeto já tiver board |
| Serializers | `ProjectListSerializer`, `ProjectSerializer`, `ProjectDetailSerializer` — `apps/api/operis/app/serializers/project.py` |

### 7.3 Arquivos a criar

```
apps/api/operis/app/views/board/
  __init__.py
  base.py          # BoardViewSet
  member.py        # opcional
apps/api/operis/app/serializers/board.py
apps/api/operis/app/urls/board.py
```

Registrar em `apps/api/operis/app/urls/__init__.py`.

### 7.4 Webhooks e atividade

| Evento | Ação |
|--------|------|
| `board.created` / `board.updated` | `webhook_activity` / `model_activity` (padrão projeto) |
| Payload projeto | incluir `board_id` |

Arquivos: `plane/bgtasks/webhook_task.py`, registros de eventos.

### 7.5 OpenAPI / API pública

- Atualizar `apps/api/operis/settings/openapi.py` e rotas `plane/api/` se expuser boards a integrações.

### 7.6 Busca workspace

- `apps/api/operis/app/views/search.py` (e equivalentes): facet opcional `board_id`; resultados de projeto com board.

---

## 8. Fase 3 — Permissões e segurança

**Duração estimada:** 1 semana (paralelo à Fase 2)

### 8.1 Novo nível (opcional)

Estender `allow_permission`:

```python
@allow_permission(..., level="BOARD")
# kwargs: slug, board_id
```

Implementação em `apps/api/operis/app/permissions/base.py` + `board.py`.

### 8.2 Regras MVP sugeridas

| Ação | Quem |
|------|------|
| Ver lista de boards | Workspace member ativo |
| Criar/editar/arquivar board | Workspace admin |
| Ver projetos dentro do board | União: (membro board OU workspace admin) E regras atuais de `ProjectMember` / rede pública |
| Criar projeto no board | Quem pode criar projeto no workspace + `board_id` válido |
| Mover projeto | Project admin + workspace admin |

### 8.3 Queries seguras

- Todo `Project.objects.filter(board_id=X)` deve também filtrar `workspace__slug=slug`.
- Evitar IDOR: validar `board.workspace_id` antes de aceitar `board_id` no POST projeto.

### 8.4 Auditoria

- Log de mudança de `board_id` em projeto (issue activity ou project activity se existir).

---

## 9. Fase 4 — Pacotes compartilhados

**Duração estimada:** 3–5 dias

### 9.1 `packages/types`

```typescript
// packages/types/src/board.ts (novo)
export interface IBoard { id, name, description, logo_props, sort_order, archived_at, workspace }
export interface IBoardLite { id, name, logo_props }
// Atualizar IProject / IPartialProject:
board_id?: string | null
board?: IBoardLite | null
```

Export em `packages/types/src/index.ts`.

### 9.2 `packages/constants`

- Chaves i18n: `boards.title`, `boards.create`, `boards.general`, `boards.without_board`, etc.
- Sidebar: novo item ou substituir bloco «Projetos» por «Boards» com nested projects.
- `WORKSPACE_SETTINGS` — tab «Boards» (opcional) em `packages/constants/src/settings/workspace.ts`.

### 9.3 `packages/services`

```
packages/services/src/board/board.service.ts
  - list(workspaceSlug)
  - create / update / archive / delete
  - listProjects(workspaceSlug, boardId)
```

Atualizar serviço de projeto para query `board_id`.

### 9.4 `packages/utils`

- Helpers: `groupProjectsByBoard(projects, boards)`, `orderBoards`, filtros.
- Permissões cliente: `canAccessBoard(user, board)` se espelhar backend.

### 9.5 `packages/i18n`

- `en/translations.ts` e `pt-BR/translations.ts` (mínimo); demais locales podem copiar EN até passo posterior.

---

## 10. Fase 5 — Frontend Web

**Duração estimada:** 2–3 semanas

### 10.1 Store MobX

| Store | Responsabilidade |
|-------|------------------|
| `BoardStore` (novo) | `boardMap`, `fetchBoards`, CRUD, `boardsByWorkspace` |
| `ProjectStore` | passar a agrupar `joinedProjectIds` por `board_id`; `fetchProjects` hidrata boards |
| `RootStore` | registrar `boardStore` em `core/store/root.store.ts` |

Padrão: espelhar `project.store.ts`.

### 10.2 Rotas (`apps/web/app/routes/core.ts`)

Adicionar (exemplo):

```text
:workspaceSlug/boards/:boardId          → overview do board (opcional MVP)
:workspaceSlug/boards/:boardId/settings → futuro
```

Manter rotas de projeto **sem** exigir board na URL.

### 10.3 Sidebar (crítico UX)

**Substituir / evoluir** `projects-list.tsx`:

```text
▼ Boards (ou Times)
  ▼ [Impl. Esteira]
      • Projeto A
      • Projeto B
  ▼ [Webapp]
      • Projeto C
  ▼ Sem board
      • Projeto solto
```

Tarefas:

| # | Componente | Ação |
|---|------------|------|
| 10.3.1 | `boards-list.tsx` (novo) | Disclosure por board |
| 10.3.2 | `board-projects-list.tsx` | Reutilizar `SidebarProjectsListItem` |
| 10.3.3 | Drag-and-drop | Reordenar boards; reordenar projetos **dentro** do board (persistir `Board.sort_order` e `ProjectUserProperty.sort_order`) |
| 10.3.4 | `CreateBoardModal` | Novo |
| 10.3.5 | `CreateProjectModal` | Select «Board» |
| 10.3.6 | `use-navigation-preferences` | Preferência «expandir boards» / limite de projetos por board |
| 10.3.7 | Extended sidebar | Avaliar se «Projetos» vira entrada por board |

### 10.4 Páginas e layouts

| Página | Alteração |
|--------|-----------|
| Workspace home | Widget «Recentes» agrupado ou badge de board |
| Workspace settings | Secção gerir boards (lista, arquivar) |
| Project settings | Mostrar board atual; link «Mover para outro board» |
| Command palette / Power K | Comandos: «Ir para board X», «Criar projeto em board Y» |
| Breadcrumbs | `Workspace > Board > Projeto > …` em `ce/components/breadcrumbs` |

### 10.5 Hooks

- `useBoard()` — hook store
- `useParams()` — `boardId` onde aplicável
- `router.store.ts` — `boardId` computed (hoje já existe `teamspaceId` legado — **não** reutilizar nome; usar `boardId`)

### 10.6 Limpeza CE legado (recomendado no mesmo epic)

| Item | Ação |
|------|------|
| `ce/store/issue/team*` | Remover ou redirecionar para board se morto |
| `teamspaceId` em `issue/root.store.ts` | Deprecar após confirmar rotas inexistentes |
| `ProjectTeamspaceList` | Remover ou implementar de verdade |
| i18n `team` / `teams` | Alinhar com «Board»/«Time» |

### 10.7 CE / plane-web

- Novos componentes em `ce/components/workspace/boards/` se padrão do fork for CE override.
- `@/plane-web/*` alias em `tsconfig` → `ce/*`.

---

## 11. Fase 6 — Impactos transversais

**Duração estimada:** 1–2 semanas (overlap)

### 11.1 Funcionalidades a revisar

| Área | O que fazer |
|------|-------------|
| **Favoritos** | `UserFavorite` entity_type project — manter; UI agrupa por board |
| **Recentes** | `recent_visited_task` — incluir `board_id` no payload se útil |
| **Notificações** | Templates email — sem mudança obrigatória MVP |
| **Analytics workspace** | `apps/api/.../analytic/` — filtros por `board_id` **no MVP** (D8) |
| **Workspace views (globais)** | Filtro opcional por projetos de um board |
| **Imports (Jira/GitHub)** | Mapear Jira «board» → `Board`; projeto → `Project` |
| **Webhooks** | Documentar novos eventos |
| **API keys / automações** | Expor `board_id` em payloads projeto |
| **Mobile** | Fora de escopo MVP web-only |
| **Space (`apps/space`)** | Sem board na URL pública MVP |
| **Admin (`apps/admin`)** | Contagem boards por workspace (opcional) |
| **Docker / deploy** | Apenas migration na subida |

### 11.2 Performance

- `GET /projects/details/` com N projetos: incluir board lite — evitar N+1 (select_related `board`).
- Sidebar: uma chamada `GET /boards/` + projetos já carregados ou endpoint composto `GET /boards/with-projects/` (otimização fase 2).

### 11.3 Feature flag

- `INSTANCE_BOARD_ENABLED` ou config workspace — permitir rollout gradual no fork.

---

## 12. Fase 7 — Migração de dados existentes

### 12.1 Ambientes

| Ambiente | Passos |
|----------|--------|
| Dev local | `docker-compose` + `python manage.py migrate` |
| Staging | backup PG + migrate + smoke |
| Produção Tech4Humans | janela + backup + migrate + verificar contagem projetos/board |

### 12.2 Comunicação

- Aviso: «Projetos antigos aparecem em **Sem board** até um admin os mover para um board».
- Guia rápido: criar boards por time; mover projetos; novos projetos já nascem num board.

### 12.3 Rollback plan

- Restaurar snapshot BD se migration falhar.
- Versão app N compatível com `board_id` null deve continuar funcionando se rollback de código.

---

## 13. Fase 8 — Testes, rollout e operação

### 13.1 Testes backend

- [ ] Unit: validação `Project.board.workspace`
- [ ] Unit: permissões board/workspace
- [ ] API: CRUD boards, filtro projetos, mover projeto
- [ ] Migration test em BD limpa e BD com dados reais anonimizados

### 13.2 Testes frontend

- [ ] E2E: criar board → criar projeto → aparece na sidebar
- [ ] E2E: guest só vê boards/projetos permitidos
- [ ] Regressão: rotas projeto sem board na URL

### 13.3 Observabilidade

- Métricas: tempo `GET /boards/`, erros 403 por board.

### 13.4 Documentação

- Atualizar [tech4humans-plane-organizacao.md](./tech4humans-plane-organizacao.md) §4–5 quando MVP shipped.
- README interno deploy: variável feature flag.

---

## 14. Alternativa leve (só UI)

Se prazo impedir modelo real (doc §5):

| Prós | Contras |
|------|---------|
| 1–2 semanas | Não é «board com projetos» de verdade |
| Sem migration | Permissões por time impossíveis |
| Agrupar por prefixo no nome (`[Time] Proj`) | Imports/API não entendem board |

Implementação: `groupProjectsByNamePrefix` na sidebar + filtros salvos — **não recomendado** para Tech4Humans se o objetivo é paridade Jira.

---

## 15. Estimativa e riscos

### 15.1 Estimativa (equipe 1–2 devs fullstack)

Ver detalhe em [§18](#18-roadmap-de-entregas-mvp-vs-pós-mvp). Resumo:

| Onda | Escopo | Semanas |
|------|--------|---------|
| **MVP-1** | Estrutura (sidebar, CRUD, slug, analytics filtro) | 8–10 |
| **MVP-2** | Hub Jira (issues agregados, Cronograma, Backlog, Quadro, filtros) | 6–10 |
| **Total** | Paridade com board da captura Jira | **14–20** |

Desdobramento MVP-1 por fase:

| Fase | Semanas |
|------|---------|
| 0 — Spec | 0,5–1 |
| 1 — DB | 1 |
| 2 — API | 1,5–2 |
| 3 — Permissões | 1 |
| 4 — Packages | 0,5 |
| 5 — Web UI (sidebar + página board mínima) | 2–3 |
| 6 — Transversal | 1–2 |
| 7 — Migração prod | 0,5 |
| 8 — QA | 1 |

### 15.2 Riscos

| Risco | Mitigação |
|-------|-----------|
| Regressão permissões guest/member | Matriz de testes §13; code review em `ProjectViewSet` |
| Sidebar performance | Endpoint composto; virtualização lista |
| Confusão Board vs Kanban | Nomenclatura UI «Time» / «Área» |
| Débito teamspace CE | Limpeza na Fase 10.6 |
| Scope creep (analytics, space) | MVP estrito §1.3 |

---

## 16. Checklist mestre

### Produto
- [ ] D1–D10 decididos
- [ ] Wireframes aprovados
- [ ] Comunicação migração redigida

### Backend
- [ ] Modelo `Board` (com `slug`, `archived_at`) — **sem** `BoardMember` no MVP
- [ ] `Project.board_id` + validação (obrigatório em POST)
- [ ] Migrations schema only (sem preencher boards em massa — D10)
- [ ] ViewSet + URLs boards
- [ ] Serializers projeto atualizados
- [ ] Permissões BOARD/WORKSPACE
- [ ] Webhooks / busca (mínimo)

### Frontend
- [ ] Types + services + i18n
- [ ] BoardStore + ProjectStore agrupado
- [ ] Sidebar hierárquica
- [ ] Modais criar board / selecionar board no projeto
- [ ] Settings workspace
- [ ] Power K / breadcrumbs
- [ ] Limpeza teamspace CE

### Operação
- [ ] Feature flag
- [ ] Backup + migrate staging/prod
- [ ] Atualizar doc organização
- [ ] Testes E2E verdes

---

## Apêndice A — Mapa de arquivos principais (referência rápida)

```
apps/api/operis/db/models/
  workspace.py          # Workspace, Team (legado), WorkspaceMember
  project.py            # Project (+ board FK futuro)
  board.py              # NOVO

apps/api/operis/app/views/project/base.py
apps/api/operis/app/views/board/             # NOVO

apps/web/core/components/workspace/sidebar/
  projects-list.tsx                         # EVOLUIR
  boards-list.tsx                           # NOVO

apps/web/core/store/project/project.store.ts
apps/web/core/store/board/board.store.ts    # NOVO

apps/web/app/routes/core.ts

packages/types/src/project/projects.ts
packages/types/src/board.ts                 # NOVO
packages/services/src/board/
packages/constants/src/workspace.ts
packages/i18n/src/locales/pt-BR/translations.ts
```

---

## Apêndice B — Comparação Jira × Plane (alvo)

| Jira / negócio | Plane hoje | Plane alvo Tech4Humans |
|--------------|------------|-------------------------|
| Site / Organization | Instance | Instance |
| Espaços | Workspace | Workspace |
| Board / time | — | **Board** |
| **Epic (épico de negócio)** | Project (sem board pai) | **Project** (filho de Board) |
| Story / card | Issue | Issue |
| Sub-task | Sub-issue | Sub-issue (aninhável) |
| Epic técnico *dentro* do projeto (opcional) | Module | Module (inalterado, abaixo do projeto) |

---

## 17. Referência Jira — board Tech4Humans

**Fonte:** captura do Jira Cloud no workspace Tech4Humans — board **`[NOVO] Squad as a Service`**, vista **Cronograma** (maio/2026).

Esta imagem define o **produto alvo** além da sidebar: o board é um **espaço de trabalho do time** com visões que **cruzam vários projetos**, não apenas uma pasta de projetos.

### 17.1 Mapeamento de navegação (Jira → Plane)

| Elemento na imagem Jira | Significado | Equivalente Plane (alvo) |
|-------------------------|-------------|---------------------------|
| **Espaços** (breadcrumb) | Workspace / organização | `Tech4Humans` — `Workspace` |
| **`[NOVO] Squad as a Service`** | Board do time | `Board` (slug ex. `squad-as-a-service`) |
| Abas: Resumo, Cronograma, Backlog, Quadro, Lista, Calendário | Modos de visualização **no board** | Rotas sob `/boards/{boardSlug}/…` (MVP-2) |
| Abas extras (Deployments, Code, …) | Integrações Jira | Fora de escopo inicial; avaliar depois |
| Lista `OPS-17`, `OPS-21`… | Issues de **vários** projetos no mesmo ecrã | Query agregada `issues WHERE project.board_id = X` |
| Prefixos `[Allianz]`, `[MAPFRE]` no título | Cliente / iniciativa (já costuma ser o **nome do projeto** no Plane) | Manter em `Project.name`; filtro **Projeto** no board |
| Barra roxa no cronograma | Épico / item de longa duração | `Issue` / `Module` com `start_date` + `target_date` |
| Linha azul vertical «hoje» | Marcador de data atual | Componente timeline (reutilizar lógica de calendário/Gantt se existir) |
| Escala: Hoje / Semanas / Meses / Trimestres | Zoom da timeline | Preferência de vista guardada no board ou no utilizador |

### 17.2 O que o Jira revela sobre o papel do Board

1. **Agregador transversal** — O filtro **Projeto** na barra superior prova que um board mostra trabalho de **N projetos** ao mesmo tempo. O Plane hoje só lista issues **dentro de um projeto**; é necessário um **nível de query** por `board_id`.

2. **Hub de visões** — O utilizador entra no board e escolhe **Cronograma**, **Backlog**, **Quadro**, etc., sem entrar primeiro num projeto. No Plane, isso implica uma **página do board** com tabs (não só expandir projetos na sidebar).

3. **Planeamento de portfolio do time** — A vista Cronograma alinha épicos no tempo (vários clientes/projetos). Equivale a combinar **módulos + issues com datas** de todos os projetos do board.

4. **Filtros ricos no contexto do board** — Tipo, Categoria, Status, filtros custom, pesquisa textual, avatares de responsável. Reutilizar o motor de **filtros / rich_filters** do workspace, com `scope = board` e `project_ids` derivados dos projetos do board.

5. **Convenção de naming** — Board = nome do **time/serviço** (`Squad as a Service`); projeto = **cliente ou entrega** (`[Allianz] Ouvidoria`). Alinha com a doc de organização (prefixos por time no nome do projeto) — com board, o prefixo no nome do projeto torna-se **opcional** porque o board já identifica o time.

### 17.3 Lacunas do plano original vs esta referência

| Já previsto no plano | **Não** previsto (adicionar) |
|----------------------|------------------------------|
| Sidebar Board → Projetos | Página do board com **tabs de vista** |
| `GET /boards/` CRUD | `GET /boards/{slug}/issues/` (lista agregada) |
| Analytics workspace + filtro board (D8) | Vista **Cronograma** ao nível do board |
| Mover projeto entre boards | **Backlog** e **Quadro** Kanban **multi-projeto** no board |
| Slug na URL do board (D7) | Conteúdo real nessa URL (hoje só «overview» vazio) |

### 17.4 Requisitos derivados (para backlog)

#### API (MVP-2)

| Endpoint | Descrição |
|----------|-----------|
| `GET /workspaces/{slug}/boards/{board_slug}/issues/` | Issues de todos os projetos do board; paginação; mesmos filtros que issue list |
| `GET /workspaces/{slug}/boards/{board_slug}/modules/` | Módulos agregados (épicos) para timeline |
| `GET /workspaces/{slug}/boards/{board_slug}/meta/` | Contagem por estado, projetos incluídos, membros envolvidos |
| Query params | `project_id`, `assignee`, `state`, `priority`, datas — espelhar filtros da imagem |

Permissões: para cada issue devolvida, aplicar regra **ProjectMember** (guest não vê projeto privado mesmo que veja o board).

#### Frontend (MVP-2)

| Rota | Vista | Notas |
|------|-------|-------|
| `/boards/{boardSlug}` | **Resumo** | KPIs do board, projetos, alertas (parcial no MVP-1) |
| `/boards/{boardSlug}/timeline` | **Cronograma** | Gantt multi-projeto; escala semanas/meses |
| `/boards/{boardSlug}/backlog` | **Backlog** | Lista priorizável cross-project |
| `/boards/{boardSlug}/views` | **Quadro / Lista** | Reutilizar `IssueLayoutStore` com `EIssuesStoreType.BOARD` (novo) |
| `/boards/{boardSlug}/calendar` | **Calendário** | Issues com `target_date` agregados |

Barra de filtros fixa (sticky), como no Jira:

- Dropdown **Projeto** (projetos deste board)
- Tipo / Estado / Responsável
- Pesquisa full-text

#### Store / tipos

- `BoardIssuesStore` + `BoardIssuesFilterStore` (padrão `ce/store/issue/team*` — **renomear conceito** para board, não teamspace).
- `useIssueLayoutStore`: novo caso `boardSlug` → `EIssuesStoreType.BOARD`.

### 17.5 Exemplo concreto Tech4Humans

| Jira (imagem) | Proposta Plane |
|---------------|----------------|
| Board `[NOVO] Squad as a Service` | Board `squad-as-a-service` (nome: «Squad as a Service») |
| Projetos implícitos (Allianz, MAPFRE, …) | Projetos filhos: `[Allianz] Ouvidoria`, `[MAPFRE] Agiliza Corretor`, … |
| Tickets `OPS-*` | Identificador do **projeto** (`OPS`) + sequence — inalterado |
| Cronograma com vários clientes | Timeline do board filtra por projeto ou mostra todos |

### 17.6 O que **não** copiar do Jira neste epic

- Abas Deployments, Code, Versions, Development (integrações).
- «Archived work items» como tab separada (usar filtros + arquivo por projeto).
- Complexidade de «Forms» / «Checklist» nativos Jira.

---

## 18. Roadmap de entregas (MVP vs pós-MVP)

Reorganização do plano em duas ondas, para não subestimar o esforço após a referência Jira.

### MVP-1 — Estrutura (8–10 semanas)

**Objetivo:** hierarquia correta e operação diária (criar board, atribuir projetos, sidebar).

Inclui: §6–§8, §9–§10 (sidebar, CRUD, migração D10, D2, D2b, D7 slug, D8 analytics **por board**), sem vistas agregadas de issues.

| Entregável | Critério de pronto |
|------------|-------------------|
| Modelo `Board` + `Project.board_id` | Migrations aplicadas |
| API boards + projeto obrigatório | Postman / testes API |
| Sidebar Board → Projetos + Sem board | UX igual convenção atual, hierárquica |
| Página `/boards/{slug}` mínima | Nome, descrição, lista de projetos, link para cada projeto |
| Analytics filtro board | D8 |

### MVP-2 — Board como hub Jira (6–10 semanas adicionais)

**Objetivo:** paridade com a captura Jira (Cronograma + filtros cross-project).

| Entregável | Prioridade | Referência Jira |
|------------|------------|-----------------|
| `GET …/boards/{slug}/issues/` agregado | P0 | Lista + filtros |
| Tab **Backlog** no board | P0 | Aba Backlog |
| Tab **Lista** / **Quadro** no board | P0 | Lista / Quadro |
| Filtro **Projeto** (multi-select) | P0 | Dropdown Projeto |
| Tab **Cronograma** (timeline) | P1 | Cronograma |
| Tab **Calendário** | P2 | Calendário |
| Tab **Resumo** rica (widgets) | P2 | Resumo |
| Escala Hoje/Semanas/Meses/Trimestres | P1 | Cantos da timeline |

### Pós-MVP

- `BoardMember` (se D3 mudar no futuro).
- Notificações «resumo do board».
- Imports Jira: mapear Jira board → Plane board.
- Space / URL pública com contexto board.

### Impacto na estimativa total

| Onda | Semanas (1–2 devs) |
|------|---------------------|
| MVP-1 | 8–10 |
| MVP-2 | 6–10 |
| **Total até paridade Jira (visão board)** | **14–20 semanas** |

---

*Documento vivo — atualizar decisões D1–D10, §17–§18 e checklists conforme o epic avança.*
