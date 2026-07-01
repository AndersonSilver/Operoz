# Operoz — Plano de paridade total com Plane (sem cortes no escopo)

**Decisão de produto (jun/2026):** implementar **tudo** o que o Plane documenta e o fork ainda não cobre ou cobre só em parte. **Nada é retirado da lista** — a ordem abaixo é só **sequência de entrega**, não exclusão.

**Documentos base:**

- [operoz-plane-catalogo-completo-docs.md](./operoz-plane-catalogo-completo-docs.md) — inventário por secção da sidebar
- [operoz-workspace-mvp-plane.md](./operoz-workspace-mvp-plane.md) — detalhe workspace
- Roadmap Tech4Humans: [tech4humans-boards-mvp2-plano.md](./tech4humans-boards-mvp2-plano.md), [tech4humans-board-config-mvp3-plano.md](./tech4humans-board-config-mvp3-plano.md), [tech4humans-roadmap-mv3-mv5.md](./tech4humans-roadmap-mv3-mv5.md)

**Hierarquia Operoz (mantida em paralelo ao Plane):** `Workspace → Board → Projeto (épico) → Card → Subtarefa`. Features Plane tipo Teamspace/Epic tornam-se **implementação compatível + UI alinhada ao Board**, não substituem o modelo.

---

## 1. O que “tudo” significa na prática

| Incluído                                                                       | Notas                                                                         |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Todas as 13 secções da sidebar Plane                                           | Ver catálogo                                                                  |
| Features **Community** e **Commercial (CE)**                                   | CE pode exigir port de código upstream, licença, ou reimplementação           |
| Billing cloud (Stripe)                                                         | Incluído se quiserem oferta SaaS; em self-host pode ser “modo cloud opcional” |
| Plane AI (Pi Chat) + créditos                                                  | Incluído; pode coexistir com [MCP Operoz](./operoz-mcp.md)                    |
| Integrações nativas (GitHub, GitLab, Slack, Sentry, Draw.io)                   | Todas                                                                         |
| Importadores (Jira, Linear, Asana, ClickUp, Notion, Confluence, CSV, Flatfile) | Todos                                                                         |
| GAC (papéis custom + permission schemes) + Plane Runner                        | Incluído                                                                      |
| Initiatives, Releases, Customers, Dashboards avançados                         | Incluído                                                                      |
| MV3–MV6 Tech4Humans (Status Report, PRD, RBAC, Kortex)                         | **Em paralelo** — não são “extras”, fazem parte do produto Operoz             |

**Estimativa de calendário (equipa ~4 dev full-stack + 1 QA):** 18–30 meses para paridade funcional documentada, assumindo reutilização máxima do código Plane CE/upstream e entregas em ondas fechadas.

---

## 2. Metodologia (como não morrer no meio)

### 2.1 Regras de execução

1. **Fatia vertical** — cada item fecha com API + UI + permissões + teste smoke (não “só backend”).
2. **Uma onda fechada antes da seguinte** — regressão na onda anterior a cada merge.
3. **Matriz de rastreio** — cada linha deste doc → ticket (Jira/Linear) com ID `OP-PARITY-###`.
4. **Auditoria inicial (Fase 0)** — antes de codar CE, confirmar se já existe stub no `apps/web` / `plane-web` / `apps/api`.
5. **Upstream** — para cada feature CE, registar: _port do Plane commercial_ vs _reimplementar_ vs _já no fork_.

### 2.2 O que NÃO é “tirar do escopo”

- **Teamspace Plane** → entregar **hub Board equivalente** + opcionalmente alias/UI “Teamspace” para quem migra do Plane.
- **Epic como tipo de item** → manter tipo Epic no projeto **e** Projeto = épico de negócio (dois conceitos, documentados).
- **Billing** → módulo separado `apps/billing` ou settings cloud; self-host pode desligar por flag.

---

## 3. Mapa de fases (ordem sugerida — escopo 100%)

