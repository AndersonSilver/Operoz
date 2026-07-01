# Tech4Humans — Configuração do Board + MV3 (plano mestre)

**Data:** maio/2026  
**Contexto:** Referência Jira «Configurações do espaço» ([NOVO] Squad as a Service).  
**Decisão de produto:** **M2-13, M2-14 e M2-15 (ícones)** ficam **fora de escopo** — foco em **configuração operacional** do board e **Status Report (MV3)**.

**Documentos relacionados:**

- [tech4humans-boards-mvp2-plano.md](./tech4humans-boards-mvp2-plano.md) — hub e vistas (M2-0…M2-12 concluídos)
- [tech4humans-roadmap-mv3-mv5.md](./tech4humans-roadmap-mv3-mv5.md) — visão MV4/MV5
- [jira-vs-plane-comparativo.md](./jira-vs-plane-comparativo.md)

**Regra:** uma etapa de cada vez → validar → **PARAR** → só avançar com OK explícito.

---

## Vocabulário (fixo)

| Jira | Tech4Humans / Plane |
|------|---------------------|
| Espaço | **Workspace** |
| Squad / board Jira | **Board** (time) |
| Épico (OPS-17, linha pai) | **Projeto** |
| Story/Task (OPS-18…) | **Card** (`Issue`) |
| Tipo de ticket «Projeto» | **Schema do Projeto** (não confundir com `IssueType.is_epic`) |
| Tipos Kickoff, Deploy… | **Tipos de card** (`IssueType` + catálogo do board) |

---

## O que já existe (não repetir)

| # | Pedido | Estado no fork |
|---|--------|----------------|
| **1** | Configuração do espaço (nome, chave, ícone, dono…) | **Workspace** + lista de boards em `/{ws}/settings/boards` |
| Hub | Backlog, Lista, Quadro, Cronograma, Calendário, Resumo | **M2-3…M2-9** ✓ |
| API agregada | Issues, meta, modules | **M2-1, M2-9, M2-11** ✓ |
| Filtros no board | Projeto, estado, responsável… | **M2-2** ✓ |

---

## Menu lateral Jira — inventário completo (validado produto)

**Fonte:** print «Configurações do espaço» aberta (maio/2026).  
**Decisão:** implementar **tudo** desta lista, **exceto** «Cadeia de ferramentas» e «Apps».

### Cabeçalho da sidebar (não é item clicável)

| Elemento Jira | Plane (BC-0) |
|---------------|--------------|
| Título fixo «Configurações do espaço» | **Configurações do board** |
| Nome do espaço `[NOVO] Squad as a Service` | Nome do **board** + logo pequeno |
| Subtítulo «Espaço de software» | Opcional: «Board» / «Time» (sem copiar «software space») |

### Breadcrumb (área principal)

`Espaços / [NOVO] Squad as a Service / Configurações do espaço`  
→ `Workspace / {board} / Configurações do board`

### Itens do menu (ordem Jira → rota Plane)

| # | Item Jira | Subitens (quando aplicável) | Etapa | Rota sugerida |
|---|-----------|----------------------------|-------|---------------|
| 1 | **Informações** | — (página «Detalhes») | **BC-0** + conteúdo | `…/settings/boards/{slug}` ou `…/informacoes` |
| 2 | **Acessar** | — | **BC-4** | `…/acesso` |
| 3 | **Notificações** ▼ | Configurações; Auditoria de e-mails | **BC-5** | `…/notificacoes`, `…/notificacoes/auditoria` |
| 4 | **Automação** | — | **BC-6** | `…/automacao` |
| 5 | **Campos** | — | **BC-2** | `…/campos` |
| 6 | **Tipos de ticket** ▼ | ver lista abaixo | **BC-1** + **BC-3** | `…/tipos`, `…/tipos/projeto` |
| 7 | **Funções** | — | **BC-4b** (ou 4a simplificado) | `…/funcoes` |
| 8 | **Quadro** ▼ | (config do board Kanban no espaço — detalhar com print) | **BC-7** | `…/quadro` |
| 9 | **Cronograma** | — (config timeline do espaço — detalhar com print) | **BC-8** | `…/cronograma` |
| — | ~~Cadeia de ferramentas~~ | — | **Fora** | — |
| — | ~~Apps~~ ▼ | Checklist for Jira, etc. | **Fora** | — |

