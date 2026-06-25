# Operis — Roadmap de Paridade Jira (Completo)

**Objetivo:** Documentar TODAS as funcionalidades do Jira Software / Jira Cloud / ecossistema Atlassian, comparar com o estado atual do Operis, e definir um roadmap de implementação item a item.

| Campo | Valor |
|-------|-------|
| **Versão** | 1.0 |
| **Data** | 2026-06-24 |
| **Autor** | Gerado por análise automatizada do codebase Operis + pesquisa Jira |
| **Escopo** | Jira Software, Jira Service Management, Advanced Roadmaps, Confluence, Marketplace, Jira Automation, Jira Admin |

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Implementado no Operis |
| 🟡 | Parcial / limitado |
| ❌ | Não existe no Operis |
| 🔵 | Diferencial Operis (sem equivalente Jira) |
| P0 | Crítico — implementar primeiro |
| P1 | Alta prioridade |
| P2 | Média prioridade |
| P3 | Baixa prioridade / avaliar |
| P4 | Fora de escopo / ignorar |

---

## Índice

1. [Hierarquia e Organização](#1-hierarquia-e-organização)
2. [Tipos de Issue e Esquemas](#2-tipos-de-issue-e-esquemas)
3. [Campos de Issue](#3-campos-de-issue)
4. [Campos Personalizados](#4-campos-personalizados)
5. [Workflows](#5-workflows)
6. [Boards e Vistas](#6-boards-e-vistas)
7. [Backlog e Priorização](#7-backlog-e-priorização)
8. [Sprints e Agile](#8-sprints-e-agile)
9. [Épicos e Portfolio](#9-épicos-e-portfolio)
10. [Roadmaps e Advanced Roadmaps](#10-roadmaps-e-advanced-roadmaps)
11. [Pesquisa e JQL](#11-pesquisa-e-jql)
12. [Filtros e Vistas Guardadas](#12-filtros-e-vistas-guardadas)
13. [Dashboards e Gadgets](#13-dashboards-e-gadgets)
14. [Relatórios e Analytics](#14-relatórios-e-analytics)
15. [Automação](#15-automação)
16. [Permissões e Segurança](#16-permissões-e-segurança)
17. [Notificações](#17-notificações)
18. [Integrações DevOps](#18-integrações-devops)
19. [Time Tracking](#19-time-tracking)
20. [Service Management (JSM)](#20-service-management-jsm)
21. [Confluence / Documentação](#21-confluence--documentação)
22. [Marketplace e Extensibilidade](#22-marketplace-e-extensibilidade)
23. [Importação e Migração](#23-importação-e-migração)
24. [Mobile e Acessibilidade](#24-mobile-e-acessibilidade)
25. [Administração de Instância](#25-administração-de-instância)
26. [IA e Assistentes](#26-ia-e-assistentes)
27. [Roadmap de Implementação (Fases)](#27-roadmap-de-implementação-fases)

---

## 1. Hierarquia e Organização

### 1.1 Estrutura organizacional

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 1.1.1 | **Organização / Site** | Multi-tenant: um site Atlassian agrupa múltiplos produtos. Admin centralizado de billing, users, segurança | 🟡 Instance self-hosted | P3 | Fase 8 — Multi-instance admin |
| 1.1.2 | **Projetos** | Contentor principal de issues. Tem chave (ex: PROJ), lead, categoria, avatar, descrição | ✅ `Project` | — | Implementado |
| 1.1.3 | **Categorias de projeto** | Agrupar projetos por departamento/área (ex: Engineering, Marketing) | 🟡 Agrupado por Board | P2 | Fase 3 — Adicionar categorias de projeto além de Board |
| 1.1.4 | **Componentes** | Subdivisões dentro de um projeto (ex: Frontend, Backend, API). Issues podem ter 1+ componentes | ❌ | P2 | Fase 3 — Modelo `ProjectComponent` com nome, lead, descrição, default assignee |
| 1.1.5 | **Versões / Releases** | Agrupar issues por release (ex: v2.1). Estados: Unreleased, Released, Archived. Fix version e Affects version | ❌ | P2 | Fase 4 — Modelo `ProjectVersion` com nome, datas, estado, release notes |
| 1.1.6 | **Team-managed vs Company-managed** | Projetos team-managed (simplificados, equipa gere) vs company-managed (admin centralizado com schemes) | 🟡 Todos iguais | P3 | Fase 6 — Flag `is_team_managed` que simplifica UI/settings |
| 1.1.7 | **Arquivar projetos** | Soft-delete com restauração; issues ficam read-only | ✅ | — | Implementado |
| 1.1.8 | **Templates de projeto** | Criar projeto a partir de template (Scrum, Kanban, Bug Tracking, etc.) com estados, tipos e workflows pré-configurados | 🟡 Stub | P1 | Fase 2 — Finalizar `template-select.tsx` + API backend com 5+ templates |
| 1.1.9 | **Projeto sem board** | Projetos que são só contentores (sem visualização board) | ✅ Bucket "Sem board" | — | Implementado |

### 1.2 Hierarquia de issues

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 1.2.1 | **Hierarquia Epic → Story → Sub-task** | 3 níveis nativos. Epic agrupa Stories; Stories têm Sub-tasks. Cada nível tem tipo e workflow próprio | 🟡 parent/child genérico | P1 | Fase 2 — Implementar hierarquia explícita de 3+ níveis com UI dedicada |
| 1.2.2 | **Hierarquia personalizada (até 9 níveis)** | Premium: Initiative → Epic → Story → Sub-task → ... Cada nível configurável | ❌ | P2 | Fase 5 — `IssueHierarchyLevel` model com ordering e tipo associado |
| 1.2.3 | **Epic como entidade** | Epic tem cor, resumo, barra de progresso. Aparece como banner nos issues filhos | 🟡 Épico = Projeto no fork | P1 | Fase 2 — Decidir: manter épico=projeto OU criar entidade Epic separada |
| 1.2.4 | **Initiative** | Nível acima do Epic para objetivos estratégicos | 🟡 Store only | P2 | Fase 5 — Completar `InitiativesSidebar` com modelo + API |
| 1.2.5 | **Sub-task** | Issue filho que herda projeto do pai. Pode ter tipo próprio (Sub-bug, Sub-task) | ✅ `parent` FK | — | Implementado |
| 1.2.6 | **Issue linking** | Tipos: blocks/is blocked by, relates to, duplicates/is duplicated by, clones/is cloned by | ✅ `IssueRelation` | — | Implementado |

---

## 2. Tipos de Issue e Esquemas

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 2.1 | **Tipos padrão** | Story, Task, Bug, Epic, Sub-task — cada um com ícone, cor, workflow associado | ✅ `IssueType` configurável | — | Implementado |
| 2.2 | **Tipos customizados** | Criar tipos novos (ex: Improvement, Change Request, Spike) com ícone e descrição | ✅ | — | Implementado |
| 2.3 | **Issue Type Scheme** | Associar conjunto de tipos a um projeto. Diferentes projetos podem ter diferentes tipos disponíveis | 🟡 Tipos por projeto | P2 | Fase 3 — Modelo `IssueTypeScheme` reutilizável entre projetos |
| 2.4 | **Issue Type Screen Scheme** | Definir quais telas (Create/Edit/View) mostram quais campos para cada tipo de issue | ❌ | P2 | Fase 4 — `IssueTypeScreenScheme` com mapeamento tipo→layout de campos |
| 2.5 | **Sub-task types** | Tipos específicos para sub-tasks (ex: Sub-bug, Technical Sub-task) | 🟡 Qualquer tipo pode ser filho | P3 | Fase 4 — Flag `is_subtask_type` no `IssueType` |
| 2.6 | **Default issue type** | Tipo padrão ao criar issue num projeto | 🟡 | P3 | Fase 3 — Campo `default_issue_type` no Project |
| 2.7 | **Workflow por tipo** | Cada tipo de issue pode ter workflow diferente (Bug: Open→Triage→Fix→Done; Story: Backlog→In Progress→Done) | ❌ | P1 | Fase 2 — Ligação `IssueType` → `Workflow` |

---

## 3. Campos de Issue (Nativos)

| # | Campo Jira | Descrição | Operis | Prioridade | Roadmap |
|---|-----------|-----------|--------|------------|---------|
| 3.1 | **Summary** (título) | Texto curto obrigatório | ✅ `name` | — | — |
| 3.2 | **Description** | Rich text com imagens, tabelas, code blocks, menções | ✅ Editor rico | — | — |
| 3.3 | **Assignee** | Responsável (1 pessoa) | ✅ `assignees` (múltiplos) | — | Operis já é melhor (multi-assignee) |
| 3.4 | **Reporter** | Quem criou | ✅ `created_by` | — | — |
| 3.5 | **Priority** | Blocker, Critical, Major, Minor, Trivial | ✅ `priority` (urgent, high, medium, low, none) | — | — |
| 3.6 | **Status** | Estado atual no workflow | ✅ `state` | — | — |
| 3.7 | **Resolution** | Como foi resolvido (Fixed, Won't Fix, Duplicate, Incomplete, Cannot Reproduce) | ❌ | P2 | Fase 3 — Modelo `Resolution` + campo `resolution` no Issue |
| 3.8 | **Labels** | Tags livres | ✅ | — | — |
| 3.9 | **Components** | Subdivisão do projeto | ❌ | P2 | Fase 3 (ver 1.1.4) |
| 3.10 | **Fix Version** | Em que release será corrigido | ❌ | P2 | Fase 4 (ver 1.1.5) |
| 3.11 | **Affects Version** | Em que versão o bug foi encontrado | ❌ | P2 | Fase 4 |
| 3.12 | **Due Date** | Data limite | ✅ `target_date` | — | — |
| 3.13 | **Start Date** | Data de início | ✅ `start_date` | — | — |
| 3.14 | **Original Estimate** | Estimativa inicial em horas | 🟡 Points only | P2 | Fase 4 — Campo `original_estimate_hours` |
| 3.15 | **Remaining Estimate** | Tempo restante | ❌ | P2 | Fase 4 — Campo `remaining_estimate_hours` |
| 3.16 | **Time Spent** | Total de horas logadas | ❌ | P2 | Fase 4 (ver §19) |
| 3.17 | **Sprint** | Sprint/ciclo atual | ✅ `Cycle` | — | — |
| 3.18 | **Epic Link** | A que épico pertence | 🟡 `parent` / `module` | — | — |
| 3.19 | **Story Points** | Estimativa de complexidade | ✅ `estimate_point` | — | — |
| 3.20 | **Environment** | Onde o bug ocorre (ex: Production, Staging) | ❌ | P3 | Fase 4 — Campo `environment` ou custom field |
| 3.21 | **Security Level** | Quem pode ver esta issue | 🟡 Projeto público/privado | P2 | Fase 5 — Segurança por issue individual |
| 3.22 | **Voters** | Quem votou nesta issue | ✅ `IssueVote` | — | — |
| 3.23 | **Watchers** | Quem recebe notificações | ✅ `IssueSubscriber` | — | — |
| 3.24 | **Attachments** | Ficheiros anexados | ✅ `IssueAttachment` | — | — |
| 3.25 | **Comments** | Discussão com menções e formatação | ✅ `IssueComment` | — | — |
| 3.26 | **Work Log** | Registo de horas com data, duração, descrição | ❌ | P1 | Fase 4 (ver §19) |
| 3.27 | **Activity / History** | Log de todas as alterações | ✅ `IssueActivity` | — | — |
| 3.28 | **Created / Updated dates** | Timestamps automáticos | ✅ | — | — |

---

## 4. Campos Personalizados

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 4.1 | **Text Field (single line)** | Input texto simples | 🟡 Custom fields básicos | P1 | Fase 2 — Expandir `custom_field.py` com todos os tipos |
| 4.2 | **Text Field (multi-line)** | Textarea | 🟡 | P1 | Fase 2 |
| 4.3 | **Number Field** | Inteiro ou decimal | 🟡 | P1 | Fase 2 |
| 4.4 | **Date Picker** | Seletor de data | 🟡 | P1 | Fase 2 |
| 4.5 | **Date Time Picker** | Data + hora | ❌ | P1 | Fase 2 |
| 4.6 | **Select List (single)** | Dropdown com opções configuráveis | 🟡 | P1 | Fase 2 |
| 4.7 | **Select List (multiple)** | Multi-select | ❌ | P1 | Fase 2 |
| 4.8 | **Cascading Select** | Select dependente (ex: País → Estado → Cidade) | ❌ | P2 | Fase 4 — Opções hierárquicas com parent_option FK |
| 4.9 | **Checkbox** | Múltiplas opções selecionáveis | ❌ | P2 | Fase 3 |
| 4.10 | **Radio Buttons** | Seleção única visual | ❌ | P2 | Fase 3 |
| 4.11 | **User Picker (single)** | Selecionar um utilizador | ❌ | P2 | Fase 3 |
| 4.12 | **User Picker (multi)** | Selecionar múltiplos utilizadores | ❌ | P2 | Fase 3 |
| 4.13 | **Group Picker** | Selecionar grupo/equipa | ❌ | P3 | Fase 5 |
| 4.14 | **URL Field** | Link com validação | ❌ | P2 | Fase 3 |
| 4.15 | **Labels Field** | Campo de labels custom (diferente das labels de projeto) | ❌ | P3 | Fase 4 |
| 4.16 | **Read-only Text** | Texto estático informativo | ❌ | P3 | Fase 4 |
| 4.17 | **Field Configuration** | Definir se campo é obrigatório, visível, read-only por contexto | ❌ | P1 | Fase 3 — `FieldConfiguration` model com required/hidden/readonly |
| 4.18 | **Field Configuration Scheme** | Associar field configs a projetos | ❌ | P2 | Fase 4 |
| 4.19 | **Custom Field Context** | Restringir campo custom a certos projetos/tipos | ❌ | P2 | Fase 4 |
| 4.20 | **Default Values** | Valor padrão para campos custom | ❌ | P2 | Fase 3 |

---

## 5. Workflows

### 5.1 Workflow Engine

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 5.1.1 | **Workflow visual designer** | Editor drag-and-drop para criar workflows com estados e transições. Interface gráfica mostrando o fluxo | ❌ Stub vazio | P0 | Fase 1 — React Flow editor de workflow com estados + transições |
| 5.1.2 | **Estados** | Nós do workflow (ex: Open, In Progress, In Review, Done). Cada estado tem categoria (To Do, In Progress, Done) | ✅ `State` com grupos | — | Implementado |
| 5.1.3 | **Transições** | Arestas entre estados. Podem ter nome (ex: "Start Progress", "Close Issue") | ❌ | P0 | Fase 1 — Modelo `WorkflowTransition(from_state, to_state, name)` |
| 5.1.4 | **Condições em transições** | Quem pode executar a transição (ex: só assignee, só admin, só membros de grupo X) | ❌ | P1 | Fase 2 — `TransitionCondition` com tipo (role, assignee, reporter, group) |
| 5.1.5 | **Validadores** | Verificações antes de permitir transição (ex: campo obrigatório preenchido, comentário adicionado) | ❌ | P1 | Fase 2 — `TransitionValidator` (required_fields, has_comment, regex) |
| 5.1.6 | **Post-functions** | Ações automáticas após transição (ex: atribuir a lead, limpar campo, enviar email, disparar webhook) | ❌ | P1 | Fase 2 — `TransitionPostFunction` com tipos (assign, clear_field, fire_event, webhook, update_field) |
| 5.1.7 | **Screens em transições** | Formulário exibido ao executar transição (ex: "Adicione comentário de resolução" ao fechar) | ❌ | P2 | Fase 3 — `TransitionScreen` com lista de campos a pedir |
| 5.1.8 | **Workflow Scheme** | Associar workflow a tipo de issue por projeto (ex: Bug → Bug Workflow, Story → Dev Workflow) | ❌ | P1 | Fase 2 — `WorkflowScheme` + `WorkflowSchemeEntry(issue_type, workflow)` |
| 5.1.9 | **Draft workflows** | Editar workflow sem afetar issues existentes até publicar | ❌ | P2 | Fase 3 — `Workflow.is_draft` + publish action |
| 5.1.10 | **Workflow compartilhado** | Reutilizar mesmo workflow em múltiplos projetos | ❌ | P2 | Fase 3 — Workflow no nível workspace + referência em projetos |
| 5.1.11 | **Initial status** | Estado inicial ao criar issue (configurável por workflow) | 🟡 Primeiro estado do grupo Backlog | P2 | Fase 2 — Campo `initial_state` no Workflow |
| 5.1.12 | **Global transitions** | Transição disponível de qualquer estado (ex: "Cancel" de qualquer lugar) | ❌ | P2 | Fase 3 — Flag `is_global` na `WorkflowTransition` |

### 5.2 Detalhes de implementação recomendados

```
Modelos a criar:
├── Workflow
│   ├── id, name, description, workspace, is_draft, is_active
│   └── published_at, created_by
├── WorkflowTransition
│   ├── id, workflow, from_state, to_state, name
│   ├── is_global, screen_id
│   └── ordering
├── TransitionCondition
│   ├── id, transition, condition_type
│   └── config (JSON: role, group, assignee_only, reporter_only)
├── TransitionValidator
│   ├── id, transition, validator_type
│   └── config (JSON: required_fields[], regex_field, regex_pattern)
├── TransitionPostFunction
│   ├── id, transition, function_type, ordering
│   └── config (JSON: assign_to, field_to_update, value, webhook_url)
├── TransitionScreen
│   ├── id, transition
│   └── fields (JSON: field_ids[], required[])
├── WorkflowScheme
│   ├── id, name, workspace, description
│   └── is_default
└── WorkflowSchemeEntry
    ├── id, scheme, issue_type, workflow
    └── (default workflow quando issue_type=null)
```

**Frontend:**
- Editor visual com React Flow (XYFlow já é dependência do Operis)
- Painel lateral com propriedades da transição selecionada
- Modo preview/simulate para testar workflow antes de publicar
- Importar/exportar workflow como JSON

---

## 6. Boards e Vistas

### 6.1 Tipos de board Jira

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 6.1.1 | **Scrum Board** | Board com sprints, backlog, velocidade. Colunas = estados do workflow | ✅ Kanban + Cycles | — | — |
| 6.1.2 | **Kanban Board** | Board contínuo sem sprints. WIP limits. Colunas mapeiam estados | ✅ Layout kanban | — | — |
| 6.1.3 | **Board multi-projeto** | Um board que agrega issues de N projetos (via filtro JQL) | 🟡 Board hub cross-project | P1 | Fase 2 — Completar vistas agregadas |
| 6.1.4 | **WIP Limits** | Limite de cards por coluna. Visual warning quando excede | ❌ | P1 | Fase 2 — Campo `wip_limit` por estado no board + UI warning |
| 6.1.5 | **Swimlanes** | Agrupar cards por: Epic, Assignee, Priority, Issue Type, None | 🟡 Agrupamento existe | P2 | Fase 3 — Expandir opções de swimlane no board hub |
| 6.1.6 | **Card layout** | Configurar quais campos mostrar no card (avatar, labels, estimativa, etc.) | 🟡 | P2 | Fase 3 — `BoardCardLayout` config |
| 6.1.7 | **Card colors** | Colorir cards por: Priority, Issue Type, Assignee, ou query | ❌ | P3 | Fase 4 |
| 6.1.8 | **Quick filters** | Botões de filtro rápido no topo do board (ex: "Só meus", "Only bugs") | 🟡 Rich filters | P2 | Fase 3 — Quick filter bar dedicada no board |
| 6.1.9 | **Column constraints** | Min/max issues por coluna com indicadores visuais | ❌ | P2 | Fase 3 — `min_issues`, `max_issues` por coluna |
| 6.1.10 | **Sub-filter (in-board search)** | Pesquisa textual que filtra cards em tempo real no board | 🟡 API suporta | P1 | Fase 2 — Input de pesquisa na barra do board |

### 6.2 Vistas no board hub (cross-project)

| # | Vista | Descrição | Operis | Prioridade | Roadmap |
|---|-------|-----------|--------|------------|---------|
| 6.2.1 | **Resumo / Summary** | Dashboard do board: KPIs, atividade recente, distribuição por estado/tipo/membro | 🟡 Overview básico | P1 | Fase 2 — Dashboard rico com gráficos + meta API |
| 6.2.2 | **Backlog (cross-project)** | Lista de todas as issues não em sprint, com drag-to-sprint | 🟡 Rota + API existe | P0 | Fase 1 — Polish filtros + drag-and-drop para ciclos |
| 6.2.3 | **Quadro Kanban (cross-project)** | Kanban agregando issues de todos os projetos do board | 🟡 Componente existe, rota parcial | P0 | Fase 1 — Registar rota + tab no header |
| 6.2.4 | **Lista (cross-project)** | Lista tabular com sort/filter | ✅ Rota `/list` | — | — |
| 6.2.5 | **Timeline / Gantt (cross-project)** | Gantt agregado mostrando issues de todos os projetos com dependências | 🟡 Gantt por projeto | P1 | Fase 2 — Gantt agregado no board hub |
| 6.2.6 | **Calendário (cross-project)** | Vista mensal/semanal com issues por data | 🟡 Por projeto | P2 | Fase 3 — Calendário agregado no board |
| 6.2.7 | **Spreadsheet (cross-project)** | Tabela densa editável inline | 🟡 Por projeto | P2 | Fase 3 |

---

## 7. Backlog e Priorização

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 7.1 | **Backlog view** | Lista de issues não atribuídas a sprint/ciclo, com ranking manual | ✅ | — | — |
| 7.2 | **Drag to sprint** | Arrastar issues do backlog para um sprint aberto | 🟡 | P1 | Fase 2 — Drag-and-drop backlog→ciclo no board |
| 7.3 | **Ranking manual** | Reordenar issues por drag-and-drop. Campo `rank` persiste a ordem | ✅ Ordenação manual | — | — |
| 7.4 | **Bulk move to sprint** | Selecionar múltiplas issues e mover para sprint | 🟡 | P2 | Fase 3 — Seleção múltipla + ação "Mover para ciclo" |
| 7.5 | **Epic swimlanes no backlog** | Agrupar backlog por epic para priorizar por contexto | ❌ | P2 | Fase 3 |
| 7.6 | **Version swimlanes** | Agrupar backlog por fix version | ❌ | P3 | Fase 4 (depende de Versions) |
| 7.7 | **Backlog estimation** | Somar story points por epic/sprint no backlog | 🟡 | P2 | Fase 3 — Totalizadores na UI |
| 7.8 | **Sprint planning panel** | Painel lateral mostrando capacidade do sprint vs carga | ❌ | P1 | Fase 2 — Sidebar com capacity vs committed points |

---

## 8. Sprints e Agile

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 8.1 | **Criar sprint** | Nome, datas, goal | ✅ `Cycle` | — | — |
| 8.2 | **Sprint goal** | Texto descritivo do objetivo do sprint | 🟡 Descrição do ciclo | P3 | Fase 3 — Campo `goal` dedicado |
| 8.3 | **Iniciar sprint** | Ativar sprint: define datas, valida que tem issues | ✅ | — | — |
| 8.4 | **Completar sprint** | Fechar sprint: issues incompletas vão para backlog ou próximo sprint | 🟡 | P2 | Fase 3 — Modal de conclusão com opção de destino |
| 8.5 | **Sprint report** | Gráfico mostrando issues completadas, adicionadas, removidas durante o sprint | 🟡 Analytics | P1 | Fase 2 — Relatório dedicado por ciclo |
| 8.6 | **Burndown chart** | Gráfico de story points/issues restantes ao longo do sprint vs ideal | 🟡 | P1 | Fase 2 — Componente de burndown com Recharts |
| 8.7 | **Burnup chart** | Scope completo vs completado ao longo do tempo | ❌ | P2 | Fase 3 |
| 8.8 | **Velocity chart** | Média de story points completados por sprint (últimos N sprints) | 🟡 | P1 | Fase 2 — Gráfico de barras com média |
| 8.9 | **Cumulative flow diagram** | Áreas empilhadas mostrando issues por estado ao longo do tempo | ❌ | P2 | Fase 3 |
| 8.10 | **Sprint auto-schedule** | Criar sprints automaticamente com duração fixa | 🟡 | P2 | Fase 3 — Validar `auto_schedule_cycles` |
| 8.11 | **Parallel sprints** | Múltiplos sprints ativos simultaneamente | 🟡 Ciclos podem sobrepor | P3 | — |
| 8.12 | **Sprint scope change tracking** | Registar quando issues são adicionadas/removidas mid-sprint | ❌ | P2 | Fase 3 — Event log de scope changes |

---

## 9. Épicos e Portfolio

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 9.1 | **Epic** | Issue de alto nível. Tem cor, nome, resumo. Agrega stories | 🟡 Épico = Projeto | P1 | Fase 2 — Completar UI de épicos se for entidade separada |
| 9.2 | **Epic panel** | Painel lateral no board mostrando épicos e seu progresso | ❌ | P1 | Fase 2 — Sidebar de módulos/épicos com barras de progresso |
| 9.3 | **Epic progress bar** | Barra visual: % stories done/in progress/to do | ❌ | P1 | Fase 2 — Componente de progresso no módulo |
| 9.4 | **Epic burndown** | Burndown específico por épico | ❌ | P2 | Fase 3 |
| 9.5 | **Epic report** | Relatório de todas as stories do épico com status | ❌ | P2 | Fase 3 |
| 9.6 | **Roadmap view (project level)** | Timeline de épicos com issues dentro. Drag para ajustar datas | 🟡 Módulos + Gantt | P1 | Fase 2 — Vista roadmap dedicada |
| 9.7 | **Release hub** | Dashboard de uma release: issues, progresso, burndown por release | ❌ | P2 | Fase 4 (depende de Versions) |

---

## 10. Roadmaps e Advanced Roadmaps

### 10.1 Basic Roadmap

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 10.1.1 | **Timeline view** | Barras horizontais por issue/epic no tempo. Drag para ajustar datas | ✅ Gantt | — | — |
| 10.1.2 | **Dependencies** | Linhas entre issues mostrando dependências (blocks/is blocked by) | 🟡 Stub | P1 | Fase 2 — Setas de dependência no Gantt + validação de conflitos |
| 10.1.3 | **Progress bars** | Progresso de épicos/issues baseado em filhos | ❌ | P1 | Fase 2 |
| 10.1.4 | **Color by** | Colorir barras por status, prioridade, tipo, assignee | ❌ | P2 | Fase 3 |
| 10.1.5 | **Zoom levels** | Dias, Semanas, Meses, Trimestres, Anos | 🟡 | P1 | Fase 2 — Expandir níveis de zoom |

### 10.2 Advanced Roadmaps (Plans) — Jira Premium

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 10.2.1 | **Plans (cross-project)** | Roadmap que agrega múltiplos projetos e equipas | ❌ | P2 | Fase 5 — Modelo `Plan` com relação N:M a projetos |
| 10.2.2 | **Capacity planning** | Definir capacidade por equipa (horas/sprint). Visualizar over/under allocation | ❌ | P2 | Fase 5 — `TeamCapacity(team, sprint, hours)` |
| 10.2.3 | **Scenario planning** | Criar cenários "what-if": mover issues entre sprints/releases e ver impacto | ❌ | P3 | Fase 6 — Fork de plan como scenario |
| 10.2.4 | **Cross-team dependencies** | Visualizar dependências entre issues de equipas/projetos diferentes | ❌ | P2 | Fase 5 — Vista de dependências cross-project no Plan |
| 10.2.5 | **Auto-scheduler** | IA/algoritmo que sugere quando fazer issues baseado em dependências e capacidade | ❌ | P3 | Fase 7 — Algoritmo de scheduling baseado em critical path |
| 10.2.6 | **Release tracking** | Progresso por release: issues in/out scope, % completo, risco | ❌ | P2 | Fase 5 (depende de Versions) |
| 10.2.7 | **Teams view** | Organizar plan por equipas (quem faz o quê) | ❌ | P2 | Fase 5 — Agrupamento por board/equipa no Plan |
| 10.2.8 | **Custom hierarchy** | Definir hierarquia custom no plan (Theme → Initiative → Epic → Story) | ❌ | P3 | Fase 6 |
| 10.2.9 | **Saved plan filters** | Filtros específicos do plan guardados | ❌ | P3 | Fase 6 |
| 10.2.10 | **Dependencies report** | Relatório de todas as dependências cross-project | ❌ | P2 | Fase 5 |

---

## 11. Pesquisa e JQL

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 11.1 | **JQL (Jira Query Language)** | Linguagem tipo SQL: `project = PROJ AND status = "In Progress" AND assignee = currentUser() ORDER BY priority DESC` | ❌ | P0 | Fase 1 — **OQL (Operis Query Language)** — ver detalhes abaixo |
| 11.2 | **JQL Autocomplete** | Sugestões em tempo real de campos, valores, operadores e funções | ❌ | P1 | Fase 2 — Editor com CodeMirror + language server |
| 11.3 | **JQL Functions** | `currentUser()`, `membersOf(group)`, `startOfDay()`, `endOfWeek()`, `issueHistory()`, etc. | ❌ | P1 | Fase 2 — Implementar 15+ funções |
| 11.4 | **Quick search** | Ctrl+K pesquisa global por issues, projetos, boards, people | ✅ Power K | — | — |
| 11.5 | **Advanced search page** | Página dedicada com editor JQL + resultados com colunas configuráveis | ❌ | P1 | Fase 2 — Rota `/search/advanced` com editor OQL |
| 11.6 | **Search by attachment name** | Encontrar issues que têm ficheiro X anexado | ❌ | P3 | Fase 4 |
| 11.7 | **Search by comment content** | Encontrar issues com comentário contendo texto X | 🟡 FTS | P2 | Fase 3 |
| 11.8 | **Recent searches** | Histórico das últimas pesquisas do utilizador | ❌ | P2 | Fase 3 |
| 11.9 | **Search across projects** | Pesquisa que abrange todos os projetos (ou subset) | ✅ | — | — |

### 11.10 Especificação OQL (Operis Query Language)

```
Sintaxe proposta:

<query>     ::= <clause> (("AND" | "OR") <clause>)*
<clause>    ::= <field> <operator> <value>
              | "NOT" <clause>
              | "(" <query> ")"
<field>     ::= "project" | "status" | "assignee" | "priority" | "type"
              | "label" | "cycle" | "module" | "board" | "created"
              | "updated" | "due" | "start_date" | "estimate"
              | "parent" | "creator" | "subscriber" | cf[<id>]
<operator>  ::= "=" | "!=" | ">" | ">=" | "<" | "<=" 
              | "IN" | "NOT IN" | "IS" | "IS NOT" | "~" | "!~"
<value>     ::= <string> | <number> | <date> | <function> | <list>
<function>  ::= "currentUser()" | "membersOf(<group>)" | "now()"
              | "startOfDay(<offset>)" | "endOfWeek(<offset>)"
              | "startOfMonth(<offset>)" | "endOfMonth(<offset>)"
<list>      ::= "(" <value> ("," <value>)* ")"

Exemplos:
  project = "PROJ-1" AND status = "In Progress"
  assignee = currentUser() AND due < endOfWeek()
  type IN ("Bug", "Task") AND priority >= "High"
  label = "critical" OR label = "blocker"
  board = "squad-alpha" AND cycle = "Sprint 23"
  cf[12] = "Enterprise" AND created >= startOfMonth(-1)
  status CHANGED FROM "Open" TO "In Progress" AFTER "2026-01-01"

Implementação:
  Backend: Parser (pyparsing ou lark) → Django ORM Q objects
  Frontend: CodeMirror 6 com custom language + autocomplete
  API: GET /api/v1/workspaces/{slug}/search/oql/?q=<query>
```

---

## 12. Filtros e Vistas Guardadas

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 12.1 | **Filtros guardados** | Salvar query (JQL/filtros) com nome para reutilizar | ✅ Views | — | — |
| 12.2 | **Filtros partilhados** | Partilhar filtro com equipa/projeto/organização | ✅ Views com sharing | — | — |
| 12.3 | **Filtros favoritos** | Marcar filtros como favorito para acesso rápido | ✅ Favoritos | — | — |
| 12.4 | **Subscriptions** | Receber email periódico com resultados do filtro (ex: diário, semanal) | ❌ | P2 | Fase 4 — Celery task que corre filtros subscritos e envia email |
| 12.5 | **Filtro como fonte de board** | Board pode usar filtro/JQL como source em vez de projeto | ❌ | P2 | Fase 4 — Campo `source_filter` no Board |
| 12.6 | **Columns configuration** | Escolher quais colunas mostrar na lista de resultados | 🟡 | P2 | Fase 3 — `ViewColumnConfig` persistente |
| 12.7 | **Bulk change from filter** | Selecionar issues do resultado e fazer bulk edit | 🟡 | P2 | Fase 3 |

---

## 13. Dashboards e Gadgets

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 13.1 | **Dashboard** | Página personalizável com gadgets dispostos em grid | 🟡 Analytics básico | P1 | Fase 2 — Dashboard builder com grid layout |
| 13.2 | **Dashboard partilhado** | Dashboards visíveis para equipa/projeto | ❌ | P2 | Fase 3 |
| 13.3 | **Gadget: Filter Results** | Tabela com resultados de um filtro | ❌ | P1 | Fase 2 |
| 13.4 | **Gadget: Pie Chart** | Gráfico pizza por campo (status, assignee, priority) | 🟡 Analytics | P1 | Fase 2 |
| 13.5 | **Gadget: Created vs Resolved** | Gráfico de linhas: issues criadas vs resolvidas ao longo do tempo | ❌ | P1 | Fase 2 |
| 13.6 | **Gadget: Two Dimensional Filter** | Tabela cruzada (ex: tipo vs prioridade, assignee vs status) | ❌ | P2 | Fase 3 |
| 13.7 | **Gadget: Recently Created** | Lista das últimas issues criadas | 🟡 | P2 | Fase 3 |
| 13.8 | **Gadget: Assigned to Me** | Issues atribuídas ao utilizador logado | ✅ Home | — | — |
| 13.9 | **Gadget: Sprint Burndown** | Burndown inline no dashboard | ❌ | P1 | Fase 2 |
| 13.10 | **Gadget: Sprint Health** | Saúde do sprint: scope changes, velocity vs commitment | ❌ | P1 | Fase 2 |
| 13.11 | **Gadget: Wallboard** | Modo TV/monitor para standup | ❌ | P3 | Fase 5 |
| 13.12 | **Gadget: Activity Stream** | Feed de atividade recente do projeto/board | 🟡 | P2 | Fase 3 |
| 13.13 | **Gadget custom (URL)** | Embed de iframe/URL como gadget | ❌ | P3 | Fase 5 |
| 13.14 | **Dashboard layout** | Drag-and-drop de gadgets em grid 2-3 colunas | ❌ | P1 | Fase 2 — React Grid Layout |

### 13.15 Especificação Dashboard Builder

```
Modelos:
├── Dashboard
│   ├── id, name, workspace, owner, is_shared, layout_config (JSON)
│   └── created_at, updated_at
├── DashboardGadget
│   ├── id, dashboard, gadget_type, position (JSON: {x,y,w,h})
│   ├── config (JSON: filter_id, chart_type, field, project_id, etc.)
│   └── refresh_interval_seconds
└── DashboardShare
    ├── id, dashboard, shared_with_type (workspace/project/user)
    └── shared_with_id, permission (view/edit)

Gadget types iniciais (Fase 2):
  - filter_results, pie_chart, bar_chart, line_chart
  - burndown, velocity, created_vs_resolved
  - sprint_health, activity_stream, text_widget

Frontend:
  - react-grid-layout para drag-and-drop
  - Recharts para gráficos
  - Configuração por gadget via modal
```

---

## 14. Relatórios e Analytics

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 14.1 | **Burndown Chart** | Story points restantes vs tempo, com linha ideal | 🟡 | P1 | Fase 2 |
| 14.2 | **Burnup Chart** | Scope total + completado vs tempo | ❌ | P2 | Fase 3 |
| 14.3 | **Sprint Report** | Issues completadas, não completadas, removidas; story points antes/depois | 🟡 | P1 | Fase 2 |
| 14.4 | **Velocity Chart** | Barras: committed vs completed por sprint | 🟡 | P1 | Fase 2 |
| 14.5 | **Cumulative Flow Diagram** | Áreas empilhadas: issues por estado vs tempo | ❌ | P2 | Fase 3 |
| 14.6 | **Control Chart** | Cycle time / lead time scatter plot com percentis | ❌ | P2 | Fase 3 |
| 14.7 | **Average Age Report** | Idade média das issues abertas por prioridade/tipo | ❌ | P2 | Fase 3 |
| 14.8 | **Created vs Resolved** | Linhas: issues criadas vs resolvidas por período | ❌ | P1 | Fase 2 |
| 14.9 | **Pie Chart Report** | Distribuição por qualquer campo | 🟡 Analytics | P1 | Fase 2 |
| 14.10 | **Resolution Time Report** | Tempo médio de resolução por tipo/prioridade | ❌ | P2 | Fase 3 |
| 14.11 | **Workload Report** | Issues por assignee com story points | 🟡 | P2 | Fase 3 |
| 14.12 | **Time Tracking Report** | Horas estimadas vs logadas por issue/sprint | ❌ | P2 | Fase 4 (depende Time Tracking) |
| 14.13 | **Epic Report** | Progresso de um épico: stories done vs total, burndown | ❌ | P2 | Fase 3 |
| 14.14 | **Version Report** | Progresso de uma release: issues done/in progress/to do | ❌ | P3 | Fase 4 (depende Versions) |
| 14.15 | **Time in Status** | Quanto tempo cada issue passa em cada estado | ❌ | P2 | Fase 3 — Calcular a partir de `IssueActivity` |
| 14.16 | **Forecast** | Projeção de quando um épico/release será concluído baseado em velocity | ❌ | P3 | Fase 5 |
| 14.17 | **Export relatórios** | PDF, CSV, imagem para todos os relatórios | 🟡 CSV | P2 | Fase 3 — Adicionar PDF e PNG |

---

## 15. Automação

### 15.1 Jira Automation features

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 15.1.1 | **Rule builder visual** | Interface no-code: WHEN (trigger) → IF (condition) → THEN (action) | ❌ (motor existe mas é código/YAML) | P0 | Fase 1 — **No-code rule builder** com UI drag-and-drop |
| 15.1.2 | **Triggers** | Issue created, updated, transitioned, commented, linked, sprint started/completed, scheduled, incoming webhook, manual | ✅ Motor automation | — | — |
| 15.1.3 | **Conditions** | If field equals, issue type is, JQL match, user is in group, related issues match | 🟡 Matching engine | P1 | Fase 2 — Expandir condições |
| 15.1.4 | **Actions: Transition issue** | Mover issue para outro estado | ✅ | — | — |
| 15.1.5 | **Actions: Edit issue fields** | Alterar assignee, priority, labels, custom fields | ✅ | — | — |
| 15.1.6 | **Actions: Create issue** | Criar nova issue automaticamente | ✅ | — | — |
| 15.1.7 | **Actions: Create sub-task** | Criar sub-tasks automáticas (ex: checklist ao criar Bug) | 🟡 | P2 | Fase 3 |
| 15.1.8 | **Actions: Add comment** | Adicionar comentário automático | ✅ | — | — |
| 15.1.9 | **Actions: Send email** | Enviar email com template | ✅ Email renderer | — | — |
| 15.1.10 | **Actions: Send webhook** | POST para URL externa | ✅ | — | — |
| 15.1.11 | **Actions: Send Slack message** | Notificação para canal Slack | 🟡 | P2 | Fase 3 |
| 15.1.12 | **Actions: Log work** | Adicionar worklog automaticamente | ❌ | P3 | Fase 4 |
| 15.1.13 | **Actions: Clone issue** | Duplicar issue com campos selecionados | 🟡 | P2 | Fase 3 |
| 15.1.14 | **Actions: Link issues** | Criar relação entre issues | ✅ | — | — |
| 15.1.15 | **Branches (if/else)** | Caminhos condicionais na regra | ✅ Executor avançado | — | — |
| 15.1.16 | **Parallel branches** | Executar ações em paralelo | 🟡 | P2 | Fase 3 |
| 15.1.17 | **Lookup issues** | Buscar issues relacionadas para iterar/condicionar | 🟡 | P2 | Fase 3 |
| 15.1.18 | **Smart values** | Variáveis dinâmicas: `{{issue.summary}}`, `{{now}}`, `{{triggerUser.displayName}}` | 🟡 | P1 | Fase 2 — Template engine completa |
| 15.1.19 | **Scheduled triggers** | Cron: "Toda segunda às 9h", "Diariamente" | ✅ Schedule | — | — |
| 15.1.20 | **Audit log** | Histórico de execuções: sucesso, falha, actions tomadas | ✅ Run recorder | — | — |
| 15.1.21 | **Rule templates** | Templates pré-feitos (ex: "Auto-close stale issues", "Sync parent status") | ✅ Templates registry | — | — |
| 15.1.22 | **Global rules** | Regras que se aplicam a todos os projetos | 🟡 | P2 | Fase 3 |
| 15.1.23 | **Rate limiting** | Limitar execuções por minuto/hora para evitar loops | 🟡 Governance | P2 | Fase 3 |
| 15.1.24 | **Actor (rule executor)** | Definir quem "executa" a ação (automation user vs trigger user) | 🟡 | P3 | Fase 4 |

### 15.2 No-Code Rule Builder — Especificação

```
Interface proposta (React Flow já disponível):

┌──────────────────────────────────────────────────────────────┐
│  WHEN                          │  IF                        │
│  ┌─────────────────────────┐   │  ┌──────────────────────┐  │
│  │ Issue transitioned      │──▶│  │ Status = "Done"      │  │
│  │ Issue created           │   │  │ Type = "Bug"         │  │
│  │ Comment added           │   │  │ Priority >= "High"   │  │
│  │ Sprint started          │   │  └──────────────────────┘  │
│  │ Scheduled (cron)        │   │            │               │
│  │ Webhook received        │   │            ▼               │
│  └─────────────────────────┘   │  THEN                      │
│                                │  ┌──────────────────────┐  │
│                                │  │ Send email to lead   │  │
│                                │  │ Add comment "Done!"  │  │
│                                │  │ Transition to Closed │  │
│                                │  └──────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

Componentes frontend:
  - TriggerNode: seletor de evento
  - ConditionNode: builder de condições (field + operator + value)
  - ActionNode: seletor de ação + configuração
  - BranchNode: if/else split
  - Canvas: React Flow com snap-to-grid

Backend: Compilar grafo visual → automation rule JSON existente
```

---

## 16. Permissões e Segurança

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 16.1 | **Permission Scheme** | Conjunto de permissões associado a projetos. Granular: Browse, Create, Edit, Delete, Assign, Close, Transition, etc. | 🟡 Roles básicos | P1 | Fase 2 — `PermissionScheme` com 20+ permissões granulares |
| 16.2 | **Project roles** | Roles definidos por projeto (ex: Developer, QA, PM, Stakeholder) com membros/grupos | 🟡 Board roles | P1 | Fase 2 — Expandir `board_role.py` para project roles |
| 16.3 | **Global permissions** | Permissões da instância: admin, create project, bulk change, manage groups | 🟡 Workspace admin | P2 | Fase 3 |
| 16.4 | **Issue-level security** | Security levels: quem pode ver cada issue. (ex: "Internal Only", "Public") | ❌ | P2 | Fase 4 — `SecurityLevel` model + `security_level` FK no Issue |
| 16.5 | **Field-level security** | Restringir quem pode ver/editar campos específicos | ❌ | P3 | Fase 5 |
| 16.6 | **Groups** | Agrupar utilizadores (ex: jira-developers, qa-team). Usar em permissões e filtros | ❌ | P2 | Fase 3 — `UserGroup` model com membros |
| 16.7 | **SSO / SAML / OIDC** | Single sign-on com identity providers (Okta, Azure AD, Google) | 🟡 OAuth + magic link | P1 | Fase 2 — Integração SAML 2.0 + OIDC completa |
| 16.8 | **2FA / MFA** | Two-factor authentication | 🟡 Depende deploy | P2 | Fase 3 — TOTP nativo |
| 16.9 | **Audit log** | Registo de ações: quem fez o quê, quando | 🟡 `IssueActivity` | P2 | Fase 3 — Audit log centralizado para todas as entidades |
| 16.10 | **IP allowlist** | Restringir acesso por IP | ❌ | P3 | Fase 5 |
| 16.11 | **API rate limiting** | Limitar requests por token/user | 🟡 | P2 | Fase 3 — Melhorar throttling |
| 16.12 | **Data residency** | Escolher região dos dados (EU, US, etc.) | 🟡 Self-hosted = controlo total | P4 | N/A para self-host |
| 16.13 | **Session management** | Ver sessões ativas, forçar logout | 🟡 | P3 | Fase 4 |
| 16.14 | **Anonymous access** | Permitir visualização sem login (projetos públicos) | ✅ Space/Publish | — | — |

### 16.15 Detalhes do Permission Scheme

```
Permissões granulares propostas (Jira-level):

Projeto:
  - project.browse         — ver o projeto e suas issues
  - project.admin          — administrar settings do projeto
  - project.manage_members — adicionar/remover membros

Issues:
  - issue.create           — criar issues
  - issue.edit             — editar campos de issues
  - issue.delete           — apagar issues
  - issue.assign           — atribuir issues a outros
  - issue.transition       — mudar estado
  - issue.close            — fechar/resolver issues
  - issue.link             — criar links entre issues
  - issue.move             — mover entre projetos
  - issue.archive          — arquivar issues
  - issue.set_security     — definir security level

Comentários:
  - comment.create         — adicionar comentários
  - comment.edit_own       — editar os seus comentários
  - comment.edit_all       — editar qualquer comentário
  - comment.delete_own     — apagar os seus
  - comment.delete_all     — apagar qualquer

Anexos:
  - attachment.create      — adicionar anexos
  - attachment.delete_own  — apagar os seus
  - attachment.delete_all  — apagar qualquer

Worklog:
  - worklog.create         — registar horas
  - worklog.edit_own       — editar os seus
  - worklog.edit_all       — editar qualquer
  - worklog.delete_own     — apagar os seus
  - worklog.delete_all     — apagar qualquer

Views:
  - view.create            — criar vistas
  - view.manage_shared     — gerir vistas partilhadas

Filters:
  - filter.create          — criar filtros
  - filter.manage_shared   — gerir filtros partilhados
```

---

## 17. Notificações

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 17.1 | **Notification Scheme** | Configurar quem recebe email para cada evento por projeto | 🟡 | P2 | Fase 3 — `NotificationScheme` + eventos configuráveis |
| 17.2 | **Email por evento** | Issue created/updated/commented/transitioned/assigned → email para watchers, assignee, reporter | ✅ | — | — |
| 17.3 | **In-app notifications** | Badge + feed de notificações no header | ✅ | — | — |
| 17.4 | **@mentions** | Mencionar utilizador em descrição/comentário → notificação | ✅ | — | — |
| 17.5 | **Preferências por utilizador** | Cada utilizador escolhe quais notificações receber | ✅ | — | — |
| 17.6 | **Batch / digest emails** | Agrupar notificações em um email periódico em vez de uma por evento | 🟡 | P2 | Fase 3 |
| 17.7 | **Notification per board** | Configurações de notificação específicas por board | ✅ Board notification settings | — | — |
| 17.8 | **Push notifications (mobile)** | Notificação push no telemóvel | 🟡 | P3 | Fase 5 |
| 17.9 | **Slack notifications** | Enviar notificações para canais Slack | 🟡 | P2 | Fase 3 — Expandir `SlackProjectSync` |

---

## 18. Integrações DevOps

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 18.1 | **GitHub** | PRs, branches, commits ligados a issues. Aba "Development" na issue | ✅ Sync básico | P1 | Fase 2 — Development panel na issue detail |
| 18.2 | **GitLab** | Idem GitHub | 🟡 Config existe | P2 | Fase 3 |
| 18.3 | **Bitbucket** | Idem (produto Atlassian) | ❌ | P3 | Fase 5 |
| 18.4 | **Smart commits** | Mensagem de commit "PROJ-123 #close #time 2h Fixed login bug" → transição + worklog automáticos | ❌ | P1 | Fase 2 — Parser de commit message + actions |
| 18.5 | **Branch auto-creation** | Criar branch automaticamente a partir da issue (com nome formatado) | ❌ | P2 | Fase 3 — Botão "Create branch" na issue → API GitHub |
| 18.6 | **Build status** | Mostrar status de CI/CD (pass/fail) na issue | ❌ | P2 | Fase 3 — Webhook receptor de CI status |
| 18.7 | **Deployment tracking** | Aba "Deployments" mostrando onde a issue foi deployed (staging, production) | 🟡 `DeployBoard` modelo existe | P2 | Fase 3 — UI de deployments |
| 18.8 | **Code review status** | PR approved/changes requested visível na issue | ❌ | P2 | Fase 3 |
| 18.9 | **Feature flags** | Integração com LaunchDarkly/feature flag services | ❌ | P4 | Avaliar |
| 18.10 | **Sentry integration** | Erros de produção linkados a issues | 🟡 Config existe | P3 | Fase 4 |

### 18.11 Smart Commits — Especificação

```
Formato proposto:
  <ISSUE-KEY> #<command> [args]

Comandos:
  #comment <text>     → Adicionar comentário à issue
  #time <duration>    → Registar worklog (ex: #time 2h30m)
  #transition <state> → Mover para estado (ex: #transition Done)
  #close              → Atalho para #transition Done
  #assign <user>      → Atribuir a utilizador
  #label <name>       → Adicionar label

Exemplos de commit messages:
  "PROJ-123 #close #time 3h Fixed the login validation bug"
  "PROJ-456 #comment Deployed to staging #transition In Review"
  "PROJ-789 #assign @joao #label urgent Hotfix for payment flow"

Implementação:
  - Webhook handler que parse commit messages
  - Regex: /([A-Z]+-\d+)\s+#(\w+)\s*/g
  - Executar ações no contexto do committer (se membro do workspace)
  - Audit log de smart commit actions
```

---

## 19. Time Tracking

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 19.1 | **Log work** | Registar horas trabalhadas: data, duração, descrição | ❌ Stub | P1 | Fase 2 — Modelo + API + UI |
| 19.2 | **Original estimate** | Horas estimadas ao criar issue | ❌ | P1 | Fase 2 |
| 19.3 | **Remaining estimate** | Horas restantes (auto-ajusta ou manual) | ❌ | P1 | Fase 2 |
| 19.4 | **Time tracking panel** | Barra visual na issue: Logged / Estimated / Remaining | ❌ | P1 | Fase 2 |
| 19.5 | **Timesheet report** | Relatório de horas por utilizador/projeto/período | ❌ | P2 | Fase 3 |
| 19.6 | **Billable hours** | Marcar horas como faturáveis vs internas | ❌ | P2 | Fase 3 — Campo `is_billable` no Worklog |
| 19.7 | **Time tracking permissions** | Quem pode logar/editar/apagar worklogs | ❌ | P2 | Fase 3 |
| 19.8 | **Timer** | Cronómetro em tempo real (start/stop) para logar automaticamente | ❌ | P2 | Fase 3 — Timer no header/sidebar |
| 19.9 | **Weekly timesheet view** | Grid semanal: linhas = issues, colunas = dias | ❌ | P2 | Fase 4 |

### 19.10 Especificação do Time Tracking

```
Modelos:
├── Worklog
│   ├── id, issue, author, workspace, project
│   ├── time_spent_seconds (int)
│   ├── started_at (datetime)
│   ├── description (text)
│   ├── is_billable (bool, default=True)
│   ├── activity_type (FK → WorklogActivityType: Development, Review, Meeting, Testing)
│   └── created_at, updated_at
├── WorklogActivityType
│   ├── id, workspace, name, icon, color
│   └── is_default
├── IssueTimeTracking (campos no Issue)
│   ├── original_estimate_seconds
│   ├── remaining_estimate_seconds
│   └── time_spent_seconds (computed sum of worklogs)
└── TimerSession
    ├── id, user, issue, workspace
    ├── started_at
    ├── stopped_at (null = em progresso)
    └── worklog_id (FK, null até parar e converter)

API endpoints:
  POST   /issues/{id}/worklogs/          → Criar worklog
  GET    /issues/{id}/worklogs/          → Listar worklogs da issue
  PATCH  /worklogs/{id}/                 → Editar worklog
  DELETE /worklogs/{id}/                 → Apagar worklog
  POST   /timer/start/                   → Iniciar timer
  POST   /timer/stop/                    → Parar timer → criar worklog
  GET    /timer/current/                 → Timer ativo do utilizador
  GET    /workspaces/{slug}/timesheet/   → Relatório de horas

Frontend:
  - Issue detail: secção Time Tracking com barra visual
  - Log Work modal: data, duração (ex: "2h 30m"), descrição
  - Timer: botão play/stop no header + issue detail
  - Timesheet: grid semanal em /settings ou rota dedicada
  - Reports: gráficos de horas por projeto/membro/período
```

---

## 20. Service Management (JSM)

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 20.1 | **Customer portal** | Portal web para clientes submeterem pedidos sem conta Jira | 🟡 Space/Intake | P2 | Fase 4 — Expandir Space como portal de cliente |
| 20.2 | **Request types** | Tipos de pedido com formulários específicos (ex: "Report a bug", "Access request") | 🟡 Intake forms | P2 | Fase 4 — Associar formulários a tipos |
| 20.3 | **SLA policies** | Tempo de resposta e resolução com alarmes (ex: "P1 = resposta em 1h, resolução em 4h") | 🟡 `board_support_sla_policy.py` existe | P1 | Fase 2 — Completar UI e enforcement de SLAs |
| 20.4 | **SLA tracking** | Timer visual na issue: tempo restante para cumprir SLA. Pausas fora do horário de trabalho | ❌ | P2 | Fase 3 — `SLATimer` com pause/resume baseado em business hours |
| 20.5 | **Queues** | Filas de tickets organizadas por prioridade/tipo/SLA | 🟡 `board_support_queue.py` existe | P1 | Fase 2 — Completar UI de filas |
| 20.6 | **Knowledge base** | FAQ/docs que clientes consultam antes de abrir pedido. Deflexão de tickets | ❌ | P3 | Fase 5 — Integrar Pages como KB no portal |
| 20.7 | **Approvals** | Workflow com etapa de aprovação (manager aprova antes de avançar) | ❌ | P2 | Fase 4 — `ApprovalStep` no workflow com votação |
| 20.8 | **Customer satisfaction** | Survey CSAT após resolução do ticket | ❌ | P3 | Fase 5 |
| 20.9 | **Service catalog** | Catálogo de serviços disponíveis (ex: "Novo laptop", "VPN access") | ❌ | P3 | Fase 5 |
| 20.10 | **Escalation rules** | Escalar automaticamente se SLA prestes a estourar | ❌ | P2 | Fase 4 — Automation rule triggered por SLA warning |
| 20.11 | **Business hours** | Definir horário de trabalho para cálculo de SLA (ex: 9-18h, Seg-Sex) | ❌ | P2 | Fase 3 — `BusinessCalendar` model |
| 20.12 | **Email channel** | Criar tickets por email (inbox → issue) | 🟡 Intake email parcial | P2 | Fase 3 — Completar pipeline email → issue |
| 20.13 | **Chat channel** | Widget de chat embeddable em sites | ❌ | P3 | Fase 6 |

---

## 21. Confluence / Documentação

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 21.1 | **Pages hierárquicas** | Árvore de páginas com parent/child ilimitado | ✅ | — | — |
| 21.2 | **Rich editor** | WYSIWYG com tabelas, imagens, code blocks, embeds, macros | ✅ @operis/editor | — | — |
| 21.3 | **Templates de página** | Criar páginas a partir de templates (Meeting notes, Decision, Retrospective) | 🟡 Stub | P2 | Fase 3 — 10+ templates |
| 21.4 | **Versioning** | Histórico de versões com diff e restauração | ✅ Page versions | — | — |
| 21.5 | **Inline comments** | Comentários ancorados a parágrafos específicos | 🟡 Stub | P2 | Fase 3 |
| 21.6 | **Page restrictions** | Quem pode ver/editar cada página | 🟡 Lock | P2 | Fase 3 — Permissões por página |
| 21.7 | **Spaces** | Espaços separados de documentação (por equipa, projeto, dept.) | 🟡 Pages por projeto | P2 | Fase 3 — Wiki workspace-level |
| 21.8 | **Blog posts** | Posts cronológicos dentro de um space | ❌ | P4 | Avaliar |
| 21.9 | **Labels em páginas** | Tags para organizar e filtrar páginas | ❌ | P3 | Fase 4 |
| 21.10 | **Search em docs** | Full-text search em todas as páginas | ✅ FTS | — | — |
| 21.11 | **Export** | PDF, Word para páginas individuais ou spaces inteiros | ❌ | P2 | Fase 3 |
| 21.12 | **Macros** | Componentes embeddáveis: Table of Contents, Status Badge, Jira Issue Macro, Chart, Calendar | ❌ | P3 | Fase 4 — Block extensions no editor |
| 21.13 | **Collaborative editing** | Edição simultânea por múltiplos utilizadores em tempo real | 🟡 Live app existe | P2 | Fase 3 — CRDT/OT via `apps/live` |
| 21.14 | **Link to issues** | Referenciar issues Operis dentro das páginas, com status atualizado | 🟡 | P2 | Fase 3 — Issue mention com live status |
| 21.15 | **Whiteboards** | Canvas de desenho livre para brainstorming | ❌ | P3 | Fase 5 |
| 21.16 | **Diagrams** | Draw.io / diagramas integrados nas páginas | 🟡 Parcial | P2 | Fase 3 |

---

## 22. Marketplace e Extensibilidade

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 22.1 | **Marketplace** | Loja de 1000+ apps e integrações | ❌ | P2 | Fase 5 — Galeria de Packs (já planeada no roadmap Operis) |
| 22.2 | **Forge apps** | Plataforma serverless para apps dentro do Jira | ❌ | P3 | Fase 6 — Sandbox para packs com WASM |
| 22.3 | **Connect apps** | Apps externas via REST/webhooks | ✅ Webhooks + API | — | — |
| 22.4 | **REST API** | API completa para todas as operações | ✅ DRF + OpenAPI | — | — |
| 22.5 | **Webhooks** | Outbound webhooks para eventos | ✅ | — | — |
| 22.6 | **OAuth 2.0** | Autenticação para apps externas | 🟡 | P2 | Fase 3 |
| 22.7 | **ScriptRunner** | Groovy/JavaScript scripting avançado para customizar Jira | ✅ Script runner no automation | — | — |
| 22.8 | **Plugin system** | Instalar/desinstalar plugins que adicionam funcionalidade | 🟡 Automation Packs | P2 | Fase 4 — Pack lifecycle completo |
| 22.9 | **Custom UI (Forge UI)** | Apps com UI custom renderizada dentro do Jira | ❌ | P3 | Fase 6 |
| 22.10 | **App marketplace revenue** | Venda de apps por terceiros | ❌ | P4 | Fase 8 |

---

## 23. Importação e Migração

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 23.1 | **Import from Jira** | Importar projetos, issues, users, attachments do Jira Cloud/Server | 🟡 Parcial | P1 | Fase 2 — Importação completa com mapeamento de campos |
| 23.2 | **Import from GitHub Issues** | Migrar issues do GitHub | ✅ | — | — |
| 23.3 | **Import from Linear** | Migrar do Linear | 🟡 | P2 | Fase 3 |
| 23.4 | **Import from Asana** | Migrar do Asana | ❌ | P3 | Fase 5 |
| 23.5 | **Import from Trello** | Migrar do Trello | ❌ | P3 | Fase 5 |
| 23.6 | **CSV Import** | Importar issues via CSV com mapeamento de colunas | 🟡 Parcial | P2 | Fase 3 — UI de mapeamento de colunas |
| 23.7 | **Export completo** | Exportar workspace/projeto com todas as relações | 🟡 | P2 | Fase 3 — Export JSON completo + CSV |
| 23.8 | **Migration assistant** | Wizard guiado de migração com validação e preview | ❌ | P2 | Fase 4 — Wizard multi-step com dry-run |
| 23.9 | **Attachment migration** | Migrar ficheiros anexados entre sistemas | ❌ | P2 | Fase 3 |

---

## 24. Mobile e Acessibilidade

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 24.1 | **App iOS** | App nativa iOS com push notifications | 🟡 Plane app | P3 | Fase 5 — Verificar/adaptar fork mobile |
| 24.2 | **App Android** | App nativa Android | 🟡 | P3 | Fase 5 |
| 24.3 | **PWA** | Progressive Web App para acesso mobile via browser | 🟡 | P2 | Fase 3 — Service worker + manifest |
| 24.4 | **Responsive design** | UI adaptável a mobile/tablet | 🟡 | P2 | Fase 3 — Auditar e corrigir breakpoints |
| 24.5 | **Offline mode** | Acesso básico sem conexão (ver issues, drafts) | ❌ | P3 | Fase 6 |
| 24.6 | **Accessibility (WCAG)** | Navegação por teclado, screen readers, contraste, ARIA labels | 🟡 | P2 | Fase 3 — Audit WCAG 2.1 AA |
| 24.7 | **Keyboard shortcuts** | Atalhos para ações comuns (criar issue, navegar, pesquisar) | ✅ Power K | — | — |
| 24.8 | **Dark mode** | Tema escuro | ✅ | — | — |
| 24.9 | **i18n** | Internacionalização | ✅ pt-BR | — | — |

---

## 25. Administração de Instância

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 25.1 | **God Mode / Admin panel** | Administração da instância: configs globais, feature flags, licenças | ✅ apps/admin | — | — |
| 25.2 | **User management** | CRUD de utilizadores, ativar/desativar, roles globais | ✅ | — | — |
| 25.3 | **Email configuration** | SMTP settings para emails transacionais | 🟡 | P2 | Fase 3 — UI admin para SMTP |
| 25.4 | **Backup / Restore** | Backup automático da BD + ficheiros com restore | 🟡 Self-host manual | P2 | Fase 4 — Script automatizado + UI admin |
| 25.5 | **Health monitoring** | Dashboard de saúde: DB, Redis, RabbitMQ, workers, storage | 🟡 Health checks | P2 | Fase 3 — Dashboard admin com status de serviços |
| 25.6 | **Usage analytics** | Métricas de uso: MAU, issues criadas, storage, API calls | ❌ | P3 | Fase 4 |
| 25.7 | **System logs** | Visualizar logs da aplicação no admin | ❌ | P3 | Fase 4 |
| 25.8 | **Announcements** | Banner de anúncios para todos os utilizadores (ex: "Manutenção às 22h") | ❌ | P3 | Fase 4 |
| 25.9 | **Custom branding** | Logo, cores, nome da instância customizáveis | 🟡 | P2 | Fase 3 |

---

## 26. IA e Assistentes

| # | Funcionalidade Jira | Descrição detalhada | Operis | Prioridade | Roadmap |
|---|---------------------|---------------------|--------|------------|---------|
| 26.1 | **Atlassian Intelligence** | IA generativa: resumir issues, gerar descrições, sugerir assignees | 🟡 | P1 | Fase 2 — Expandir assistente com mais tools |
| 26.2 | **Rovo** | Agentes IA que fazem ações: criar issues, atualizar campos, buscar info | 🔵 Assistente + MCP | — | Operis já tem mais |
| 26.3 | **Smart suggestions** | Sugerir assignee, labels, componentes baseado em ML | ❌ | P2 | Fase 3 — ML pipeline para sugestões |
| 26.4 | **Natural language to JQL** | Converter pergunta em português/inglês para OQL | ❌ | P1 | Fase 2 — LLM converte NL → OQL |
| 26.5 | **Issue summarization** | Resumir discussão/comentários de uma issue longa | 🟡 | P2 | Fase 3 |
| 26.6 | **Duplicate detection** | Detectar issues duplicadas antes/depois da criação | ❌ | P2 | Fase 3 — Embeddings + similarity search |
| 26.7 | **Work descriptions** | IA gera descrição a partir do título | ❌ | P2 | Fase 3 |
| 26.8 | **Sprint planning suggestions** | IA sugere quais issues incluir no sprint baseado em velocity e prioridade | ❌ | P3 | Fase 5 |
| 26.9 | **Risk detection** | IA identifica sprints/projetos em risco baseado em padrões | ❌ | P3 | Fase 5 |
| 26.10 | **MCP server** | Protocolo para agentes externos acederem o Operis | 🔵 676 operações | — | Implementado — diferencial |

---

## 27. Roadmap de Implementação (Fases)

### Visão geral das fases

```
                    TIMELINE DE IMPLEMENTAÇÃO
   ╔══════════════════════════════════════════════════════════╗
   ║  Fase 0  │  Fase 1  │  Fase 2  │  Fase 3  │  Fase 4+  ║
   ║  (done)  │  3 meses │  3 meses │  3 meses │  ongoing  ║
   ╠══════════════════════════════════════════════════════════╣
   ║ Baseline │ Core     │ Power    │ Advanced │ Enterprise║
   ║ F0       │ Workflow │ Features │ Polish   │ Scale     ║
   ╚══════════════════════════════════════════════════════════╝
```

---

### Fase 0 — Baseline (CONCLUÍDA)

> Estabilizar o fork, F0 smoke tests, rebranding, board hub M2.

**Estado:** ✅ 28 features OK, 22 validar, 35 parcial

---

### Fase 1 — Core Engine (P0 — 3 meses)

**Objetivo:** Entregar os 4 pilares que faltam para paridade com Jira em funcionalidades core.

| # | Entregável | Items | Estimativa |
|---|-----------|-------|------------|
| F1.1 | **Workflow Engine** | 5.1.1–5.1.6: Modelo Workflow, Transition, Conditions, Validators, Post-functions. Editor visual com React Flow | 4–6 semanas |
| F1.2 | **OQL (Query Language)** | 11.1–11.5: Parser, 15+ funções, autocomplete CodeMirror, API endpoint, página de pesquisa avançada | 3–4 semanas |
| F1.3 | **No-Code Rule Builder** | 15.1.1: UI visual para automação (WHEN→IF→THEN). Compilar para formato existente do motor de automação | 3–4 semanas |
| F1.4 | **Board Hub P0** | 6.2.2–6.2.3: Kanban cross-project (rota + tab), Backlog polish com filtros e drag-to-cycle | 2–3 semanas |

**Dependências:** F1.1 (Workflow) desbloqueia F1.3 (Rule Builder — transições como trigger/action)

**Métricas de sucesso:**
- [ ] Workflow designer funcional com 3+ workflows de exemplo
- [ ] OQL resolve 80% dos cenários que JQL resolve
- [ ] Rule builder permite criar 5 tipos de regras sem código
- [ ] Board hub tem 3 vistas funcionais (backlog, kanban, lista)

---

### Fase 2 — Power Features (P1 — 3 meses)

**Objetivo:** Fechar os gaps de alta prioridade que fazem utilizadores escolher Jira.

| # | Entregável | Items | Estimativa |
|---|-----------|-------|------------|
| F2.1 | **Time Tracking** | 19.1–19.8: Worklog, timer, estimativas, painel visual, permissões | 3–4 semanas |
| F2.2 | **Relatórios Agile** | 14.1–14.5, 14.8: Burndown, burnup, velocity, sprint report, CFD, created vs resolved | 3–4 semanas |
| F2.3 | **Dashboard Builder** | 13.1–13.14: Grid layout, 10+ gadgets, partilha, auto-refresh | 3–4 semanas |
| F2.4 | **Workflow completude** | 5.1.7–5.1.12: Screens, Schemes, draft workflows, global transitions | 2–3 semanas |
| F2.5 | **Smart Commits** | 18.4: Parser de commit messages, ações automáticas | 1–2 semanas |
| F2.6 | **Dev Panel** | 18.1: Painel "Development" na issue: branches, PRs, commits, build status | 2–3 semanas |
| F2.7 | **Sprint completion** | 8.4–8.6: Modal de conclusão, sprint report dedicado, burndown chart | 2 semanas |
| F2.8 | **Épico/Roadmap polish** | 9.2–9.6: Epic panel, progress bars, roadmap view dedicada | 2–3 semanas |
| F2.9 | **Timeline dependencies** | 10.1.2–10.1.5: Setas de dependência no Gantt, zoom levels completos | 2 semanas |
| F2.10 | **Permission Scheme** | 16.1–16.2: 20+ permissões granulares, project roles, SSO/SAML | 3–4 semanas |
| F2.11 | **Templates de projeto** | 1.1.8: 5+ templates pré-configurados (Scrum, Kanban, Bug Tracking, Cliente 360, Support) | 1–2 semanas |
| F2.12 | **Hierarquia de issues** | 1.2.1–1.2.3: 3+ níveis explícitos, UI de hierarquia | 2 semanas |
| F2.13 | **SLA/Queues** | 20.3, 20.5: Completar UI de SLA policies e support queues | 2 semanas |
| F2.14 | **Import Jira completo** | 23.1: Importação com mapeamento de campos, workflows, attachments | 2–3 semanas |
| F2.15 | **Smart values automação** | 15.1.18: Template engine `{{issue.summary}}`, `{{now}}`, etc. | 1–2 semanas |
| F2.16 | **NL → OQL** | 26.4: LLM converte pergunta natural em OQL query | 1 semana |
| F2.17 | **Sprint planning panel** | 7.8: Sidebar capacity vs committed no backlog | 1 semana |

**Métricas de sucesso:**
- [ ] Utilizador pode logar horas e ver timesheet semanal
- [ ] Dashboard com 5+ gadgets configuráveis
- [ ] Sprint report com burndown funcional
- [ ] Import Jira migra 95% dos dados sem perda
- [ ] Workflow scheme associa workflows a tipos de issue

---

### Fase 3 — Advanced Polish (P2 — 3 meses)

**Objetivo:** Funcionalidades avançadas e polimento para competitividade real.

| # | Entregável | Items |
|---|-----------|-------|
| F3.1 | **Campos custom completos** | 4.1–4.20: Todos os tipos de campo, field configuration, default values |
| F3.2 | **Componentes + Versions** | 1.1.4–1.1.5, 3.7, 3.9–3.11: Components, Versions, Resolution field |
| F3.3 | **Relatórios avançados** | 14.6–14.7, 14.9–14.11, 14.13, 14.15: Control chart, age report, resolution time, workload, time in status |
| F3.4 | **Board polish** | 6.1.4–6.1.9, 6.2.5–6.2.7: WIP limits, swimlanes, card layout, calendar/spreadsheet cross-project |
| F3.5 | **Groups + Audit log** | 16.6, 16.8–16.9: User groups, 2FA/TOTP, audit log centralizado |
| F3.6 | **Pages melhorias** | 21.3, 21.5–21.7, 21.11, 21.13–21.14, 21.16: Templates, inline comments, permissões, collab editing |
| F3.7 | **Notificação polish** | 17.1, 17.6, 17.9: Notification schemes, batch emails, Slack |
| F3.8 | **IA features** | 26.5–26.7: Duplicate detection, summarization, work descriptions |
| F3.9 | **Mobile / PWA** | 24.3–24.4, 24.6: PWA, responsive audit, WCAG |
| F3.10 | **SLA timers + Business hours** | 20.4, 20.11–20.12: Timer SLA, calendário de negócio, email channel |
| F3.11 | **CSV import melhorado** | 23.6: UI de mapeamento de colunas |
| F3.12 | **Export PDF/PNG** | 14.17, 21.11: PDF para relatórios e páginas |
| F3.13 | **Sprint scope tracking** | 8.12: Log de mudanças de scope mid-sprint |
| F3.14 | **GitLab + Build status** | 18.2, 18.6, 18.8: GitLab completo, CI status, code review status |
| F3.15 | **Admin polish** | 25.4–25.5, 25.9: Backup, health dashboard, custom branding |

---

### Fase 4 — Enterprise Scale (P2/P3 — 3 meses)

| # | Entregável | Items |
|---|-----------|-------|
| F4.1 | **Issue Type Schemes** | 2.3–2.5: Schemes reutilizáveis, screen schemes, sub-task types |
| F4.2 | **Cascading selects** | 4.8: Campos cascata (país→estado→cidade) |
| F4.3 | **Security levels** | 16.4: Segurança por issue individual |
| F4.4 | **Approvals no workflow** | 20.7: Etapa de aprovação com votação |
| F4.5 | **Timesheet semanal** | 19.9: Grid semanal com totais |
| F4.6 | **SLA escalation** | 20.10: Regras de escalation automáticas |
| F4.7 | **Editor macros** | 21.12: Block extensions (TOC, status badge, issue embed) |
| F4.8 | **Migration wizard** | 23.8: Wizard multi-step para importação com dry-run |
| F4.9 | **Session management** | 16.13: Ver/revogar sessões ativas |
| F4.10 | **Pack lifecycle** | 22.8: Install/uninstall/update de packs |

---

### Fase 5 — Portfolio & Scale (P3 — 3+ meses)

| # | Entregável | Items |
|---|-----------|-------|
| F5.1 | **Advanced Roadmaps / Plans** | 10.2.1–10.2.10: Plans cross-project, capacity planning, dependencies |
| F5.2 | **Initiative hierarchy** | 1.2.4, 10.2.8: Initiatives + custom hierarchy |
| F5.3 | **Field-level security** | 16.5: Controlo por campo |
| F5.4 | **Knowledge base portal** | 20.6: Pages como KB no Space |
| F5.5 | **Marketplace / Galeria de Packs** | 22.1: Galeria pública de packs com install |
| F5.6 | **Mobile apps** | 24.1–24.2: Verificar/adaptar apps mobile |
| F5.7 | **Whiteboards** | 21.15: Canvas de desenho |
| F5.8 | **Wallboard mode** | 13.11: Modo TV para standups |
| F5.9 | **Smart planning IA** | 26.8–26.9: Sprint suggestions, risk detection |
| F5.10 | **Import Asana/Trello** | 23.4–23.5: Importadores adicionais |

---

### Fase 6+ — Horizonte

| # | Entregável |
|---|-----------|
| F6.1 | Scenario planning (what-if) |
| F6.2 | Custom UI extensions (Forge-like) |
| F6.3 | Chat widget embeddable |
| F6.4 | Offline mode |
| F6.5 | Auto-scheduler (critical path) |
| F6.6 | Team-managed vs Company-managed projects |
| F6.7 | WASM sandbox para packs |

---

## 28. Contagem Final

| Categoria | Total items | ✅ Operis tem | 🟡 Parcial | ❌ Falta |
|-----------|------------|---------------|------------|---------|
| Hierarquia e Organização | 15 | 5 | 6 | 4 |
| Tipos de Issue | 7 | 3 | 2 | 2 |
| Campos nativos | 28 | 19 | 4 | 5 |
| Campos personalizados | 20 | 0 | 3 | 17 |
| Workflows | 12 | 1 | 1 | 10 |
| Boards e Vistas | 17 | 3 | 9 | 5 |
| Backlog e Priorização | 8 | 2 | 2 | 4 |
| Sprints e Agile | 12 | 3 | 5 | 4 |
| Épicos e Portfolio | 7 | 0 | 2 | 5 |
| Roadmaps avançados | 15 | 1 | 1 | 13 |
| Pesquisa e JQL | 9 | 2 | 1 | 6 |
| Filtros | 7 | 3 | 1 | 3 |
| Dashboards | 15 | 1 | 3 | 11 |
| Relatórios | 17 | 0 | 4 | 13 |
| Automação | 24 | 12 | 6 | 6 |
| Permissões | 14 | 3 | 5 | 6 |
| Notificações | 9 | 5 | 2 | 2 |
| DevOps | 11 | 2 | 3 | 6 |
| Time Tracking | 10 | 0 | 0 | 10 |
| Service Management | 13 | 0 | 4 | 9 |
| Documentação | 16 | 4 | 5 | 7 |
| Marketplace | 10 | 3 | 2 | 5 |
| Importação | 9 | 2 | 4 | 3 |
| Mobile | 9 | 4 | 2 | 3 |
| Administração | 9 | 2 | 3 | 4 |
| IA | 10 | 2 | 2 | 6 |
| **TOTAL** | **327** | **80 (24%)** | **81 (25%)** | **166 (51%)** |

---

## 29. Diferenciais Operis (sem equivalente Jira)

O Operis já tem features que o Jira **não oferece nativamente**:

| Feature Operis | Descrição | Jira equivalente |
|---------------|-----------|-----------------|
| 🔵 **Cliente 360** | CRM integrado: health snapshots, QBR, consultant allocation, FinOps, weekly briefings, narrativas | ❌ Inexistente |
| 🔵 **Custos Harness** | Atribuição de gasto de pipeline/CD a projeto/card | ❌ Inexistente |
| 🔵 **Assistente IA com RAG** | Chat com embeddings, 17+ tools internos, quality metrics, security audit | 🟡 Rovo (limitado) |
| 🔵 **MCP Server (676 ops)** | Protocolo para agentes IA externos (Cursor, Claude Desktop) | ❌ Inexistente |
| 🔵 **Motor automação com LLM** | Decisões por IA, graph triggers, packs, playbooks, DLQ, governance | 🟡 Jira Automation (sem IA) |
| 🔵 **Intake nativo** | Formulários de receção + triagem antes do backlog, sem produto extra | ❌ Precisa JSM (pago) |
| 🔵 **Board como squad hub** | Entidade Board agrega N projetos como equipa cross-funcional | 🟡 Board é só vista |
| 🔵 **Status Reports** por board | Relatórios de status com lembretes automáticos e histórico | ❌ Inexistente |
| 🔵 **Discord integration** | Slash commands nativos com LLM, streaming, audit | ❌ Inexistente |
| 🔵 **PRD Review** | Revisão de documentos de produto com guest links e workflow de aprovação | ❌ Inexistente |
| 🔵 **Self-hosted AGPL** | Controlo total dos dados, sem lock-in cloud, sem per-user pricing crescente | 🟡 Data Center acaba 2029 |
| 🔵 **Visão 360 workspace** | Dashboard cross-board de todos os projetos/clientes do workspace | ❌ Inexistente |

**Conclusão estratégica:** O Operis não precisa de copiar 100% do Jira. Precisa de fechar os gaps P0/P1 (Workflow, OQL, Time Tracking, Dashboards) mantendo e expandindo os diferenciais que o Jira nunca terá (Cliente 360, IA nativa, MCP, self-hosted).

---

*Documento de referência para roadmap de produto. Atualizar a cada sprint com progresso nas fases.*