```text
F0  Fundação (auditoria + estabilidade)
F1  Workspace + RBAC base + search/home
F2  Boards Tech4Humans (hub completo) + projetos
F3  Itens de trabalho (tipos, épicos, relações, URL, recorrentes)
F4  Planejamento (ciclos CE+, módulos, milestones, dependências timeline)
F5  Vistas (PQL, layouts, workspace views, Your Work)
F6  Conhecimento (wiki collections, templates, inline comments, draw.io)
F7  Gestão avançada (workflows, automações custom, runner, time, bulk polish)
F8  Comunicação (notificações push, project updates, inbox polish)
F9  Intake + Customers (forms, email, responsible, CRM customers)
F10 Analytics + Dashboards (widgets, PQL dashboard, export)
F11 Integrações (GitHub, GitLab, Slack, Sentry, OAuth apps)
F12 Import / Export (todos os importadores + flatfile + export completo)
F13 IA (Plane AI / Pi + créditos + MCP alinhado)
F14 CE estratégico (Initiatives, Releases, Teamspace parity layer)
F15 GAC + RBAC enterprise (permission schemes, custom roles) + MV5 Operoz
F16 Billing + SSO + IdP sync (cloud + self-host)
F17 Tech4Humans fecho (MV3 Status Report, MV4 PRD, MV6 Kortex)
F18 Hardening (perf, i18n PT, a11y, docs utilizador, paridade visual)
```

Cada fase tem checklist abaixo. **Todas as linhas do catálogo aparecem em alguma fase.**

---

## 4. Fase 0 — Fundação (4–6 semanas)

| ID   | Entregável                                                                                             | Critério de feito         | Status jun/2026                         |
| ---- | ------------------------------------------------------------------------------------------------------ | ------------------------- | --------------------------------------- |
| F0-1 | [operoz-gap-tracker.md](./operoz-gap-tracker.md) (~121 linhas)                                         | Estado código / Fase      | ✅ criado                               |
| F0-2 | [operoz-f0-smoke-checklist.md](./operoz-f0-smoke-checklist.md) + [resultado](./operoz-f0-resultado.md) | Smoke manual A–D          | 🟡 API OK; UI pendente                  |
| F0-3 | Rotas board `/views`, tabs                                                                             | Paridade MVP-2            | 🟡 rotas **existem** — validar smoke B9 |
| F0-4 | [operoz-f0-ce-stubs-inventory.md](./operoz-f0-ce-stubs-inventory.md)                                   | 87 stubs em `apps/web/ce` | ✅                                      |
| F0-5 | [operoz-f0-merge-upstream.md](./operoz-f0-merge-upstream.md)                                           | Política merge            | ✅                                      |

---

## 5. Fase 1 — Gestão do espaço de trabalho (6–8 semanas)

**Referência:** [operoz-workspace-mvp-plane.md](./operoz-workspace-mvp-plane.md)

| ID    | Feature Plane                             | Ação                                   |
| ----- | ----------------------------------------- | -------------------------------------- |
| F1-1  | Criar / alternar / apagar workspace       | Validar + PT                           |
| F1-2  | Convites email + pendentes                | SMTP doc + testes                      |
| F1-3  | Import CSV membros                        | UI + API                               |
| F1-4  | Activity audit membros                    | Painel Activity                        |
| F1-5  | Owner role explícito + transfer ownership | Migração `WorkspaceMember`             |
| F1-6  | Último admin / owner protection           | API + UI                               |
| F1-7  | Search workspace (todas as abas)          | + aba Boards                           |
| F1-8  | Power K completo                          | Criar board, workspace, todos os tipos |
| F1-9  | Home widgets (todos)                      | `WorkspaceHomePreference`              |
| F1-10 | Customize navigation                      | Accordion/tabs/limit projetos          |
| F1-11 | Commenter role (projeto)                  | Alinhar doc Plane 2025+                |
| F1-12 | Guest ceiling                             | Testes permissão                       |