### Submenu «Tipos de ticket» (prints anteriores)

| Item Jira | Plane | Etapa |
|-----------|-------|-------|
| **Projeto** | Schema do **Projeto** (épico) | **BC-3** → `…/tipos/projeto` |
| Backlog | Tipo de **card** | **BC-1** |
| Deploy | Tipo de card | **BC-1** |
| Desenvolvimento | Tipo de card | **BC-1** |
| Homologação externa | Tipo de card | **BC-1** |
| Homologação interna | Tipo de card | **BC-1** |
| Imersão | Tipo de card | **BC-1** |
| Kickoff | Tipo de card | **BC-1** |
| Operação assistida | Tipo de card | **BC-1** |
| Sustentação | Tipo de card | **BC-1** |
| Tarefa | Tipo de card | **BC-1** |
| **+ Adicionar tipo do ticket** | Criar tipo de card | **BC-1** |

### Página «Informações» / Detalhes (conteúdo)

| Campo Jira | BC-0 (v1) | Notas |
|------------|-----------|-------|
| Ícone + «Alterar ícone» | Sim | `logo_props` do board |
| Nome * | Sim | `board.name` |
| Chave do espaço * (OPS) | Sim | `board.slug` (read-only após criar?) |
| Categoria | A definir | Pode ficar fora do v1 |
| Proprietário do espaço | A definir | Equivalente «lead do board»? |
| Responsável padrão | A definir | Default assignee em novos cards? |
| Salvar (disabled até mudar) | Sim | Padrão Plane settings |

---

## Mapa de fases (substitui M2-13…M2-16)

| ID | Nome | Item(s) sidebar Jira | Prioridade | Estimativa |
|----|------|----------------------|------------|------------|
| **BC-0** | Shell + **Informações** | #1 + cabeçalho + rotas vazias para todos os itens | P0 | 3–5 d |
| **BC-1** | Tipos de card | Tipos de ticket (exceto Projeto) | P0 | 1–1,5 sem |
| **BC-2** | Campos | #5 Campos | P0 | 1,5–2 sem |
| **BC-3** | Schema Projeto | Subitem Projeto | P0 | 1–1,5 sem |
| **BC-4** | Acesso + Funções | #2 Acessar, #7 Funções | P1 | 2–4 sem * |
| **BC-5** | Notificações | #3 Notificações | P1 | 1 sem (esboço) |
| **BC-6** | Automação | #4 Automação | P1 | 1–2 sem |
| **BC-7** | Config Quadro | #8 Quadro ▼ | P2 | TBD |
| **BC-8** | Config Cronograma | #9 Cronograma | P2 | TBD |
| **MV3** | Status Report | (tab hub, não settings) | P1 | 2–3 sem |

\* **BC-4** = 4a (rápido) ou 4b (funções Jira).

**Fora de escopo (confirmado):** Cadeia de ferramentas, Apps (+ integrações tipo Checklist).

**Cancelado:** M2-13…M2-15 (ícones).

**Renomeação:** M2-16 ≈ **BC-1**.

---

## Ordem recomendada de implementação

```text
BC-0 (shell + Informações + links para TODOS os itens da sidebar, exceto Apps/Cadeia)
   ├── BC-1 (tipos de card) ──────┐
   ├── BC-2 (campos) ─────────────┼──► BC-3 (Projeto)
   ├── BC-4 (acesso + funções)
   ├── BC-5 (notificações)
   ├── BC-6 (automação)
   ├── BC-7 (config quadro)      ← prints Quadro ▼ quando tiveres
   └── BC-8 (config cronograma)  ← prints Cronograma settings quando tiveres
MV3 (status report) — pode correr após BC-0 ou após BC-2
```

1. **BC-0** — menu lateral **completo** (itens acima); só **Informações** com formulário; resto placeholder «Em breve».  
2. **BC-1 … BC-3** — núcleo operacional (tipos, campos, projeto).  
3. **BC-4** — Acessar + Funções.  
4. **BC-5, BC-6** — Notificações + Automação.  
5. **BC-7, BC-8** — depois de prints dos submenus Quadro/Cronograma em settings.  
6. **MV3** — Status Report.

