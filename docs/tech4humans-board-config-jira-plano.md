# Tech4Humans — Configuração do Board (paridade Jira «Espaço»)

**Objetivo:** estruturar o trabalho **após M2-12**, com base nos prints Jira «Configurações do espaço» de **[NOVO] Squad as a Service**, **sem** as etapas M2-13 a M2-15 (ícones nas tabs — **adiadas / fora desta onda**).

**Referência visual:** prints enviados em maio/2026 (Informações, Acessar, Funções, Campos, Tipos de ticket → Projeto).

**Regra de ouro:** uma **fase** de cada vez → spec curta → implementar → validar → **PARAR** antes da seguinte.

**Documentos relacionados:**

- [tech4humans-boards-mvp2-plano.md](./tech4humans-boards-mvp2-plano.md) — hub e vistas (M2-0…M2-12 concluídos)
- [tech4humans-roadmap-mv3-mv5.md](./tech4humans-roadmap-mv3-mv5.md) — MV3 Status Report, MV4 PRD, MV5 RBAC
- [tech4humans-boards-plano-desenvolvimento.md](./tech4humans-boards-plano-desenvolvimento.md) — D3: sem `BoardMember` no MVP-1

**Última atualização:** maio/2026

---

## Vocabulário (fixo)

| Jira | Tech4Humans / Plane |
|------|---------------------|
| Espaço | **Workspace** + **Board** (time) |
| Squad as a Service | **Board** |
| Tipo **Projeto** (épico) | **Projeto** (`Project`) — não é `IssueType` |
| Backlog, Deploy, Kickoff… | **Tipos de card** (`IssueType` + `type_id` no card) |
| Campos do espaço | **Campos** ligados ao **board** (e usados nos projetos do board) |

---

## O que já temos (teu ponto 1 — não repetir)

| Jira «Informações» | No fork hoje |
|--------------------|--------------|
| Nome, chave, ícone | Workspace settings; board: nome, slug, `logo_props` em `/{ws}/settings/boards` |
| Proprietário / responsável | `Project` / workspace members (não 1:1 com «proprietário do espaço» Jira) |
| Categoria, responsável padrão | Parcial ou inexistente no board — **só acrescentar se produto pedir** |

**Decisão:** ponto 1 **fechado** para esta onda. Melhorias cosméticas entram como polish dentro da fase **BC-0** (shell), não como etapa própria.

---

## O que os prints pedem (resumo dos teus pontos 2–4)

### Ponto 2 — Acessar + Funções

- Lista de utilizadores com **função** editável (dropdown), **Remover**, **Adicionar pessoas**
- Acesso ao espaço: **Limitado** vs aberto (banner + alterar)
- **Gerenciar funções** → modal com papéis (Administrador, Membro, Convidado, custom «Member (Com Delete)»…)
- **Criar função** → nome, descrição, **árvore de permissões** (Administrar, Gerenciar itens, Trabalhar nos itens, Colaborar…), atribuir a pessoas/grupos

**Gap no Plane hoje:** permissões = `ADMIN` / `MEMBER` / `GUEST` em **workspace** e **projeto**; **sem** papéis custom nem matriz granular por board ([MV5](./tech4humans-roadmap-mv3-mv5.md)).

### Ponto 3 — Campos

- Tabela: Nome, Tipo, Descrição, Ações
- **Adicionar campo** → drawer com campos existentes (checkbox) + **Criar campo novo**
- Tipos: texto, parágrafo, data, número, data/hora, categorias, dropdown, checkbox, pessoas, URL…
- Campos de exemplo nos prints: Cliente, Criticidade, Ambiente, Estimativa de dias, SLA, previsões de conclusão por fase, etc.

**Gap:** Plane tem **custom properties** por projeto/workspace; **não** há ecrã «Campos do board» que propaga aos projetos filhos do board.

### Ponto 4 — Tipo «Projeto» (épico)

- Sidebar **Tipos de ticket** → **Projeto** (ícone diamante)
- **Campos de descrição:** Resumo (obrigatório), Cliente, Descrição, Responsável, Desenvolvedor, Responsável (cliente), Pontos de atenção…
- **Campos de contexto:** Status, Controle de tempo, Start date (obrigatório), Data limite, % conclusão, EPIC…
- Painel direito: biblioteca de campos + **Criar um campo** (arrastar tipo para a secção)

