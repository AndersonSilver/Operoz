# Jira vs Plane (Tech4Humans) — Comparativo de funcionalidades

Documento de decisão: o que o **Jira Cloud** oferece, o que o **vosso fork Plane** já cobre, o que está **parcial** ou **planeado**, e o que **não existe** (ou não faz sentido copiar).

**Como usar:** marque na coluna «Decisão» (`Implementar` / `Ignorar` / `Avaliar depois`) conforme a prioridade da equipa.

**Última atualização:** maio/2026  
**Base:** Jira Software / Jira Cloud (referência geral) + código e docs do fork em `plane/docs/tech4humans-*`.

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Disponível no projeto (Plane stock ou fork já entregue) |
| 🟡 | Parcial, limitado, ou só em parte da hierarquia (ex.: só por projeto, não no board) |
| 🔜 | Planeado no fork (MVP-2 boards / docs internas) |
| ❌ | Não disponível (ou fora de escopo explícito) |
| — | N/A ou conceito diferente |

**Âmbito:**

- **Plane stock** = produto open-source base.
- **Fork Tech4Humans** = camada `Board` (time) + hierarquia Workspace → Board → Projeto → Card.
- **Jira** = Atlassian Jira Software; itens de **Jira Service Management**, **Advanced Roadmaps**, **Confluence** e marketplace aparecem quando são capacidades distintas.

---

## 1. Hierarquia e organização

| Funcionalidade Jira | No Jira | No vosso projeto | Notas |
|---------------------|---------|------------------|-------|
| Organização / Site (multi-tenant Atlassian) | ✅ | 🟡 | Plane: **Instance** self-hosted; um site Jira ≈ uma instância |
| **Espaço** (Space) | ✅ | ✅ | **Workspace** |
| **Board de time** (agrega N projetos; ex. Squad as a Service) | ✅ | 🟡 | Fork: entidade **`Board`** + sidebar; hub de vistas **incompleto** (ver §2) |
| **Projeto** Jira | ✅ | ✅ | **Project**; no fork = **épico de negócio** (cliente/iniciativa) |
| **Épico** como nível acima de Story | ✅ | 🟡 | Jira: Epic → Story → Sub-task. Fork: **épico = Projeto**; dentro do projeto use **Módulos** |
| Story / Task / Bug (tipos) | ✅ | 🟡 | Plane: **Issue types** por projeto (configurável); não hierarquia Epic→Story nativa igual Jira |
| Subtarefa | ✅ | ✅ | `Issue` com `parent` (vários níveis) |
| Componentes | ✅ | ❌ | Sem equivalente direto; usar labels/módulos |
| Versões / Releases | ✅ | ❌ | Sem «fix version» / release train nativo |
| Team / Team-managed vs Company-managed | ✅ | 🟡 | Plane: membros workspace + projeto; sem esquema Jira «team-managed» |
| Pastas / categorias de projetos | ✅ | 🟡 | Fork: agrupar por **Board**; stock: só convenção de nome |
| Projeto sem board | — | ✅ | Bucket **«Sem board»** no fork |
| Arquivar projeto / issue | ✅ | ✅ | Arquivos por projeto; boards arquiváveis nas settings |

**Decisão produto (fork):** Board = time; Projeto = épico/cliente; Card = issue. Não modelar «épico Jira» como entidade separada do projeto.

---

## 2. Vistas do board de time (hub Jira)

Referência: captura Jira «Squad as a Service» — abas no **board**, não no projeto.