---

## BC-0 — Shell «Configurações do board»

**Objetivo:** entrada única, como Jira «Configurações do espaço».

### Entrada (validado produto — Jira)

No header do board, ao lado do nome do time, menu **`⋯` (três pontos)** com item:

| Jira | Plane (proposta) |
|------|------------------|
| Configurações do espaço (ícone engrenagem) | **Configurações do board** → `/{ws}/settings/boards/{boardSlug}` |

Outros itens do menu Jira (decidir no BC-0 ou depois):

| Item Jira | BC-0 |
|-----------|------|
| Remover de marcados com estrela | Fora (ou favoritos workspace) |
| Adicionar pessoas | Atalho para **Acessar** (BC-4) — opcional |
| Salvar como template | Fora |
| Definir plano de fundo | Fora |
| Arquivar espaço | **Sim** — atalho (já existe em WS settings) |
| Excluir espaço | Fora v1 (ou só ADMIN) |
| Espaço de software | Fora |

**Onde no código:** `BoardOverviewHeader` — hoje só tem breadcrumb + tabs; falta `CustomMenu` com `⋯`.

**Rota proposta (espelha sidebar Jira):**

```text
/{workspaceSlug}/settings/boards/{boardSlug}/
  ├── (default)                 → Informações / Detalhes
  ├── acesso                    → BC-4
  ├── notificacoes              → BC-5
  │   └── auditoria-email
  ├── automacao                 → BC-6
  ├── campos                    → BC-2
  ├── tipos                     → BC-1 (lista tipos de card)
  │   └── projeto               → BC-3
  ├── funcoes                   → BC-4b
  ├── quadro                    → BC-7 (subrotas TBD)
  └── cronograma                → BC-8
```

**UI:** layout settings (sidebar esquerda + conteúdo), breadcrumb `Workspace / {board} / Configurações do board`.

**BC-0 entrega o menu inteiro** (9 blocos + subitens Notificações e Tipos); páginas fora Informações = placeholder até à etapa respetiva.

**Critério de pronto:** ADMIN abre settings de um board; vê 5 secções; MEMBER/GUEST não acede (403 ou redirect).

**PARAR → OK antes de BC-1.**

---

## BC-1 — Tipos de card (antigo M2-16)

**Referência Jira:** sidebar «Tipos de ticket» — Backlog, Deploy, Desenvolvimento, Homologação, Imersão, Kickoff, Operação assistida, Sustentação, Tarefa, **+ Adicionar tipo**.

**Fora:** tipo «Projeto» (tratado em BC-3).

**Entregáveis:**

| Área | Detalhe |
|------|---------|
| Modelo | `IssueType` + `BoardIssueType` (ver [roadmap MV3–MV5](./tech4humans-roadmap-mv3-mv5.md)) |
| API | CRUD `…/boards/{slug}/issue-types/` — só ADMIN escreve |
| UI | Lista, criar, editar nome/ícone, ativar/desativar, ordem |
| Produto | Novo card no board só oferece tipos habilitados; sync `ProjectIssueType` ao criar projeto no board |
| CE | Implementar `IssueTypeSelect`, `FilterIssueTypes` (stubs hoje vazios) |

**Seed sugerido (alinhar com Jira):** Backlog, Deploy, Desenvolvimento, Homologação externa/interna, Imersão, Kickoff, Operação assistida, Sustentação, Tarefa.

**Critério de pronto:** ADMIN cria «Deploy»; membro vê no criar card; desativar tipo não quebra cards antigos.

**PARAR → OK antes de BC-2.**

---

## BC-2 — Campos no board

**Referência Jira:** «Campos» — tabela (Nome, Tipo, Descrição, Ações) + **Adicionar campo** + drawer com checkboxes + **Criar campo novo** (tipos: texto, data, número, dropdown, pessoas…).

**Objetivo:** campos **reutilizáveis** nos projetos/cards do board (Cliente, Criticidade, Ambiente, datas de homologação, etc.).

**Entregáveis (MVP da etapa):**

