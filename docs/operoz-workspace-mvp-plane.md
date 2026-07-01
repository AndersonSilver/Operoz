# Operoz — Espaço de trabalho (Workspace): referência Plane + MVP de implementação

Documento de produto e engenharia baseado na documentação oficial do [Plane](https://docs.plane.so/). Objetivo: definir um **MVP priorizado** para a secção **Gestão do espaço de trabalho** no Operoz (fork Plane + camada Board Tech4Humans).

> **Catálogo completo (todas as secções da sidebar):** [operoz-plane-catalogo-completo-docs.md](./operoz-plane-catalogo-completo-docs.md) — inclui Gerenciamento de projetos, Itens de trabalho, Planejamento, Vistas, Conhecimento, Gestão avançada, Comunicação, Admissão, Integrações, Import/Export e IA.

**Última atualização:** junho/2026  
**Fontes principais:** [Manage workspace](https://docs.plane.so/core-concepts/workspaces/overview), [Members](https://docs.plane.so/core-concepts/workspaces/members), [Roles](https://docs.plane.so/roles-and-permissions/overview), [Search](https://docs.plane.so/workspaces-and-users/search-workspace), [Navigation](https://docs.plane.so/workspaces-and-users/customize-navigation), [Permissions matrix](https://docs.plane.so/roles-and-permissions/permissions-matrix).

---

## 1. O que é um workspace no Plane

O **workspace** (espaço de trabalho) é o **nível mais alto** da hierarquia. Funciona como “centro de comando” da organização:

```text
Workspace (empresa / instância lógica)
├── Projetos (+ itens, ciclos, módulos, páginas)
├── Membros e papéis
├── Configurações, integrações, import/export
├── Wiki, iniciativas, releases, dashboards (conforme plano)
└── Preferências pessoais (home, sidebar) — por utilizador, dentro do workspace
```

No Operoz, o mesmo conceito existe no modelo `Workspace` e na rota `/{workspaceSlug}/…`. A hierarquia **Tech4Humans** acrescenta **Board** entre workspace e projeto:

```text
Workspace → Board (time) → Projeto (épico) → Card → Subtarefa
```

Este documento trata do **workspace**; Boards estão em [tech4humans-boards-plano-desenvolvimento.md](./tech4humans-boards-plano-desenvolvimento.md).

---

## 2. Inventário completo — funcionalidades de workspace (Plane)

Legenda de prioridade sugerida para o Operoz:

| Tag       | Significado                                            |
| --------- | ------------------------------------------------------ |
| **MVP**   | Entregar na primeira onda “workspace Operoz”           |
| **MVP+**  | Segunda onda, logo após MVP estável                    |
| **Stock** | Já existe no fork (herdado do Plane); validar UX/copy  |
| **Gap**   | Plane tem; Operoz precisa alinhar ou não tem           |
| **CE**    | Plane Commercial / plano pago — fora de escopo inicial |
| **N/A**   | Não aplicável ao Operoz self-hosted / produto          |

### 2.1 Ciclo de vida do workspace

| Funcionalidade             | Descrição (Plane)                                    | Tag Operoz                                                             |
| -------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| Criar no onboarding        | Primeiro workspace na conta nova                     | **Stock**                                                              |
| Criar workspace adicional  | Nome + slug único no dropdown do canto superior      | **Stock**                                                              |
| Slug / URL única           | Nomes podem repetir; slug não                        | **Stock**                                                              |
| Entrar por convite (email) | Link no email → aceitar                              | **Stock**                                                              |
| Convites pendentes         | Menu “Workspace invites” no dropdown                 | **Stock** / **Gap** UX                                                 |
| Alternar entre workspaces  | Mesmo email; dropdown de workspaces                  | **Stock**                                                              |
| Definições do workspace    | Settings: membros, integrações, import/export, geral | **Stock**                                                              |
| Apagar workspace           | Só Owner/Admin; irreversível; exportar antes         | **Stock** — validar papel Owner                                        |
| Transferir propriedade     | Só **Owner**                                         | **Gap** — Operoz usa `owner` FK + Admin(20), sem papel Owner explícito |

Referência: [Create and manage workspaces](https://docs.plane.so/core-concepts/workspaces/overview).

### 2.2 Conteúdo “dentro” do workspace (visão produto)

| Componente   | Papel                                                          |
| ------------ | -------------------------------------------------------------- |
| **Projetos** | Unidade principal de trabalho; itens, ciclos, módulos, páginas |
| **Membros**  | Utilizadores com papel workspace + papéis por projeto          |

No Plane recente, também existem recursos **ao nível workspace** (nem todos no Community Edition):

| Recurso workspace        | Descrição breve                             | Tag Operoz                           |
| ------------------------ | ------------------------------------------- | ------------------------------------ |
| Wiki / páginas workspace | Base de conhecimento partilhada             | **Stock** / parcial                  |
| Workspace views          | Vistas guardadas cross-project              | **Stock**                            |
| Initiatives              | Planejamento estratégico multi-projeto      | **CE** / verificar fork              |
| Teamspaces               | Agrupamento tipo “time” com link a projetos | **CE** — Operoz usa **Board** custom |
| Releases                 | Versões / changelog agregado                | **CE**                               |
| Customers                | Registo de clientes                         | **CE**                               |
| Dashboards               | Painéis analíticos workspace                | **CE** / parcial                     |
| Analytics                | Métricas workspace                          | **Stock**                            |
| Drafts (workspace)       | Rascunhos de itens antes de projeto         | **Stock**                            |
| Stickies                 | Notas rápidas (home)                        | **Stock**                            |
| Your Work                | Vista pessoal de trabalho atribuído         | **Stock**                            |
| Inbox / notificações     | Centro de notificações                      | **Stock**                            |
| Archives (workspace)     | Arquivo global                              | **Stock**                            |

### 2.3 Membros e convites

| Funcionalidade              | Detalhe Plane                                             | Tag Operoz                     |
| --------------------------- | --------------------------------------------------------- | ------------------------------ |
| Convidar por email          | Modal; papel por pessoa; “Add another”                    | **Stock**                      |
| Convite pendente / remover  | Até aceitar ou recusar                                    | **Stock**                      |
| Import CSV de membros       | Colunas: Email, Display Name, First Name, Last Name, Role | **Gap** — verificar API        |
| Papéis CSV                  | `owner`, `admin`, `member`, `guest` ou numéricos 5/15/20  | **Gap**                        |
| Alterar papel               | Efeito imediato                                           | **Stock**                      |
| Remover membro              | Perde acesso a tudo no workspace                          | **Stock**                      |
| Sair do workspace           | Menu … no próprio utilizador                              | **Stock**                      |
| Proteção último admin       | Não pode sair se único Owner/Admin                        | **Gap** — reforçar regra       |
| Atividade / audit (membros) | Convites, aceites, mudanças de papel, remoções            | **Gap** / **MVP+**             |
| SMTP (self-hosted)          | Emails de convite dependem de SMTP                        | **MVP** — documentar em deploy |

Referência: [Manage workspace members](https://docs.plane.so/core-concepts/workspaces/members).

### 2.4 Papéis e permissões (workspace)

#### Papéis de sistema (Plane atual)

| Papel workspace | Quem é                                                        | Operoz hoje (`ROLE_CHOICES`)                                                |
| --------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Owner**       | Máximo; apagar workspace; transferir ownership                | Implícito via `Workspace.owner` — **sem** `role=Owner` em `WorkspaceMember` |
| **Admin**       | Gestão total exceto delete workspace / transfer               | `role=20` Admin                                                             |
| **Member**      | Colaborador interno; projetos só se adicionado                | `role=15` Member                                                            |
| **Guest**       | Só projetos onde foi convidado; teto de privilégio em projeto | `role=5` Guest                                                              |

Papéis de **projeto** (independentes): Admin, Contributor, Commenter, Guest — ver [Member roles](https://docs.plane.so/roles-and-permissions/member-roles).

#### Regras importantes

| Regra                                             | Implicação para implementação                                         |
| ------------------------------------------------- | --------------------------------------------------------------------- | --------------------------- |
| Owner/Admin têm wildcard em **todos** os projetos | Não precisam de `ProjectMember` para ver/editar                       |
| Auto-join em projeto público                      | Owner/Admin → Project Admin; Member → Contributor; Guest → Guest      |
| Guest ceiling                                     | Guest workspace não pode ser promovido a Contributor/Admin no projeto |
| Hierarquia de autoridade                          | Só pode gerir membros com nível inferior                              |
| RBAC vs GAC                                       | Papéis fixos vs papéis custom + permission schemes (**Enterprise**)   | Operoz MVP: **RBAC** apenas |
| Cache de permissões                               | 5 min user / 24 h role; invalidação ao mudar papel                    | **MVP+** se alterarem RBAC  |

Referências: [Roles and permissions](https://docs.plane.so/roles-and-permissions/overview), [Permissions matrix](https://docs.plane.so/roles-and-permissions/permissions-matrix).

#### Matriz resumida — permissões workspace (extraído da doc)

**Definições gerais**

| Área                                | Owner | Admin |  Member  | Guest |
| ----------------------------------- | :---: | :---: | :------: | :---: |
| Ver settings                        |   ✓   |   ✓   |    ✓     |   ✓   |
| Editar settings / apagar workspace  |   ✓   |  ✓/—  |    —     |   —   |
| Convidar / importar membros         |   ✓   |   ✓   |    —     |   —   |
| Listar todos os projetos            |   ✓   |   ✓   |    ✓     |   —   |
| Criar projeto                       |   ✓   |   ✓   |    —     |   —   |
| Wiki (ver/criar páginas)            |   ✓   |   ✓   |    ✓     |   —   |
| Workspace views (criar)             |   ✓   |   ✓   |    ✓     |   —   |
| Analytics (ver/exportar)            |   ✓   |   ✓   |    ✓     |   —   |
| Integrações / webhooks (gerir)      |   ✓   |   ✓   |    —     |   —   |
| Initiatives / Teamspaces / Releases |   ✓   |   ✓   | limitado |   —   |

_(Matriz completa: dezenas de linhas — usar link oficial para implementação fina de GAC.)_

### 2.5 Pesquisa e Power K

| Funcionalidade                        | Detalhe                                                                        | Tag Operoz                     |
| ------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------ |
| Atalho `Cmd/Ctrl + K`                 | Abre pesquisa global                                                           | **Stock**                      |
| Abas de resultado                     | All, Projects, Work items, Cycles, Modules, Views, Pages, Teamspaces, Comments | **Stock** / **Gap** Teamspaces |
| Busca por ID                          | `PROJ-123` salta para o item                                                   | **Stock**                      |
| Tempo real, parcial, case insensitive | UX de search                                                                   | **Stock**                      |
| Respeita permissões                   | Sem projetos privados / arquivados                                             | **Stock**                      |
| Power K — criar entidades             | Projeto, item, ciclo, módulo, vista, página, workspace                         | **Stock** parcial              |
| Power K — settings / tema / docs      | Atalhos administrativos                                                        | **Stock** parcial              |

Referências: [Search workspace](https://docs.plane.so/workspaces-and-users/search-workspace), [Power K](https://docs.plane.so/core-concepts/power-k).

### 2.6 Personalização (por utilizador, no workspace)

| Funcionalidade                | Detalhe                                                         | Modelo Operoz                                           |
| ----------------------------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| Homepage — widgets            | Atalhos, recents, stickies, my work, ciclos, notificações, etc. | `WorkspaceHomePreference`                               |
| Quick links                   | Links fixados na home                                           | `WorkspaceUserLink`                                     |
| Sidebar — itens visíveis      | Check/uncheck + reordenar                                       | `WorkspaceUserPreference`                               |
| Estilo navegação projeto      | Accordion vs horizontal tabs                                    | `WorkspaceUserProperties.navigation_control_preference` |
| Limite de projetos na sidebar | N mais recentes; resto em “More”                                | `navigation_project_limit`                              |
| Filtros / display props       | Preferências de listas                                          | `view_props`, `rich_filters` JSON                       |

Referências: [Personalize homepage](https://docs.plane.so/core-concepts/account/overview), [Customize navigation](https://docs.plane.so/workspaces-and-users/customize-navigation).

### 2.7 Settings — administração

| Secção settings | Conteúdo típico                              | Tag Operoz                    |
| --------------- | -------------------------------------------- | ----------------------------- |
| General         | Nome, logo, timezone, slug, apagar workspace | **Stock**                     |
| Members         | Lista, convites, CSV, seats (cloud)          | **Stock** / CSV **Gap**       |
| Billing         | Stripe, planos, lugares                      | **N/A** self-hosted ou **CE** |
| Identity / SSO  | OIDC, SAML, domínios                         | **MVP+** self-hosted          |
| Integrations    | GitHub, GitLab, Slack, Sentry, etc.          | **Stock** parcial             |
| Webhooks        | CRUD webhooks workspace                      | **Stock** (`webhook.store`)   |
| API keys        | Tokens para API                              | **Stock**                     |
| Imports         | Jira, Linear, Asana, CSV, …                  | **Stock** / CE                |
| Exports         | CSV, Excel, JSON                             | **Stock**                     |
| Roles custom    | Permission schemes                           | **CE** — não MVP              |

Referências: [SSO](https://docs.plane.so/authentication/sso), [Importers](https://docs.plane.so/importers/overview), [Billing](https://docs.plane.so/workspaces-and-users/billing-and-plans).

### 2.8 Import / export de dados

| Importador                                       | Origem                         | Tag Operoz   |
| ------------------------------------------------ | ------------------------------ | ------------ |
| Jira, Linear, Asana, ClickUp, Notion, Confluence | Migração                       | **Stock** CE |
| CSV / Flatfile                                   | Itens com mapeamento de campos | **Stock**    |
| Export workspace                                 | Backup / compliance            | **Stock**    |

### 2.9 Autenticação e segurança

| Funcionalidade                   | Tag Operoz |
| -------------------------------- | ---------- |
| Email + password                 | **Stock**  |
| SSO OIDC / SAML                  | **MVP+**   |
| IdP Group Sync                   | **CE**     |
| Domínios verificados (workspace) | **MVP+**   |

### 2.10 AI e MCP (Plane docs)

| Funcionalidade      | Tag Operoz                                                        |
| ------------------- | ----------------------------------------------------------------- |
| Plane AI / créditos | **N/A** ou produto próprio                                        |
| MCP Server oficial  | Operoz tem [mcp-server](../mcp-server/README.md) — alinhar escopo |

---

## 3. Estado atual no Operoz (código)

### 3.1 Modelo de dados (`apps/api/operoz/db/models/workspace.py`)

| Entidade                  | Função                                                                |
| ------------------------- | --------------------------------------------------------------------- |
| `Workspace`               | `name`, `slug`, `owner`, `timezone`, `logo`, flags de email de issues |
| `WorkspaceMember`         | `role`: 20 Admin, 15 Member, 5 Guest                                  |
| `WorkspaceMemberInvite`   | Convite por email + token + `role`                                    |
| `Team`                    | Equipas legacy (Plane); Tech4Humans prefere **Board**                 |
| `WorkspaceTheme`          | Temas de cor por utilizador                                           |
| `WorkspaceUserProperties` | Navegação, filtros, limite projetos sidebar                           |
| `WorkspaceHomePreference` | Widgets da home                                                       |
| `WorkspaceUserPreference` | Pin de secções sidebar                                                |
| `WorkspaceUserLink`       | Quick links                                                           |

### 3.2 Permissões (`apps/api/operoz/utils/permissions/workspace.py`)

Baseadas em `WorkspaceMember.role == Admin` para operações administrativas. **Não** há distinção Owner vs Admin no enum — o **owner** é campo `Workspace.owner`.

### 3.3 Frontend (`apps/web`)

- Rotas `/{workspaceSlug}/settings/…`
- Store `core/store/workspace/index.ts` — criar workspace, redirecionamento `/create-workspace`
- Webhooks, links, stickies, home preferences — stores existentes

### 3.4 Diferenças Plane × Operoz (resumo)

| Tópico        | Plane (doc 2025+)                   | Operoz                                      |
| ------------- | ----------------------------------- | ------------------------------------------- |
| Papel Owner   | Role explícito + transfer ownership | `owner` user + Admin role no membro criador |
| Board (time)  | Teamspaces (CE)                     | Entidade **Board** custom (Tech4Humans)     |
| CSV membros   | Documentado                         | Confirmar endpoint/UI                       |
| Audit membros | Painel Activity                     | Verificar se existe no fork                 |
| Guest billing | Guest não conta lugar pago          | N/A self-hosted                             |

---

## 4. MVP Operoz — “Workspace sólido”

### 4.1 Objetivo do MVP

Entregar uma experiência de **espaço de trabalho** previsível para equipas Tech4Humans/Operoz:

1. Qualquer utilizador entende **onde está** (workspace → boards → projetos).
2. Admins gerem **membros e convites** sem ambiguidade de papéis.
3. Colaboradores encontram trabalho (**search**, **home**, **your work**).
4. Self-hosted envia **emails de convite** de forma confiável.

**Fora do MVP:** billing Stripe, papéis custom GAC, initiatives/releases Plane CE, SSO SAML completo, import Jira automatizado (pode usar stock se já ativo).

### 4.2 Personas

| Persona                 | Necessidade principal                                           |
| ----------------------- | --------------------------------------------------------------- |
| **Owner** (fundador)    | Criar workspace, convidar admins, apagar/exportar se necessário |
| **Admin** (ops/lead)    | Membros, projetos, integrações, webhooks                        |
| **Member** (dev/design) | Ver projetos/boards, trabalhar em cards, personalizar sidebar   |
| **Guest** (cliente)     | Só projetos convidados; sem vazar lista de projetos             |

### 4.3 Épicos e critérios de aceite

#### Épico A — Ciclo de vida e navegação (**MVP**)

| ID  | User story                                                            | Aceite                                                                      |
| --- | --------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| A1  | Como utilizador, quero criar um workspace com nome e slug             | Slug único; slugs reservados bloqueados; redireciona para home do workspace |
| A2  | Como utilizador com vários workspaces, quero alternar no dropdown     | Lista workspaces do user; troca de contexto sem logout                      |
| A3  | Como convidado, quero aceitar convite por email ou página de convites | Token válido → `WorkspaceMember`; convite marcado `accepted`                |
| A4  | Como admin, quero aceder Settings → General                           | Editar nome, timezone, logo; link para delete com confirmação forte         |

**Implementação:** maiormente **Stock** — checklist de QA + copy PT “Espaço de trabalho”.

#### Épico B — Membros e papéis (**MVP**)

| ID  | User story                                                  | Aceite                                                        |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| B1  | Como admin, convido por email com papel Admin/Member/Guest  | Email enviado (SMTP ok); papel aplicado ao aceitar            |
| B2  | Como admin, altero ou removo membros                        | Só Admin+; não posso remover último admin sem promoção prévia |
| B3  | Como membro, posso sair do workspace                        | Perde acesso; bloqueio se último admin                        |
| B4  | Como admin, vejo lista com nome, email, papel, data entrada | Tabela em Settings → Members                                  |

**Gap a fechar:**

- [ ] Regra **último admin/owner** alinhada à doc Plane (API + UI).
- [ ] Documentar papéis em PT na UI (tabela abaixo).

| Papel UI (PT) | Código | Pode                                                 |
| ------------- | ------ | ---------------------------------------------------- |
| Administrador | 20     | Settings, membros, todos os projetos, webhooks       |
| Membro        | 15     | Projetos onde é membro; criar conteúdo               |
| Convidado     | 5      | Só projetos explícitos; sem listar todos os projetos |

**Opcional MVP+:** import CSV membros (se API existir, expor botão Import).

#### Épico C — Descoberta de trabalho (**MVP**)

| ID  | User story                                  | Aceite                                                                    |
| --- | ------------------------------------------- | ------------------------------------------------------------------------- |
| C1  | `Ctrl/Cmd+K` abre pesquisa com abas         | Projetos, itens, módulos, ciclos, páginas respeitam permissões            |
| C2  | Busca por chave `OPS-42` navega para o item | Match por `project.identifier` + sequence                                 |
| C3  | Home mostra widgets configuráveis           | Usar `WorkspaceHomePreference`; pelo menos: My Work, Recents, Quick links |

**Stock** — validar regressões após rebranding Operoz.

#### Épico D — Personalização (**MVP**)

| ID  | User story                            | Aceite                                |
| --- | ------------------------------------- | ------------------------------------- |
| D1  | Customizar sidebar (itens + ordem)    | Persiste em `WorkspaceUserPreference` |
| D2  | Escolher accordion vs tabs no projeto | `navigation_control_preference`       |
| D3  | Limitar N projetos na sidebar         | `navigation_project_limit` + “More”   |

#### Épico E — Admin técnico (**MVP**)

| ID  | User story                     | Aceite                                        |
| --- | ------------------------------ | --------------------------------------------- |
| E1  | Webhooks workspace CRUD        | Já em store; testar entrega e secret rotation |
| E2  | Export dados workspace         | Settings → Export; formato documentado        |
| E3  | SMTP documentado para convites | `Operoz/deployments/…` + troubleshooting      |

#### Épico F — Alinhamento Tech4Humans (**MVP**, específico Operoz)

| ID  | User story                                    | Aceite                                                             |
| --- | --------------------------------------------- | ------------------------------------------------------------------ |
| F1  | Sidebar workspace lista **Boards → Projetos** | Ver [tech4humans-boards-etapas.md](./tech4humans-boards-etapas.md) |
| F2  | Projeto sem board aparece em “Sem board”      | Bucket visível na sidebar                                          |
| F3  | Pesquisa inclui boards (quando existir slug)  | Aba ou filtro “Boards” no search                                   |

---

## 5. Roadmap em ondas

```text
MVP (4–6 semanas foco UX + regras)
├── A Ciclo de vida workspace
├── B Membros / convites / último admin
├── C Search + Home
├── D Navegação personalizada
├── E Webhooks + Export + SMTP doc
└── F Boards na sidebar + search

MVP+ (onda 2)
├── Audit trail membros (Activity panel)
├── Import CSV membros
├── SSO OIDC (self-hosted)
├── Papel Owner explícito + transfer ownership (migração role)
└── Power K: criar board/projeto a partir do palette

Pós-MVP (avaliar negócio)
├── Initiatives / Releases (se CE licenciado)
├── GAC custom roles
├── Billing cloud
└── Paridade total permissions matrix
```

---

## 6. Especificação técnica mínima (MVP)

### 6.1 API (checklist)

| Endpoint / comportamento              | Ficheiros de referência                    |
| ------------------------------------- | ------------------------------------------ |
| `POST /api/workspaces/` criar         | `workspace` views/serializers              |
| `GET /api/workspaces/{slug}/` detalhe |                                            |
| `POST …/invitations/`                 | `WorkspaceMemberInvite`                    |
| `PATCH …/members/{id}/` role          | Validar hierarquia admin                   |
| `DELETE …/members/{id}/`              | Impedir último admin                       |
| Search global                         | endpoint search existente — incluir boards |

### 6.2 Regras de negócio (pseudo)

```python
# Último admin — ao remover ou rebaixar:
if workspace.active_admins().count() <= 1 and target.role == ADMIN:
    raise ValidationError("Promova outro administrador primeiro.")

# Guest — listagem de projetos:
if member.role == GUEST:
    projects = Project.objects.filter(projectmember__member=user)
else:
    projects = workspace.projects.visible_to(member)

# Owner delete workspace — apenas workspace.owner ou Admin com flag explícita:
if action == "delete_workspace" and user != workspace.owner and not is_plane_owner_role(member):
    deny()
```

### 6.3 UI — mapa de ecrãs MVP

| Rota                       | Conteúdo                                         |
| -------------------------- | ------------------------------------------------ |
| `/create-workspace`        | Form nome + slug                                 |
| `/{slug}/`                 | Home (widgets)                                   |
| `/{slug}/settings`         | General, Members, Integrations, Webhooks, Export |
| `/{slug}/settings/members` | Tabela + modal convite                           |
| Dropdown header            | Trocar workspace, convites pendentes, settings   |

### 6.4 Testes mínimos

| Caso                                               | Tipo        |
| -------------------------------------------------- | ----------- |
| Criar workspace → criador é Admin + owner          | contract    |
| Convidar Member → aceitar → aceder projeto público | integration |
| Guest não lista projetos privados                  | permission  |
| Último admin não pode sair                         | unit        |
| Search `KEY-1` resolve issue                       | e2e smoke   |

Ver também [tech4humans-board-roles-smoke-test.md](./tech4humans-board-roles-smoke-test.md).

---

## 7. Glossário PT ↔ Plane ↔ Operoz

| Português (UI Operoz) | Plane (EN)                    | Entidade código          |
| --------------------- | ----------------------------- | ------------------------ |
| Espaço de trabalho    | Workspace                     | `Workspace`              |
| Administrador         | Admin (workspace)             | `role=20`                |
| Membro                | Member                        | `role=15`                |
| Convidado             | Guest                         | `role=5`                 |
| Proprietário          | Owner                         | `Workspace.owner` (user) |
| Time / Board          | Teamspace (CE) / Board (fork) | `Board`                  |
| Projeto               | Project                       | `Project`                |
| Item de trabalho      | Work item                     | `Issue`                  |
| Espaço (Space deploy) | Space app                     | `apps/space`             |

---

## 8. Referências cruzadas Operoz

| Documento                                                                                    | Relação                    |
| -------------------------------------------------------------------------------------------- | -------------------------- |
| [tech4humans-plane-organizacao.md](./tech4humans-plane-organizacao.md)                       | Hierarquia Board × Projeto |
| [jira-vs-plane-comparativo.md](./jira-vs-plane-comparativo.md)                               | Decisões Jira × Plane      |
| [tech4humans-boards-plano-desenvolvimento.md](./tech4humans-boards-plano-desenvolvimento.md) | MVP Boards                 |
| [operoz-mcp.md](./operoz-mcp.md)                                                             | MCP empresa/workspace      |
| [AGENTS.md](../AGENTS.md)                                                                    | Convenções do monorepo     |

---

## 9. Checklist de validação antes de fechar o MVP

- [ ] Novo utilizador cria workspace e vê sidebar com boards (se ativado)
- [ ] Convite por email chega em ambiente Docker com SMTP configurado
- [ ] Guest abre só projeto onde foi adicionado
- [ ] `Ctrl+K` encontra item por título e por chave
- [ ] Admin edita nome/timezone e exporta dados
- [ ] Último admin não consegue sair sem promover outro
- [ ] Documentação deploy atualizada com variáveis SMTP

---

## 10. Resumo executivo

O Plane trata o **workspace** como contentor de **projetos**, **membros**, **permissões em camadas** (workspace → projeto → teamspace), **descoberta** (search, home, your work), **personalização** da navegação e **administração** (integrações, webhooks, import/export, SSO, billing na cloud).

O **Operoz já herda a maior parte** do modelo Plane via fork. O MVP proposto **não replica o Plane Commercial inteiro**; foca em:

1. **Experiência clara** de workspace em português, integrada com **Boards** Tech4Humans.
2. **Governança de membros** fiável (convites, papéis, último admin).
3. **Descoberta** (search + home) e **personalização** já modelada nos JSON de preferências.
4. **Operação self-hosted** (SMTP, export, webhooks).

Use a **secção 2** como backlog completo; use a **secção 4–5** para priorizar sprints.