**Gap:** formulário de **criação/edição de Projeto** no Plane não segue este schema configurável por board; é fixo no produto.

### Extra nos prints (agrupar com 3 ou 4)

- **Tipos de ticket** (cards): Backlog, Deploy, Desenvolvimento, Homologação, Imersão, Kickoff, Operação assistida, Sustentação, Tarefa + **Adicionar tipo**
- Isto coincide com **M2-16** (catálogo de tipos de card no board), não com o tipo «Projeto».

---

## Fora desta onda (registar, não implementar agora)

| Item nos prints Jira | Motivo |
|----------------------|--------|
| Notificações / Automação do espaço | Automação Plane é outro produto; notificações = settings WS |
| Quadro / Cronograma dentro de «Configurações» | Já são **tabs** do hub (M2-5, M2-6); não duplicar em settings |
| Apps (Checklist for Jira, etc.) | Integrações terceiros |
| Permissões 100% iguais ao Jira (dezenas de checkboxes) | MV5; fazer **subset** útil na fase BC-4 |

| M2-13, M2-14, M2-15 (ícones tabs / projeto / tipo) | **Adiado** por decisão produto (maio/2026) |

---

## Arquitetura alvo — «Configurações do board»

### Rota proposta

```text
/{workspaceSlug}/boards/{boardSlug}/settings
/{workspaceSlug}/boards/{boardSlug}/settings/access
/{workspaceSlug}/boards/{boardSlug}/settings/fields
/{workspaceSlug}/boards/{boardSlug}/settings/issue-types
/{workspaceSlug}/boards/{boardSlug}/settings/issue-types/project   ← schema do Projeto
/{workspaceSlug}/boards/{boardSlug}/settings/issue-types/{typeId}
/{workspaceSlug}/boards/{boardSlug}/settings/roles                 ← BC-4
```

Entrada: menu «⋯» no header do board ou item na página `/{ws}/settings/boards` → «Configurar board».

### Shell (layout comum)

- Sidebar esquerda (como Jira): secções abaixo
- Área principal + painel direito opcional (campos disponíveis / adicionar)
- Só **ADMIN** workspace (ou permissão futura «Administrar board») edita; **MEMBER** leitura opcional conforme fase

```text
Configurações do board — [Nome do board]
├── Informações          → redirect ou link para settings WS/board existente
├── Acessar              → BC-4
├── Campos               → BC-3
├── Tipos de card        → BC-2 (lista)
│   └── Projeto          → BC-5 (schema do projeto — não é IssueType)
└── Funções              → BC-4 (sub-rota ou modal como Jira)
```

---

## Fases de entrega (ordem recomendada)

| Fase | ID | Entregável | Teus pontos | Prioridade | Estimativa |
|------|-----|------------|-------------|------------|------------|
| 0 | **BC-0** | Shell: rotas, sidebar, permissão ADMIN, empty states | — | P0 | 3–5 d |
| 1 | **BC-2** | **Tipos de card** (lista, criar, ícone, ativar) | Extra prints | P0 | 1–1,5 sem |
| 2 | **BC-3** | **Campos do board** (listar, associar, criar) | **3** | P0 | 1,5–2 sem |
| 3 | **BC-5** | **Schema do Projeto** (campos obrigatórios / layout) | **4** | P1 | 1–1,5 sem |
| 4 | **BC-4** | **Acesso e funções** (subset MV5) | **2** | P1 | 2–4 sem |

**Porquê esta ordem:** BC-0 desbloqueia UI; tipos e campos são dados que o schema do projeto (BC-5) e as vistas do hub consomem; acesso custom é o mais invasivo (auth + API + migração mental de roles).

**Dependências técnicas:**

```text
BC-0 ──► BC-2 ──► BC-3 ──► BC-5
              └──► (hub lista/kanban usam type_id após BC-2)
BC-0 ──► BC-4 (paralelo a BC-3 só se 2 devs; senão sequencial no fim)
```

---