| # | Entregável |
|---|------------|
| 1 | `BoardCustomField` ou extensão: quais `IssueProperty`/custom fields do workspace estão **ativos no board** |
| 2 | UI lista + remover do board |
| 3 | Drawer «Adicionar campos» — campos globais WS ainda não no board |
| 4 | Fluxo «Criar campo novo» — tipos mínimos: texto curto, parágrafo, data, número, select, pessoas |
| 5 | Campos novos ficam disponíveis para BC-3 e para tipos de card (BC-1) |

**Reutilizar no Plane:** mecanismo existente de custom properties / issue properties (investigar EE vs fork antes de codar).

**Fora de BC-2 (inicial):** campos bloqueados tipo Jira «Objetivos BLOQUEADO»; integrações Checklist Jira.

**Critério de pronto:** ADMIN adiciona campo «Cliente» (select) ao board; aparece no formulário de card de um projeto do board.

**PARAR → OK antes de BC-3.**

---

## BC-3 — Schema do Projeto (épico Jira)

**Referência Jira:** «Tipos de ticket» → **Projeto** — secções «Campos de descrição» e «Campos de contexto»; arrastar campos; obrigatório (Resumo, Start date…); painel «Campos» à direita para adicionar.

**Objetivo:** definir **que informação um Projeto (épico) tem** no contexto deste board — não é um `IssueType` de card.

**Entregáveis:**

| # | Entregável |
|---|------------|
| 1 | Config `BoardProjectFieldLayout` (ordem, obrigatório, secção descrição vs contexto) |
| 2 | Campos candidatos = BC-2 + campos sistema (Resumo/nome, Responsável, datas, % conclusão…) |
| 3 | Formulário criar/editar **Projeto** (settings projeto ou modal) respeita layout |
| 4 | i18n: UI diz **Projeto**, nunca «Épico» no board |

**Campos Jira vistos nos prints (exemplo para validar contigo):** Resumo, Cliente, Descrição, Responsável, Desenvolvedor, Responsável (cliente), Pontos de atenção, Status, Controle de tempo, Start date, Data limite, % conclusão.

**Critério de pronto:** ADMIN marca «Cliente» obrigatório no Projeto; criar projeto no board exige Cliente.

**PARAR → OK antes de BC-4 ou MV3.**

---

## BC-4 — Acesso e funções

**Referência Jira:** secção sidebar **Acessar** (prints maio/2026).  
**Sub-entregas:** BC-4.1 página Acessar · BC-4.2 Adicionar pessoas · BC-4.3 Gerenciar/Criar funções.

### BC-4.1 — Página «Acessar» (inventário validado)

**Cabeçalho da página**

| Elemento Jira | Plane (proposta) | Notas |
|---------------|------------------|-------|
| Título **Acesso** | **Acesso** (ou «Acesso ao board») | Rota `…/acesso` |
| Botão **Adicionar pessoas** (primário) | Igual | → modal BC-4.2 |
| Botão **Gerenciar funções** (secundário) | Igual | → BC-4.3 |
| Texto «Este espaço tem **69** funções» + ℹ️ | Contagem dinâmica de funções do board | Só se BC-4b |

**Bloco «Acesso ao espaço»**

| Elemento Jira | Plane (proposta) |
|---------------|------------------|
| Título **Acesso ao espaço** | **Acesso ao board** |
| Estado **Limitado** (ícone pessoas) | Equivalente: board **privado** vs **aberto** no workspace |
| Botão **Alterar acesso ao espaço** | Abre fluxo para mudar política de acesso |
| Caixa explicativa | «Quem no workspace pode ver/comentar vs quem pode criar/editar neste board» — adaptar texto D3 |

**Abas**

| Aba Jira | Plane |
|----------|-------|
| **Usuários atuais** (ativa) | Lista principal de membros |
| **Solicitações de acesso** (badge `0`) | Fila de pedidos pendentes — implementar se existir fluxo de «pedir acesso»; senão v1 com empty state |

**Barra de ferramentas (acima da tabela)**