| Vista / aba Jira | No Jira | No vosso projeto | Notas |
|------------------|---------|------------------|-------|
| **Resumo** (dashboard do board) | ✅ | 🟡 | Rota `/boards/{slug}` — overview básico; **Resumo rico** = 🔜 M2-9 |
| **Cronograma** (timeline multi-projeto) | ✅ | ❌ / 🔜 | 🔜 M2-6, M2-7; Plane tem Gantt **por projeto**, não agregado no board |
| **Backlog** (cross-project) | ✅ | 🟡 | Rota + store + API agregada **existem**; polish/filtros 🔜 M2-3 |
| **Quadro** (Kanban multi-projeto) | ✅ | 🟡 | Componente `BoardViewsLayoutRoot` existe; **rota `/views` não registada** em `core.ts`; tab no header em falta |
| **Lista** (cross-project) | ✅ | 🟡 | Rota `/list` + tab no header ✅ |
| **Calendário** (cross-project) | ✅ | ❌ / 🔜 | 🔜 M2-8; calendário existe **por projeto** |
| Deployments / Code / Versions / Development | ✅ | ❌ | Fora de escopo explícito (§17.6 plano boards) |
| Filtro **Projeto** no topo | ✅ | 🟡 | `BoardLevelWorkItemFiltersHOC` — 🔜 completar M2-2 |
| Filtros Tipo / Categoria / Status / custom | ✅ | 🟡 | **Rich filters** no workspace/projeto; board scope 🔜 |
| Pesquisa textual no board | ✅ | 🟡 | API suporta `search`; UX board 🔜 |
| Badge de projeto em cada card agregado | ✅ | 🔜 | Decisão M2-0 |
| Escala timeline (Semanas / Meses / Trimestres) | ✅ | 🔜 | M2-7 |
| Linha «hoje» no cronograma | ✅ | 🔜 | Reutilizar lógica Gantt/calendário |
| `GET …/boards/{slug}/meta/` (KPIs) | — | 🔜 | M2-10 |
| `GET …/boards/{slug}/modules/` (épicos na timeline) | — | 🔜 | M2-11 |

---

## 3. Vistas e planeamento por projeto

| Funcionalidade Jira | No Jira | No vosso projeto | Notas |
|---------------------|---------|------------------|-------|
| Lista de issues | ✅ | ✅ | Layout `list` |
| Quadro Kanban | ✅ | ✅ | Layout `kanban`; swimlanes, colapsar grupos |
| Calendário | ✅ | ✅ | Layout `calendar` |
| Timeline / Gantt | ✅ | ✅ | Layout `gantt_chart` |
| Planilha / tabela densa | ✅ | ✅ | Layout `spreadsheet` |
| **Roadmap** (nível projeto/portfolio Jira) | ✅ | 🟡 | Módulos + Gantt ≈ roadmap leve; sem Advanced Roadmaps |
| **Plans** (Advanced Roadmaps) | ✅ | ❌ | Dependências cross-project, capacity, cenários — não no Plane |
| Backlog do projeto | ✅ | ✅ | Vista backlog + priorização |
| Sprint / Scrum board | ✅ | 🟡 | Plane: **Ciclos** (sprints), não nome «Scrum» |
| Kanban contínuo | ✅ | ✅ | Ciclos opcionais |
| Rank / prioridade drag no backlog | ✅ | 🟡 | Ordenação manual em várias vistas; paridade fina com Jira pode variar |
| Quick filters (só meus, etc.) | ✅ | ✅ | Filtros + vistas guardadas |
| Vistas guardadas (filtros + layout) | ✅ | ✅ | **Views** por projeto + **Workspace views** globais |
| Filtros JQL | ✅ | ❌ | Plane: **rich filters** (UI), sem linguagem JQL |
| Filtros partilhados / favoritos | ✅ | ✅ | Views + favoritos na sidebar |

---

## 4. Issues (itens de trabalho)

| Funcionalidade Jira | No Jira | No vosso projeto | Notas |
|---------------------|---------|------------------|-------|
| Chave legível (OPS-18) | ✅ | ✅ | `{project_identifier}-{sequence}` |
| Estados / workflow | ✅ | ✅ | **States** por projeto; grupos (backlog, started, done…) |
| Transições com condições / validadores | ✅ | 🟡 | Mudança de estado; sem workflow designer Jira completo |
| Campos padrão (resumo, descrição, assignee, datas, prioridade) | ✅ | ✅ | |
| **Campos personalizados** (texto, select, cascata, etc.) | ✅ | 🟡 | Plane: propriedades / tipos limitados vs Jira Field Configuration |
| **Issue linking** (blocks, relates, duplicates) | ✅ | ✅ | `IssueRelation`, blockers |
| Anexos | ✅ | ✅ | |
| Comentários + menções | ✅ | ✅ | |
| Reações em comentários | ✅ | ✅ | |
| Histórico / audit log | ✅ | ✅ | `IssueActivity`, versões de descrição |
| Watchers / subscribers | ✅ | ✅ | |
| Votos | ✅ | ✅ | `IssueVote` |
| Labels | ✅ | ✅ | |
| Estimativa (story points / tempo) | ✅ | ✅ | **Estimates** por projeto |
| Time tracking (worklog) | ✅ | ❌ | Sem worklog / timesheet nativo |
| Original estimate / remaining | ✅ | 🟡 | Estimate points; não worklog |
| **Checklists** nativos no issue | ✅ | 🟡 | Listas na descrição/editor; sem objeto Checklist Jira |
| **Forms** (criar issue via formulário) | ✅ | ❌ | Fora de escopo boards; Intake ≈ triagem, não forms Jira |
| Templates de issue | ✅ | 🟡 | Draft issues; templates limitados |
| Clonar issue | ✅ | 🟡 | Duplicar via UI/API conforme versão |
| Bulk edit / bulk move | ✅ | 🟡 | Operações em lote — verificar cobertura na vossa versão |
| Mover issue entre projetos | ✅ | 🟡 | Possível com cuidado (identificador muda de projeto) |
| Arquivar issues antigas | ✅ | ✅ | Automação `archive_and_close_old_issues` |
| Tipos de issue configuráveis | ✅ | ✅ | `IssueType` |
| Epics na issue (campo epic link) | ✅ | 🟡 | Usar **parent** ou **módulo**; epic de negócio = projeto no fork |