## BC-0 — Shell de configurações

**Objetivo:** navegação e guardrails; sem lógica de negócio pesada.

**Entregáveis:**

1. Rotas `settings/*` sob `boards/[boardSlug]`
2. `BoardSettingsLayout` + `BOARD_SETTINGS_NAV` (i18n PT/EN)
3. Gate: `allowPermissions(ADMIN, WORKSPACE)` — mensagem clara para MEMBER
4. Link «Informações» → `/{ws}/settings/boards` ou modal editar board existente

**Critério de pronto:** ADMIN abre settings do board, vê sidebar com itens; rotas filhas podem ser placeholder «Em breve».

**PARAR → OK explícito.**

---

## BC-2 — Tipos de card (ex-M2-16, sem ícones nas tabs)

**Referência Jira:** sidebar «Tipos de ticket» exceto **Projeto**.

**Objetivo:** ADMIN gere catálogo do board: Kickoff, Deploy, Imersão, Homologação, Tarefa…

**Modelo (recomendado):** `IssueType` (workspace) + **`BoardIssueType`** (nova) + sync `ProjectIssueType` ao criar/associar projeto ao board — ver [roadmap M2-16](./tech4humans-roadmap-mv3-mv5.md#m2-16--tipos-de-card-personalização-admin--fecho-do-mvp-2).

**UI:**

- Tabela ou lista: nome, ícone (`logo_props`), ativo, ordem
- «+ Adicionar tipo de card»
- Editar / desativar (não apagar issues históricas)

**API (esboço):**

| Método | Path |
|--------|------|
| GET/POST/PATCH | `/api/workspaces/{slug}/boards/{board_slug}/issue-types/` |

**Critério de pronto:** ADMIN cria «Deploy»; novo card em projeto do board oferece esse tipo; MEMBER não edita catálogo.

**PARAR → OK.**

---

## BC-3 — Campos do board (teu ponto 3)

**Referência Jira:** «Campos» + drawer «Adicionar campos» + «Criar campo novo» + grelha de tipos.

**Objetivo:** campos customizados **reutilizáveis** nos projetos (e cards) desse board.

**Abordagem técnica (a validar na abertura da fase):**

| Opção | Prós | Contras |
|-------|------|---------|
| A) Estender **Issue Property** / custom fields Plane | Reutiliza serializers e UI parcial | Pode não ter «board scope» nativo |
| B) Nova entidade **`BoardCustomField`** + valor em issue/project | Alinhado ao Jira «espaço» | Mais migração e UI nova |

**UI mínima (paridade Jira):**

1. Tabela de campos **ativos no board**
2. Botão **Adicionar campo** → drawer, pesquisa, checkboxes, confirmar
3. **Criar campo novo** → wizard: nome, tipo (dropdown da grelha Jira), descrição
4. Ações: editar metadados, remover do board (não apagar global se usado noutro sítio)

**Tipos MVP (subset):** texto curto, parágrafo, data, número, data/hora, dropdown (single), pessoas, URL.

**Fora de BC-3 inicial:** campos «BLOQUEADO» Jira, checklist YAML, integrações.

**Critério de pronto:** ADMIN cria «Cliente» (dropdown); campo aparece na config de tipo card e/ou projeto; valor guarda-se num card de teste.

**PARAR → OK.**

---

## BC-5 — Schema do Projeto / épico (teu ponto 4)

**Referência Jira:** «Tipos de ticket» → **Projeto** (campos descrição + contexto, drag, obrigatório).

**Objetivo:** definir **que campos** aparecem ao criar/editar um **Projeto** que pertence ao board (e quais são obrigatórios).

**Não é:** editar `IssueType` «Projeto» — no Tech4Humans **Projeto = `Project`**.

**Abordagem:**

1. **`BoardProjectFieldLayout`** (nome provisório): lista ordenada de `field_key` + `section` (`description` | `context`) + `required` + `enabled`
2. Campos disponíveis = união de **campos sistema** (nome, descrição, datas, lead, …) + **BC-3** (custom)
3. UI: duas colunas como Jira; painel direito «Campos» com pesquisa + arrastar ou botão adicionar
4. Formulário `CreateProjectModal` / settings do projeto **lê o layout** do board do projeto