| Elemento Jira | Plane |
|---------------|-------|
| Campo **Pesquisar funções** (placeholder; na prática pesquisa utilizadores na tabela) | **Pesquisar pessoas** (nome/e-mail) — corrigir copy PT |
| **Select «Funções»** (multi-checkbox) | Filtro por papel: Administrador, Membro, Observador, Member (Com Delete), … | Ver print filtro |

**Filtro «Funções» (dropdown)** — opções vistas:

- Administrador  
- Membro  
- Observador  
- Member (Com Delete) — função custom Jira  

**Tabela «Usuários atuais»**

| Coluna Jira | Plane | Comportamento |
|-------------|-------|---------------|
| **Nome** | Nome + avatar | Ordenável (Jira: seta ↑) |
| **E-mail** | E-mail | |
| **Função** | **Função** (dropdown por linha) | Valores: «Membro», «Várias (2 funções)», etc. |
| **Ação** | **Ação** | Link **Remover** por utilizador |

**Exemplos de dados (referência):** Alexandre do Amaral — Membro; Anderson Silveira — Várias (2 funções).

### BC-4.2 — Modal **Adicionar pessoas** (validado)

**Título:** Adicionar pessoas · header com `⋯` + **X** fechar.

| Campo / ação | Jira | Plane (proposta) | Obrigatório |
|--------------|------|------------------|-------------|
| **Nomes ou e-mails** | Input multi + placeholder `Maria, maria@company.com` | Convite por e-mail ou pick de membros WS; chips de sugestão | * |
| Integração **Google** | «Conectado a Google» + sugestões (Pedro, Yasmin, Ulisses, Vitor…) | Opcional v1: só membros já no workspace; Google/contacts **fora** v1 | |
| Chips `+ Nome` | Atalhos de pessoas frequentes | Opcional P2 | |
| **Função** | Dropdown (default **Membro**) | Papel ao adicionar (lista = funções BC-4.3 ou WS Admin/Member/Guest em 4a) | * |
| Rodapé legal | reCAPTCHA / Google | Fora (Plane auth próprio) | |
| **Cancelar** | Fecha sem gravar | Igual | |
| **Adicionar** | Primário azul | Submete convite/atribuição | |

**Fluxo esperado no Plane:** abrir modal → preencher e-mail(s) ou selecionar membro → escolher função → Adicionar → linha na tabela BC-4.1.

### BC-4.3 — Modal **Gerenciar funções** (validado — lista)

**Abertura:** botão na página Acessar (BC-4.1). **Título:** Gerenciar funções · **X** fechar.

**Lista de funções** (cada linha: nome, descrição, ações à direita):

| Função Jira | Descrição (resumo) | Ações na linha |
|-------------|-------------------|----------------|
| **Administrador** | Pode quase tudo: settings, outros admins | Duplicar |
| **Convidado - Colaborador** | Só um espaço atribuído; colaborador externo; non-billable | Duplicar |
| **Membro** | Equipa: adicionar, editar, colaborar em todo o trabalho | Duplicar |
| **Observador** | Ver, pesquisar, comentar; pouco mais | Duplicar |
| **Member (Com Delete)** | Membro + **eliminar** trabalho | Duplicar + **Eliminar** (função custom) |

**Regra UI:** funções **sistema** → só duplicar; funções **custom** → duplicar + apagar.

**Rodapé**

| Botão | Ação |
|-------|------|
| **Criar função** | Abre fluxo BC-4.3b (matriz de permissões — print seguinte) |
| **Fechar** | Fecha modal |

**Plane:** modal ou página `…/funcoes`; contagem «69 funções» na BC-4.1 = `length` desta lista.

### BC-4.3b — Modal **Criar função** (validado — formulário + permissões)

**Fonte:** 5 prints do scroll «Criar função» (Jira, espaço *[NOVO] Squad as a Service*). No Plane substituir pelo **nome do board**.

#### Campos do formulário

| Campo | Obrigatório | Placeholder / UI |
|-------|-------------|------------------|
| **Nome** | * | «Dê um nome único para a função» |
| **Descrição** | * | «Faça uma descrição breve sobre o que essa função representa no espaço…» |
| Secção **As pessoas nessa função podem:** | — | Lista scrollável com checkboxes (árvore) |
| **Atribua essa função a:** | opcional | Pesquisa «Nome, e-mail ou grupo» + 🔍 |
| **Criar** / **Descartar** | — | Primário / texto |