---

## 5. Agile, ciclos e módulos

| Funcionalidade Jira | No Jira | No vosso projeto | Notas |
|---------------------|---------|------------------|-------|
| Sprints | ✅ | ✅ | **Cycles** |
| Sprint planning / commitment | ✅ | 🟡 | Ciclo + issues; UX diferente do Jira |
| Burndown / burnup | ✅ | 🟡 | Analytics; profundidade varia por plano Plane |
| Velocity | ✅ | 🟡 | |
| Active sprints (cross-project) | ✅ | ✅ | Rota `active-cycles` |
| Épicos (agrupamento) | ✅ | ✅ | **Modules** (com timeline própria) |
| Incrémentos / PI planning | ✅ | ❌ | |
| Story points por equipa | ✅ | ✅ | Via estimates |

---

## 6. Intake, triagem e Service Management

| Funcionalidade Jira | No Jira | No vosso projeto | Notas |
|---------------------|---------|------------------|-------|
| **Intake** / triagem antes do backlog | 🟡 | ✅ | Feature **Intake** por projeto |
| **Jira Service Management** (portal, SLA, filas) | ✅ | ❌ | Produto separado Atlassian |
| SLAs e escalonamento | ✅ | ❌ | |
| Catálogo de serviços | ✅ | ❌ | |
| Customer portal | ✅ | 🟡 | Plane **Publish** / space público — não ITSM completo |
| Request types | ✅ | ❌ | |

---

## 7. Automação e regras

| Funcionalidade Jira | No Jira | No vosso projeto | Notas |
|---------------------|---------|------------------|-------|
| **Automation** (if/then, multi-step) | ✅ | ❌ | Jira Automation é extenso |
| Regras em transição de workflow | ✅ | 🟡 | Estados sim; post-functions Jira não |
| Auto-arquivar issues antigas | ✅ | ✅ | `issue_automation_task` |
| Webhooks outbound | ✅ | ✅ | Workspace webhooks |
| **Incoming webhooks** / triggers externos | ✅ | 🟡 | API + webhooks; não rule builder |
| Scheduled rules | ✅ | 🟡 | Celery tasks pontuais |
| Integração com Slack (notificações) | ✅ | 🟡 | `SlackProjectSync` no backend |
| Smart commits (Jira + Git) | ✅ | ❌ | |

---

## 8. DevOps e desenvolvimento

| Funcionalidade Jira | No Jira | No vosso projeto | Notas |
|---------------------|---------|------------------|-------|
| Integração **GitHub** (PR, branches, commits) | ✅ | ✅ | Sync issues/comments |
| **GitLab** / **Gitea** | ✅ | 🟡 | Config no instance (`IS_GITLAB_ENABLED`, etc.) |
| Development panel (branches, builds) | ✅ | 🟡 | GitHub sync; sem painel idêntico ao Jira |
| Deployments (aba no board) | ✅ | ❌ | `DeployBoard` existe no modelo — verificar UI |
| Bitbucket | ✅ | ❌ | |
| Builds / CI (Bamboo, etc.) | ✅ | ❌ | |
| **Code** tab no board | ✅ | ❌ | Fora de escopo inicial |

---

## 9. Documentação e conhecimento