---

## 6. Fase 2 — Boards + Gerenciamento de projetos (8–12 semanas)

| ID    | Feature                                                     | Ação                                                                         |
| ----- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| F2-1  | Board sidebar hierárquica                                   | [tech4humans-boards-etapas.md](./tech4humans-boards-etapas.md)               |
| F2-2  | Hub: Resumo, Backlog, Lista, Quadro, Calendário, Cronograma | [tech4humans-boards-mvp2-plano.md](./tech4humans-boards-mvp2-plano.md) M2-\* |
| F2-3  | Board meta KPIs                                             | M2-10                                                                        |
| F2-4  | Filtros cross-project no board                              | M2-2, M2-3                                                                   |
| F2-5  | Board config BC-0…BC-9                                      | [board-config-mvp3-plano](./tech4humans-board-config-mvp3-plano.md)          |
| F2-6  | Projeto: CRUD, estados, labels, overview                    | Validar stock                                                                |
| F2-7  | Publicar projeto / Space                                    | Validar                                                                      |
| F2-8  | Modelos de projeto                                          | Templates create                                                             |
| F2-9  | Membros projeto + Commenter                                 | UI + matrix                                                                  |
| F2-10 | Bucket «Sem board»                                          | Sidebar                                                                      |

---

## 7. Fase 3 — Gestão de itens de trabalho (8–10 semanas)

| ID    | Feature                                            | Ação                           |
| ----- | -------------------------------------------------- | ------------------------------ |
| F3-1  | Work item detail (peek/modal/full)                 | Polish                         |
| F3-2  | Tipos por workspace + projeto + **board**          | M2-16 + `BoardIssueType`       |
| F3-3  | Hierarquia Epic type + sub-itens                   | Work item types enabled        |
| F3-4  | Work item updates (On track / At risk / Off track) | Todos os tipos                 |
| F3-5  | Criar via URL                                      | Deep links                     |
| F3-6  | Drafts workspace                                   | Validar                        |
| F3-7  | Templates de item                                  | CRUD templates                 |
| F3-8  | Itens recorrentes                                  | CE port                        |
| F3-9  | Relações custom                                    | Bloqueia, duplica, relacionado |
| F3-10 | Quick-add inline list/board                        | Validar                        |
| F3-11 | Arquivo + automação arquivo                        | Projeto settings               |

---

## 8. Fase 4 — Planejamento e organização (8–10 semanas)

| ID   | Feature                           | Ação                                             |
| ---- | --------------------------------- | ------------------------------------------------ |
| F4-1 | Ciclos + auto-schedule + rollover | Settings features                                |
| F4-2 | Ciclos ativos workspace sidebar   | Overview                                         |
| F4-3 | Módulos list/gallery/timeline     | Validar layouts                                  |
| F4-4 | Milestones em itens               | Property + PQL                                   |
| F4-5 | Dependências timeline (Gantt)     | Timeline layout                                  |
| F4-6 | Stickies                          | Validar + home                                   |
| F4-7 | **Initiatives** (CE)              | Port `initiatives` plane-web + API               |
| F4-8 | **Releases** (CE)                 | Port completo                                    |
| F4-9 | **Teamspace layer**               | Hub board + opcional módulo Teamspace API compat |

---

## 9. Fase 5 — Vistas e layouts (6–8 semanas)

| ID   | Feature                                            | Ação              |
| ---- | -------------------------------------------------- | ----------------- |
| F5-1 | 5 layouts (list, board, calendar, table, timeline) | Paridade          |
| F5-2 | **PQL** editor + save view                         | `plane-web` query |
| F5-3 | Rich filters + display options                     | `rich_filters`    |
| F5-4 | Views projeto + workspace                          | Publicar/export   |
| F5-5 | Your Work                                          | Cross-project     |
| F5-6 | Board views agregadas                              | Fechar M2 rotas   |