**Duplicar função:** mesmo formulário com dados pré-preenchidos (ação na lista BC-4.3).

#### Catálogo de permissões (ordem do scroll Jira → `permission_key`)

Grupos **pai** podem ter checkbox que marca/desmarca filhos; filhos indentados (como Jira).

| # | `permission_key` | Título Jira (PT) | Pai | Plane (mapeamento alvo) | MVP |
|---|------------------|------------------|-----|-------------------------|-----|
| 1 | `board.administer` | **Administrar** {board} | — | Settings board, pessoas, tipos, campos, apagar board | BC-4b |
| 2 | `items.manage` | **Gerenciar itens** {board} | — | Gestão ampla de cards (meta-permissão) | BC-4b |
| 2.1 | `items.watchers.manage` | Gerenciar lista de espectadores | `items.manage` | Seguidores do card | BC-4b |
| 2.2 | `items.attachments.delete_any` | Excluir anexos (de qualquer pessoa) | `items.manage` | Apagar anexo alheio | BC-4b |
| 2.3 | `items.comments.delete_any` | Excluir comentários (de qualquer pessoa) | `items.manage` | Apagar comentário alheio | BC-4b |
| 2.4 | `items.delete` | Excluir itens (permanente) | `items.manage` | Apagar card | BC-4b |
| 3 | `items.archive_any` | Arquivar qualquer item | — | Arquivar card/subtarefa | BC-4b |
| 4 | `items.restore_archived` | Restaurar qualquer item arquivado | — | Restaurar arquivado | BC-4b |
| 5 | `items.worklog.delete_any` | Excluir entradas de registro de atividades (de qualquer pessoa) | — | Apagar worklog alheio | P2 |
| 6 | `items.comments.edit_any` | Editar comentários (de qualquer pessoa) | — | Editar comentário alheio | BC-4b |
| 7 | `items.due_date.edit` | Editar datas de vencimento | — | Alterar `target_date` após criar | BC-4b |
| 8 | `items.worklog.edit_any` | Editar entradas de registro de atividades (de qualquer pessoa) | — | Editar worklog alheio | P2 |
| 9 | `items.reporter.modify` | Modificar relatores | — | Campo relator / criador | P2 |
| 10 | `sprints.manage` | **Gerenciar sprints** {board} | — | Ciclos do board (≈ sprints Jira) | P2 |
| 11 | `versions.manage` | **Gerenciar as versões** {board} | — | Versões/releases (se existir) | P2 |
| 12 | `dev_tools.access` | Acessar ferramentas de desenvolvimento | — | Integrações dev (commits, builds) | Fora |
| 13 | `items.work` | **Trabalhar nos itens** {board} | — | Editar, atribuir, transição, vincular, worklog | BC-4b |
| 13.1 | `items.assign` | Atribuir qualquer item | `items.work` | Responsáveis do card | BC-4b |
| 13.2 | `items.worklog.delete_own` | Excluir as **próprias** entradas de registro de atividades | `items.work` | Apagar próprio worklog | P2 |
| 13.3 | `items.edit` | Editar qualquer item | `items.work` | Editar card + custom fields | BC-4b |
| 13.4 | `items.worklog.edit_own` | Editar as **próprias** entradas de registro de atividades | `items.work` | Editar próprio worklog | P2 |
| 13.5 | `items.link` | Vincular qualquer item | `items.work` | Links entre cards | BC-4b |
| 13.6 | `items.worklog.log` | Registrar trabalho em qualquer item | `items.work` | Tempo / worklog | P2 |
| 13.7 | `items.restrict_visibility` | Restringir qualquer item | `items.work` | Visibilidade restrita do card | P2 |
| 14 | `items.move` | Mover qualquer item | — | Mover card para outro projeto | P2 |
| 15 | `items.transition` | Fazer a transição de qualquer item | — | Mudar estado (workflow) | BC-4b |
| 16 | `items.create` | **Criar itens** {board} | — | Criar card no board | BC-4b |
| 17 | `items.collaborate` | **Colaborar nos itens** {board} | — | Comentar + anexos (meta) | BC-4b |
| 17.1 | `items.attachments.add` | Adicionar anexos | `items.collaborate` | Upload anexo | BC-4b |
| 17.2 | `items.comments.add` | Adicionar comentários | `items.collaborate` | Comentar | BC-4b |
| 17.3 | `items.attachments.delete_own` | Excluir os anexos de **outros** (só os que o utilizador adicionou) | `items.collaborate` | Apagar anexo próprio em card alheio | BC-4b |
| 17.4 | `items.comments.delete_own` | Excluir os comentários de **outros** (só os que o utilizador adicionou) | `items.collaborate` | Apagar comentário próprio em card alheio | BC-4b |
| 17.5 | `items.comments.edit_own` | Editar os comentários de **outros** (só os que o utilizador adicionou) | `items.collaborate` | Editar comentário próprio em card alheio | BC-4b |
| 17.6 | `items.watchers.view` | Ver seguidores | `items.collaborate` | Ver lista de seguidores | BC-4b |