**Campos dos prints (primeira versão):**

| Secção | Campos Jira | Mapeamento Plane |
|--------|-------------|------------------|
| Descrição | Resumo, Cliente, Descrição, Responsável, Desenvolvedor, Responsável (cliente), Pontos de atenção | `name`, custom Cliente, `description`, `project_lead`, custom… |
| Contexto | Status, Controle de tempo, Start date*, Data limite, % conclusão | `state`, estimate/time, `start_date`, `target_date`, custom % |

**Critério de pronto:** ADMIN marca «Cliente» obrigatório no layout; criar projeto no board exige Cliente; projeto fora do board não usa esse layout (fallback default Plane).

**PARAR → OK.**

---

## BC-4 — Acesso e funções (teu ponto 2)

**Referência Jira:** Acessar + Gerenciar funções + Criar função (árvore de permissões).

**Objetivo (MVP desta fase — subset, não cópia integral Jira):**

| Funcionalidade | Incluir em BC-4? |
|----------------|------------------|
| Listar membros WS com papel no **contexto board** | Sim |
| Adicionar / remover pessoa (via membership WS) | Sim |
| Alterar papel **entre presets** (Admin / Member / Guest) | Sim |
| «Acesso limitado» ao board (só convidados explícitos) | Opcional P2 — exige `BoardMember` |
| Criar função custom com 40+ checkboxes | **Não** — MV5 |
| Funções custom simples (5–10 permissões chave) | **Stretch** se sobrar tempo |

**Permissões chave (stretch):** criar card, editar card alheio, apagar card, gerir tipos, gerir campos, gerir settings board, gerir membros.

**Modelo mínimo se «Criar função» entrar:**

- `BoardRole` (board_id, name, description, permissions JSON)
- `BoardMember` (board_id, user_id, role_id | workspace_role fallback)

**Critério de pronto (mínimo):** ADMIN vê lista de membros do workspace com filtro «quem tem projetos neste board»; altera role WS; documentação do que ficou para MV5.

**Critério de pronto (completo):** + `BoardMember` + 1 função custom «PMO» com permissões limitadas.

**PARAR → OK produto + técnico.**

---

## Mapa prints → fase

| Print / ecrã Jira | Fase |
|-------------------|------|
| Informações do espaço | ✅ Já existe (BC-0 só liga) |
| Acessar + tabela utilizadores | BC-4 |
| Gerenciar funções / Criar função | BC-4 (subset / MV5) |
| Campos + drawer + criar campo | BC-3 |
| Tipos de ticket (lista) | BC-2 |
| Tipo Projeto — layout campos | BC-5 |
| Criar um campo (grelha tipos) | BC-3 |

---

## Critérios de aceite — onda «Board Config» fechada

- [ ] ADMIN entra em `…/boards/{slug}/settings` e navega todas as secções
- [ ] Tipos de card configuráveis e usados em novos cards (BC-2)
- [ ] Campos custom criados e associados ao board (BC-3)
- [ ] Layout do Projeto (épico) respeitado ao criar projeto no board (BC-5)
- [ ] Gestão de membros/papéis **documentada** — mínimo ou completo conforme BC-4
- [ ] Hub M2-3…M2-12 **sem regressão**
- [ ] `pnpm exec tsc -p apps/web/tsconfig.json --noEmit` sem erros novos

---

## Relação com MV3–MV5

| Onda Board Config | MV futuro |
|-------------------|-----------|
| BC-2 tipos | Antecipa M2-16 |
| BC-4 acesso | Antecipa **MV5** (RBAC) |
| BC-3 campos + BC-5 projeto | Base para **MV4** PRD (secções com campos estruturados) |
| — | **MV3** Status Report independente |

---

## Próximo passo

1. **Validar esta estrutura** (ordem BC-0 → BC-2 → BC-3 → BC-5 → BC-4 e subset de BC-4).
2. Dizer **«pode seguir BC-0»** para implementar o shell.
3. Por fase: enviar só prints **daquela fase** + «igual / parecido / não precisa».

**Não implementar** M2-13, M2-14, M2-15 nesta onda.