| Funcionalidade Jira | No Jira | No vosso projeto | Notas |
|---------------------|---------|------------------|-------|
| Descrição rich text | ✅ | ✅ | Editor Plane |
| **Confluence** ligado | ✅ | ❌ | Plane: **Pages** por projeto (wiki leve) |
| Páginas / notas no projeto | ✅ | ✅ | **Pages** |
| Stickies / notas rápidas | — | ✅ | **Stickies** no workspace |
| Comentários em Confluence desde issue | ✅ | ❌ | |

---

## 10. Relatórios, analytics e dashboards

| Funcionalidade Jira | No Jira | No vosso projeto | Notas |
|---------------------|---------|------------------|-------|
| Dashboards gadgets | ✅ | 🟡 | **Analytics** workspace/projeto |
| Filtro analytics por board (fork) | — | ✅ | Entregue no MVP-1 (D8) |
| Relatórios prontos (velocity, etc.) | ✅ | 🟡 | |
| **eazyBI** / BI externo | ✅ | 🟡 | Export CSV/Excel/JSON + API |
| JQL para relatórios | ✅ | ❌ | |
| Resumo executivo do board | ✅ | 🔜 | M2-9 |

---

## 11. Permissões e administração

| Funcionalidade Jira | No Jira | No vosso projeto | Notas |
|---------------------|---------|------------------|-------|
| Roles (Admin, Member, Guest) | ✅ | ✅ | Workspace + projeto |
| Esquemas de permissão por projeto | ✅ | 🟡 | Menos granular que Permission Scheme Jira |
| Restrição por issue (security level) | ✅ | 🟡 | Projetos públicos/privados; guest |
| **BoardMember** (permissão ao board) | ✅ | ❌ / 🔜 | Pós-MVP; hoje herda via projetos |
| SSO / SAML (Cloud) | ✅ | 🟡 | Self-host: OAuth, magic link, etc. (config instance) |
| 2FA | ✅ | 🟡 | Depende deploy/auth |
| Audit log organização | ✅ | 🟡 | API activity log |
| GDPR / data residency | ✅ | 🟡 | Self-host = controlo vosso |
| API tokens | ✅ | ✅ | |
| Rate limits | ✅ | 🟡 | |

---

## 12. Importação, exportação e migração

| Funcionalidade Jira | No Jira | No vosso projeto | Notas |
|---------------------|---------|------------------|-------|
| Importar de **Jira** | — | ✅ | Importer Jira (issues + épicos) |
| Importar **GitHub** | — | ✅ | |
| Mapear Jira board → Plane board | — | 🔜 | Pós-MVP (doc boards) |
| Export CSV / Excel / JSON | — | ✅ | |
| Backup completo workspace | — | 🟡 | Export + BD self-host |
| Jira Cloud Migration Assistant | ✅ | — | N/A (são vocês o destino) |

---

## 13. Marketplace, extensões e ecossistema

| Funcionalidade Jira | No Jira | No vosso projeto | Notas |
|---------------------|---------|------------------|-------|
| **Atlassian Marketplace** (milhares de apps) | ✅ | ❌ | |
| ScriptRunner / automação avançada | ✅ | ❌ | |
| Tempo / timesheet apps | ✅ | ❌ | |
| Portfolio / Structure / BigPicture | ✅ | ❌ | |
| Plane API para integrações custom | — | ✅ | REST API + webhooks |
| Feature flags pagas Plane Cloud | — | 🟡 | Fork self-host ignora billing Cloud |

---

## 14. UX, colaboração e notificações

| Funcionalidade Jira | No Jira | No vosso projeto | Notas |
|---------------------|---------|------------------|-------|
| Notificações email / in-app | ✅ | ✅ | |
| Preferências de notificação | ✅ | ✅ | |
| @menções | ✅ | ✅ | |
| Command palette / atalhos | ✅ | 🟡 | Power K; board-specific 🔜 M2-10 |
| Mobile app nativa | ✅ | 🟡 | Plane tem apps; verificar fork |
| Tema claro/escuro | ✅ | ✅ | |
| i18n PT | ✅ | ✅ | `pt-BR` |
| Favoritos na sidebar | ✅ | ✅ | |
| DnD reordenar boards/projetos | ✅ | 🔜 | M2-10 |

---

## 15. Publicação e partilha externa