**Total:** 11 grupos de topo + 18 sub-permissões = **29 chaves** (sem contar pais como permissão efectiva — definir se pai só agrupa ou também grava flag).

#### Descrições Jira (texto de ajuda — copiar para i18n `boards.permissions.*`)

Cada linha do Jira traz um parágrafo explicativo; no doc completo usar o texto dos prints. Resumos:

- **Administrar:** editar acesso, pessoas, permissões, tipos de itens, campos, funções do projeto, excluir projeto.  
- **Gerenciar itens:** relatores, seguidores, comentários, anexos, worklog, excluir itens.  
- **Trabalhar nos itens:** editar, atribuir, transição, vincular, registar trabalho.  
- **Colaborar:** comentar e anexar; sub-itens para add/delete/edit «próprios» em conteúdo alheio.  
- **Criar itens:** criar e preencher campos na criação.  
- **Mover / Transição / Arquivar / Restaurar:** como nos títulos.

#### MVP BC-4b — fases de entrega de permissões

| Fase | Chaves | Motivo |
|------|--------|--------|
| **4b-v1 (núcleo)** | `board.administer`, `items.create`, `items.edit`, `items.assign`, `items.transition`, `items.delete`, `items.collaborate` + filhos 17.x, `items.manage` + 2.1–2.4 | Operação diária do board |
| **4b-v2** | arquivo, restaurar, due_date, comments/attachments delete_any, edit_any | Gestão moderada |
| **4b-v3 / Fora** | sprints, versions, dev_tools, worklog *, move, restrict, reporter | Paridade Jira ou integrações |

#### Modelo técnico (esboço)

```text
BoardRole { board_id, name, description, is_system }
BoardRolePermission { role_id, permission_key, granted }
BoardMemberRole { board_id, user_id, role_id }  // múltiplas funções → N linhas
```

Funções **sistema** (Administrador, Membro, Observador, Convidado): `is_system=true`, sem apagar; permissões pré-definidas.

**Pendente BC-4:**

- [x] BC-4.3b Criar função — catálogo de permissões  
- [ ] Fluxo **Alterar acesso ao espaço** (Limitado vs ?)  
- [ ] Comportamento aba **Solicitações de acesso** quando badge > 0  

### BC-4a — Acesso simplificado (alternativa mais rápida)

| Entregável | Detalhe |
|------------|---------|
| Lista | Membros do workspace (herança D3) |
| Função | Só papéis WS: Admin / Member / Guest (sem «Várias funções») |
| Fora | Funções custom, filtro multi-função, solicitações de acesso |

**Estimativa:** ~1 semana.

### BC-4b — Paridade Jira (funções custom) — **recomendado** (catálogo acima)

| Entregável | Detalhe |
|------------|---------|
| BC-4.1, 4.2, 4.3 | Página, adicionar pessoas, gerenciar/criar/duplicar função |
| Matriz | **29 `permission_key`** (tabela BC-4.3b); UI árvore com scroll |
| Múltiplas funções | «Várias (2 funções)» por utilizador |
| Motor | `BoardRole` + checks no API/web (nível board) |