---

## 10. Fase 6 — Gestão do conhecimento (6–8 semanas)

| ID   | Feature                         | Ação                                   |
| ---- | ------------------------------- | -------------------------------------- |
| F6-1 | Páginas projeto + editor blocks | `@operoz/editor`                       |
| F6-2 | **Wiki** workspace              | Collections, shared, private, archived |
| F6-3 | Páginas aninhadas               | Tree                                   |
| F6-4 | Page templates                  | CRUD                                   |
| F6-5 | Report page                     | Tipo página                            |
| F6-6 | **Draw.io** embed               | Integração                             |
| F6-7 | Comentários inline em páginas   | Thread                                 |

---

## 11. Fase 7 — Gestão avançada (10–14 semanas)

| ID   | Feature                         | Ação                                                                 |
| ---- | ------------------------------- | -------------------------------------------------------------------- |
| F7-1 | Estimates por projeto           | Validar                                                              |
| F7-2 | Bulk ops (todos os campos)      | List + table                                                         |
| F7-3 | Time tracking + worklogs export | Settings worklogs                                                    |
| F7-4 | **Workflows + approvals**       | `plane-web/components/workflow` completar                            |
| F7-5 | Pre/post validation scripts     | Workflow                                                             |
| F7-6 | **Automations default**         | Auto-archive, stale, due reminders                                   |
| F7-7 | **Automations custom**          | [operoz-automacao-mvp-spec](./operoz-automacao-mvp-spec.md) estender |
| F7-8 | **Plane Runner**                | Sandbox JS/TS + limites doc                                          |
| F7-9 | Custom relations (tipos)        | Admin UI                                                             |

---

## 12. Fase 8 — Comunicação (4–6 semanas)

| ID   | Feature                          | Ação                      |
| ---- | -------------------------------- | ------------------------- |
| F8-1 | Comentários + menções + reações  | Validar                   |
| F8-2 | Subscribers                      | Validar                   |
| F8-3 | Notificações inbox               | Validar                   |
| F8-4 | Email batch 5 min + preferências | Validar                   |
| F8-5 | **Push mobile**                  | Se apps mobile no roadmap |
| F8-6 | Project updates / status reports | MV3 + stock               |
| F8-7 | Flags `issue_notify_*` workspace | God mode + settings       |

---

## 13. Fase 9 — Admissão e clientes (6–8 semanas)

| ID   | Feature                            | Ação                    |
| ---- | ---------------------------------- | ----------------------- |
| F9-1 | Intake in-app (triage)             | Validar                 |
| F9-2 | Intake forms públicos + WIT custom | Forms builder           |
| F9-3 | Intake email                       | Inbound parse           |
| F9-4 | Intake responsible auto-assign     | Settings                |
| F9-5 | Estados Triage → projeto           | Mapeamento estados      |
| F9-6 | **Customers** (CE)                 | Entidade + ligar issues |

---

## 14. Fase 10 — Análises e relatórios (8–10 semanas)

| ID    | Feature                     | Ação                        |
| ----- | --------------------------- | --------------------------- |
| F10-1 | Analytics workspace (tabs)  | Validar + export            |
| F10-2 | **Dashboards** custom       | `dashboard.store` completar |
| F10-3 | Widgets (7 tipos × modelos) | UI builder                  |
| F10-4 | Dashboard PQL filters       | Intersecção filtros         |
| F10-5 | Board analytics / meta      | M2-10 + dashboards          |

---

## 15. Fase 11 — Integrações (10–12 semanas)

| ID    | Feature                                   | Ação                 |
| ----- | ----------------------------------------- | -------------------- |
| F11-1 | GitHub sync issues + PR mapping           | Settings integrações |
| F11-2 | GitHub Enterprise                         | Variante auth        |
| F11-3 | GitLab MR + issues                        | Idem                 |
| F11-4 | Slack install + criar item + notificações | Workspace settings   |
| F11-5 | Slack Plane AI                            | Com F13              |
| F11-6 | Sentry → work items                       | Integração           |
| F11-7 | Webhooks workspace                        | Validar              |
| F11-8 | Build Plane app (OAuth)                   | Developer            |