| Funcionalidade Jira | No Jira | No vosso projeto | Notas |
|---------------------|---------|------------------|-------|
| Projeto público / link | ✅ | ✅ | `ProjectNetwork` |
| **Publish** (páginas públicas) | 🟡 | ✅ | App **Space** |
| Formulário público de pedido | ✅ | 🟡 | Intake/publish limitado |

---

## 16. Resumo executivo — gaps prioritários (se o alvo for «parecer Jira no board»)

Funcionalidades Jira que **ainda faltam** para paridade com o hub «Squad as a Service» (ordenado por impacto):

| Prioridade | Gap | IDs doc interno |
|------------|-----|-----------------|
| P0 | Quadro Kanban no board (rota + tab) | M2-5 |
| P0 | Backlog board polido + filtros completos | M2-2, M2-3 |
| P0 | Filtro Projeto e rich filters no contexto board | M2-2 |
| P1 | Cronograma multi-projeto | M2-6, M2-7, M2-11 |
| P1 | Meta / KPIs do board | M2-9, M2-10 |
| P2 | Calendário agregado | M2-8 |
| P2 | Resumo rico | M2-9 |

Funcionalidades Jira **provavelmente não vale implementar** no fork (custo/benefício):

- Jira Service Management (SLA, portal ITSM)
- Advanced Roadmaps / Plans
- Marketplace e apps de terceiros
- JQL e workflow designer nível Jira
- Abas Deployments / Code no board (usar GitHub + links)
- Forms e Checklists como objetos nativos Jira
- Time tracking / worklog (avaliar integração externa)
- Versões/releases formais (avaliar labels + módulos)

---

## 17. Matriz rápida — «tem / não tem»

| Categoria | Jira | Vosso projeto (maio/2026) |
|---------|------|---------------------------|
| Workspace / Espaço | ✅ | ✅ |
| Board de time cross-project | ✅ | 🟡 estrutura ✅, vistas 🔜 |
| Projeto + issues | ✅ | ✅ |
| Épico = entidade acima do projeto | ✅ | ❌ (épico = projeto no fork) |
| Sprints | ✅ | ✅ Ciclos |
| Módulos / épicos técnicos | ✅ | ✅ |
| Kanban / Lista / Calendário / Gantt | ✅ | ✅ (projeto); board agregado 🟡 |
| Rich filters (sem JQL) | ✅ | ✅ |
| Automação visual | ✅ | ❌ |
| JSM / SLA | ✅ | ❌ |
| GitHub | ✅ | ✅ |
| Confluence | ✅ | ❌ (Pages sim) |
| Import Jira | — | ✅ |
| Webhooks | ✅ | ✅ |
| Campos customizados avançados | ✅ | 🟡 |
| Worklog | ✅ | ❌ |

---

## 18. Referências internas

| Documento | Conteúdo |
|-----------|----------|
| [tech4humans-boards-plano-desenvolvimento.md](./tech4humans-boards-plano-desenvolvimento.md) | §17–18 referência Jira, roadmap MVP-1/2 |
| [tech4humans-boards-mvp2-plano.md](./tech4humans-boards-mvp2-plano.md) | Etapas M2-0 … M2-12 |
| [tech4humans-boards-etapas.md](./tech4humans-boards-etapas.md) | MVP-1 etapas 0–10 |
| [tech4humans-plane-organizacao.md](./tech4humans-plane-organizacao.md) | Hierarquia e limitações stock |

---

## 19. Checklist de decisão (copiar para reunião)

```markdown
### Implementar no fork?
- [ ] Cronograma board (M2-6)
- [ ] Quadro board + rota /views (M2-5)
- [ ] Calendário board (M2-8)
- [ ] Worklog / time tracking
- [ ] Campos customizados nível Jira
- [ ] Automação tipo Jira Automation
- [ ] Versões / releases
- [ ] Import Jira board → Plane board
- [ ] BoardMember / permissões ao board

### Manter como está (Plane stock)?
- [ ] Ciclos em vez de Sprints
- [ ] Módulos em vez de Epics técnicos
- [ ] Rich filters em vez de JQL
- [ ] Pages em vez de Confluence

### Explicitamente fora de escopo?
- [ ] Jira Service Management
- [ ] Advanced Roadmaps
- [ ] Marketplace / apps
- [ ] Abas Dev no board
```

---

*Documento gerado para apoio à decisão de produto. Atualizar quando concluir entregas MVP-2 ou mudar o modelo épico/projeto.*