**Estimativa:** 4–6 semanas (4b-v1 núcleo ~2–3 sem).

**Decisão em aberto:** confirmar **BC-4b** vs atalho **BC-4a** só para lançar BC-0 mais cedo.

**PARAR → OK do desenho BC-4 antes de BC-0 código.**

---

## MV3 — Status Report

**Objetivo:** relatório de status **periódico** do board (stakeholders), distinto do **Resumo** ao vivo (M2-9).

**Não é:** duplicar KPIs do overview; é narrativa + snapshot no tempo.

### Conteúdo proposto (v1)

| Secção | Fonte de dados |
|--------|----------------|
| Cabeçalho | Board, período (semana/quinzena), autor, data publicação |
| Resumo executivo | Texto livre (editor) |
| Por projeto (épico) | Lista projetos do board + % conclusão, issues abertas/fechadas no período |
| Destaques / entregas | Issues concluídas no período (filtro data) |
| Riscos e bloqueios | Issues em estado bloqueado / overdue (meta + filtros) |
| Métricas | Reutilizar `GET …/boards/{slug}/meta/` + delta vs período anterior |
| Distribuição por estado | `state_distribution` do meta |

### UI / rotas

```text
/{workspaceSlug}/boards/{boardSlug}/status-report
/{workspaceSlug}/boards/{boardSlug}/status-report/{reportId}   # histórico
```

Opcional na sidebar do board ou tab «Relatório» ao lado de Resumo.

### API (novo)

| Método | Path | Notas |
|--------|------|--------|
| GET | `…/boards/{slug}/status-reports/` | Lista versões |
| POST | `…/boards/{slug}/status-reports/` | Cria rascunho |
| GET/PATCH | `…/status-reports/{id}/` | Editar/publicar |
| GET | `…/status-reports/{id}/export/` | Markdown ou PDF (v1 = MD) |

Modelo sugerido: `BoardStatusReport` (`board_id`, `period_start`, `period_end`, `content` JSON ou HTML, `published_at`, `created_by`).

### Permissões

| Ação | Quem |
|------|------|
| Ver publicados | MEMBER+, GUEST se projetos visíveis |
| Criar/editar/publicar | ADMIN (v1); MEMBER opcional v1.1 |
| Exportar | Quem pode ver |

### Fora de MV3 (v1)

- Email automático semanal
- IA a escrever o report
- Confluence sync (MV3.1)
- Comentários no report

**Estimativa:** 2–3 semanas (após BC-0; ideal com BC-2 para campos no texto do report).

**Critério de pronto:** ADMIN gera report da semana, vê por projeto, exporta MD, histórico consultável.

**PARAR → OK antes de MV4 (PRD).**

---

## Critérios de aceite — «MVP config + MV3» fechado

- [ ] Settings do board com 5 secções navegáveis (BC-0)
- [ ] Tipos de card configuráveis pelo ADMIN (BC-1)
- [ ] Campos custom no board + criar campo (BC-2)
- [ ] Layout de campos do **Projeto** configurável (BC-3)
- [ ] Acesso: pelo menos BC-4a OU BC-4b acordado e entregue
- [ ] Status Report: criar, publicar, histórico, export MD (MV3)
- [ ] Hub M2-0…M2-12 sem regressão
- [ ] Guest: não vê settings; vê report publicado se tiver acesso aos projetos

---

## Decisões para fechar contigo (antes de codar)

1. **BC-4:** só **4a** (rápido) ou **4b** (Jira completo) nesta onda?  
2. **MV3:** tab nova no header do board ou só rota + link no Resumo?  
3. **Campos:** reutilizar 100% custom fields Plane ou tabela nova `Board*`?  
4. **Projeto:** schema no **board** ou por **projeto** com default do board?  
5. **Ordem:** confirmas BC-0 → BC-1 → BC-2 → BC-3 → (BC-4) → MV3?

---

## Próximo passo

Responde às **5 decisões** acima (pode ser curto: «4a, tab sim, reutilizar, default board, ordem ok»).

Quando quiseres código: **«pode seguir BC-0»** (ou outra etapa).

Ícones M2-13…15: **cancelados** salvo pedido explícito futuro.