---

## 16. Fase 12 — Importação e exportação (8–10 semanas)

| ID     | Feature                         | Ação                   |
| ------ | ------------------------------- | ---------------------- |
| F12-1  | Export CSV/Excel/JSON workspace | Validar                |
| F12-2  | CSV importer simples            | Validar                |
| F12-3  | **Flatfile** interactive mapper | CE port ou alternativa |
| F12-4  | Import Jira                     | CE                     |
| F12-5  | Import Linear                   | CE                     |
| F12-6  | Import Asana                    | CE                     |
| F12-7  | Import ClickUp                  | CE                     |
| F12-8  | Import Notion                   | CE                     |
| F12-9  | Import Confluence               | CE                     |
| F12-10 | Import membros CSV              | F1-3                   |

---

## 17. Fase 13 — IA (8–12 semanas)

| ID    | Feature                                   | Ação                                                  |
| ----- | ----------------------------------------- | ----------------------------------------------------- |
| F13-1 | **Plane AI / Pi Chat** (Ask + Build mode) | CE / API LLM                                          |
| F13-2 | AI credits + billing linkage              | Com F16                                               |
| F13-3 | Slack @Plane                              | Com F11-5                                             |
| F13-4 | **Operoz MCP** paridade ferramentas       | [operoz-mcp.md](./operoz-mcp.md) — todas as entidades |
| F13-5 | NL → SQL / queries internas               | Pi feature                                            |

---

## 18. Fase 14 — CE estratégico (paridade nomeada Plane) (6–8 semanas)

| ID    | Feature                                   | Ação                  |
| ----- | ----------------------------------------- | --------------------- |
| F14-1 | Initiatives overview/scope/board/timeline | Completar UI          |
| F14-2 | Releases changelog + tags                 | Completar             |
| F14-3 | Teamspace ↔ Board bridge                  | Doc + migração dados  |
| F14-4 | Sidebar Initiatives/Releases/Customers    | `theme.store` + rotas |

_(Overlap intencional com F4/F9/F10 — esta fase é “polish CE” e testes E2E.)_

---

## 19. Fase 15 — GAC + RBAC custom (10–14 semanas)

| ID    | Feature                             | Ação                                                             |
| ----- | ----------------------------------- | ---------------------------------------------------------------- |
| F15-1 | Permission schemes CRUD             | Enterprise                                                       |
| F15-2 | Custom roles compose schemes        | Enterprise                                                       |
| F15-3 | Matriz permissões UI admin          | Gerar da matrix doc                                              |
| F15-4 | Cache invalidação 5min/24h          | Como Plane                                                       |
| F15-5 | Audit trail permissões              | “Coming soon” Plane → implementar                                |
| F15-6 | **MV5 Operoz** papéis board/projeto | [roadmap MV5](./tech4humans-roadmap-mv3-mv5.md) integrado em GAC |

---

## 20. Fase 16 — Billing + SSO (8–10 semanas)

| ID    | Feature                          | Ação               |
| ----- | -------------------------------- | ------------------ |
| F16-1 | Stripe portal + planos + lugares | Cloud              |
| F16-2 | Guest não conta lugar            | Billing rules      |
| F16-3 | Licença self-hosted CE/EE        | Sync plan          |
| F16-4 | **SSO OIDC**                     | Workspace Identity |
| F16-5 | **SSO SAML 2.0**                 | Idem               |
| F16-6 | Domain management                | Verified domains   |
| F16-7 | IdP Group Sync                   | CE                 |

---

## 21. Fase 17 — Tech4Humans (produto Operoz) (8–12 semanas)

| ID    | Feature                     | Ação                                                    |
| ----- | --------------------------- | ------------------------------------------------------- |
| F17-1 | **MV3** Status Report board | [roadmap](./tech4humans-roadmap-mv3-mv5.md)             |
| F17-2 | **MV4** PRD                 | Entidade + editor                                       |
| F17-3 | **MV6** Rebranding Kortex   | [rebranding](./tech4humans-rebranding-remocao-plane.md) |
| F17-4 | Comparativo Jira atualizado | [jira-vs-plane](./jira-vs-plane-comparativo.md)         |

---

## 22. Fase 18 — Hardening (contínuo, 4–6 semanas finais)

| ID    | Entregável                                                                                |
| ----- | ----------------------------------------------------------------------------------------- |
| F18-1 | i18n PT completo (todas as strings)                                                       |
| F18-2 | Testes E2E por secção sidebar                                                             |
| F18-3 | Documentação utilizador Operoz (help center)                                              |
| F18-4 | Performance (search, board agregado, dashboards)                                          |
| F18-5 | Checklist paridade vs [catálogo](./operoz-plane-catalogo-completo-docs.md) §16 — 13/13 ✅ |

---

## 23. Rastreio: catálogo → fase (tabela rápida)

| Secção catálogo     | Fases principais |
| ------------------- | ---------------- |
| 1 Gestão workspace  | F0, F1, F16      |
| 2 Projetos          | F2               |
| 3 Itens de trabalho | F3               |
| 4 Planejamento      | F4, F14          |
| 5 Vistas            | F5, F2           |
| 6 Conhecimento      | F6               |
| 7 Gestão avançada   | F7               |
| 8 Comunicação       | F8, F17          |
| 9 Intake + clientes | F9               |
| 10 Analytics        | F10              |
| 11 Integrações      | F11              |
| 12 Import/Export    | F12              |
| 13 IA               | F13              |
| GAC / Enterprise    | F15              |
| Boards Operoz       | F2, F17          |
| Billing             | F16              |

---

## 24. Equipa e paralelização

Com **paridade total**, recomenda-se **2 tracks** em paralelo após F1:

| Track A (Produto Operoz) | Track B (Paridade Plane)          |
| ------------------------ | --------------------------------- |
| Boards + config + MV3/4  | Wiki, PQL, workflows              |
| Status Report, PRD       | Integrações GitHub/Slack          |
| Tipos de card board      | Importadores                      |
|                          | Initiatives, Releases, Dashboards |

Sincronizar em **merge semanal** na `main` com smoke F0-2.

---

## 25. Próximo passo imediato (esta semana)

1. **Aprovar** este plano como backlog master (`OP-PARITY-*`).
2. **Executar F0** — auditoria: para cada linha 🟡 do catálogo, marcar `existe API / existe UI / stub / ausente`.
3. **Não pular F2** — Boards é o coração Operoz; paridade Plane sem board hub deixa o produto incoerente.
4. Criar milestone no Git por fase (F0…F18).

Se quiseres, no próximo passo gero o ficheiro **`operoz-gap-tracker.md`** com as ~120 linhas do catálogo, colunas **Fase | Estado código | Ticket | Responsável** — pronto para copiar para o Jira.

---

## 26. Aviso honesto (sem mudar o escopo)

- **Escopo:** 100% do que pediste — nada retirado.
- **Calendário:** é um programa **multi-ano** sem equipa grande; a ordem das fases evita bloqueios, não reduz trabalho.
- **Legal:** features CE do Plane podem exigir licença AGPL/commercial upstream — validar com jurídico antes de portar código fechado.
- **Duplicação consciente:** Teamspace + Board coexistem na paridade; a doc Operoz explica qual usar.

**Resumo:** faz **F0 → F1 → F2** primeiro, depois avança a fases em paralelo (Track A + B) até F18 fechar o checklist §16 do catálogo com tudo ✅.
