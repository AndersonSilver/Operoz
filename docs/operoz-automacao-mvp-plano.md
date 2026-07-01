# Operoz — Automação interna (MVP) — Plano e questionário

Documento vivo para definir o **motor de automação nativo do Operoz** (antes Kortex / fork Plane Tech4Humans).  
Complementa o [roadmap MV3–MV6](./tech4humans-roadmap-mv3-mv5.md) e o [plano de boards](./tech4humans-board-config-mvp3-plano.md).

**Como usar este doc**

1. **[Respostas consolidadas](#respostas-consolidadas-questionário-fechado)** — decisões de produto (questionário fechado em 2026-05-19).
2. Secções técnicas (arquitetura, modelo, critérios de aceite) para implementação após **MV4 PRD**.
3. Histórico completo do questionário no final do ficheiro.

| Campo                  | Valor                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| **Produto**            | Operoz                                                                                          |
| **Capacidade**         | Motor de automação nativo (canvas + catálogo dinâmico)                                          |
| **Estado**             | **Spec técnica publicada** — ver [operoz-automacao-mvp-spec.md](./operoz-automacao-mvp-spec.md) |
| **Última atualização** | 2026-05-19                                                                                      |

---

## Respostas consolidadas (questionário fechado)

| #   | Tema                       | Decisão                                                                                      |
| --- | -------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | **Eventos**                | Issues, Status Report, módulos/projetos, comentários, utilizadores/convites                  |
| 2   | **Escopo das regras**      | Por **board**                                                                                |
| 3   | **Quem edita**             | **Admin do board**                                                                           |
| 4   | **Quem vê logs**           | Igual a quem edita (admin do board)                                                          |
| 5   | **Agendamento (cron)**     | **Depois do MVP** (Fase 1.1+)                                                                |
| 6   | **IA no Status Report**    | Resumo executivo **sempre** automático ao guardar (como hoje)                                |
| 7   | **Outras ações IA**        | Comentário em issue, sugerir prioridade, gerar descrição, template/prompt configurável       |
| 8   | **Canais**                 | In-app, e-mail, webhook, Slack/Teams, Jira remoto                                            |
| 9   | **n8n / Node-RED**         | **Não** no deploy padrão — só motor nativo Operoz                                            |
| 10  | **Quando começar dev**     | **Depois do MV4 (PRD)**                                                                      |
| 11  | **Prazo**                  | Sem prazo fixo — qualidade primeiro                                                          |
| 12  | **Gatilhos MVP**           | Issue criada, atualizada, mudança de estado; SR guardado/publicado; comentário adicionado    |
| 13  | **Filtros «Se»**           | **Catálogo dinâmico** — expor todos os filtros que o Operoz suportar                         |
| 14  | **Ações «Então»**          | **Catálogo dinâmico** — expor todas as ações disponíveis                                     |
| 15  | **UI**                     | **Canvas** (arrastar nós) **já no MVP** — não só formulário em passos                        |
| 16  | **Testar regra**           | **Dry-run** (simula, não altera dados)                                                       |
| 17  | **Limite de regras**       | **Sem limite** por board                                                                     |
| 18  | **Aprovação**              | **Não** — quem edita ativa direto                                                            |
| 19  | **Cenários pré-definidos** | **Não** — o utilizador monta as regras que quiser; entregar motor completo (backend + front) |

**Princípio de produto (stakeholder):** não entregar «receitas» ou templates de cenários Magalu; entregar **plataforma** para criar qualquer regra válida dentro do catálogo de gatilhos, filtros e ações.

---

## 1. Objetivo

Permitir que equipas configurem **regras dentro do Operoz** para reagir a eventos (issues, status report, etc.) e executar **ações** (alterar campos, notificar, webhooks, IA) **sem deploy de código** e **sem depender só de ferramentas externas**.

**Não é objetivo do MVP**

- Substituir n8n/Node-RED para integrações enterprise complexas de cada cliente.
- Oferecer um canvas livre com centenas de nós customizáveis (produto tipo n8n embutido).
- Executar código arbitrário (scripts) definido pelo utilizador nas regras.

---

## 2. Visão em uma frase

> «Quando X acontecer no Operoz, se Y for verdade, fazer Z» — com histórico de execução e permissões por workspace/projeto.

---

## 3. Contexto: o que o Operoz já tem

Base técnica atual (fork Plane / monorepo `plane/`):

| Peça existente                                                   | Uso potencial na automação                     |
| ---------------------------------------------------------------- | ---------------------------------------------- |
| **Django API** (`apps/api`)                                      | CRUD de regras, API de execução manual/teste   |
| **Celery + RabbitMQ**                                            | Fila de execução assíncrona, retries           |
| **Webhooks de saída**                                            | Ações «chamar sistema externo» ou integrar n8n |
| **RBAC** (Guest / Member / Admin + extensões board)              | Quem pode criar/editar/ativar regras           |
| **Issues, estados, módulos, Status Report**                      | Domínio dos gatilhos e ações                   |
| **IA (LLM)** (`ai-assistant`, resumo executivo no status report) | Ação «gerar texto / resumo»                    |

**Integrações externas (paralelas, não substituem motor nativo)**

- Plugin **Atlassian** (Jira / Confluence): backlog, status report, triagem — fluxos de _conteúdo_ entre sistemas.
- **n8n / Node-RED** (opcional no deploy): escape hatch para ERP, Slack avançado, etc.

---

## 4. O que o Jira Automation faz (referência)

O Jira **não** é um Node-RED completo dentro do produto. É sobretudo:

1. **Gatilho** — issue criada, transição, campo alterado, agendamento, webhook…
2. **Condições** — filtros sobre o contexto do evento.
3. **Ações** — mutações e notificações com catálogo **fechado**.
4. **Execução no servidor** — logs, limites, escopo por projeto.

A UI pode ser visual, mas o **modelo mental é regras**, não um grafo arbitrário.

**Alvo do Operoz (MVP):** mesmo modelo mental + **canvas visual no MVP** (React Flow ou equivalente), com catálogo dinâmico de nós (gatilho / filtro / ação).

---

## 5. Decisão estratégica: motor próprio vs ferramentas externas

| Abordagem                      | Quando usar                                          | No Operoz                                                       |
| ------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------- |
| **Motor nativo (recomendado)** | Regras de produto, auditáveis, UX integrada          | **Core do MVP**                                                 |
| **n8n (sidecar)**              | Integrações por cliente, ERP, fluxos longos          | **Fora do MVP** — decisão: só motor nativo                      |
| **Node-RED**                   | IoT, pipelines técnicos, nodes npm muito específicos | Só se houver requisito claro; não é o default                   |
| **Código no monorepo**         | Lógica crítica, invariantes, compliance              | Status report, RBAC, IA ao guardar — **permanece em Python/TS** |

**Recomendação:** construir **motor próprio em fases**; não embutir n8n/Node-RED como biblioteca dentro de `apps/api` / `apps/web`.

---

## 6. Roadmap em três fases

### Fase 1 — MVP (motor + canvas)

**Entrega:** backend completo + front com **canvas**; catálogos dinâmicos de gatilhos, filtros e ações; **sem** cenários/templates pré-montados.

| Componente     | Descrição                                                                       |
| -------------- | ------------------------------------------------------------------------------- |
| **Modelo**     | `AutomationRule` + JSON grafo (nós + arestas) compilável para execução          |
| **Catálogo**   | API `GET /automation/catalog` — triggers, filters, actions registados no código |
| **Executor**   | Celery, idempotente, `AutomationRun` + dry-run                                  |
| **UI**         | Lista por board, canvas (React Flow), ativar/desativar, dry-run, logs           |
| **Permissões** | Admin do board                                                                  |

**Estimativa orientativa:** maior que o plano «só formulário» — ver spec técnica; prazo **sem fixo** (qualidade primeiro).

### Fase 1.1 — Agendamento

| Componente | Descrição                                                 |
| ---------- | --------------------------------------------------------- |
| **Cron**   | Gatilho `schedule.cron` + timezone por board ou workspace |

### Fase 2 — Motor avançado (só com demanda)

- Branches, variáveis de contexto (`{{issue.title}}`), mais integrações.
- Possível ponte: regras simples nativas + fluxos **n8n** para enterprise.

```text
Fase 1 (MVP)     Canvas + executor + catálogo dinâmico + dry-run + logs
      │
      ▼
Fase 1.1         Agendamento (cron)
      │
      ▼
Fase 2           Branches avançados, variáveis, marketplace (opcional)
```

---

## 7. Arquitetura técnica (proposta)

```text
┌─────────────────┐     evento de domínio      ┌──────────────────┐
│  API / signals  │ ─────────────────────────► │  Automation      │
│  (issue save,   │                            │  dispatcher      │
│   publish SR…)  │                            └────────┬─────────┘
└─────────────────┘                                     │
                                                          ▼
                                               ┌──────────────────┐
                                               │  Celery:         │
                                               │  evaluate + run  │
                                               └────────┬─────────┘
                                                          │
                    ┌─────────────────────────────────────┼─────────────────────────┐
                    ▼                     ▼               ▼                         ▼
              Atualizar issue      Notificação      Webhook / n8n              Ação IA
              (serviços internos)  (e-mail / in-app)  (HTTP)                  (LLM existente)
```

**Princípios**

- Regras **nunca** executam síncronas no request HTTP do utilizador (exceto «testar regra» com timeout curto).
- Cada **ação** = função registada no código (catálogo fechado), sem `eval`.
- **Contexto** do evento: `before` / `after`, `actor`, `workspace_id`, `project_id`, payload tipado.
- **Auditoria:** cada run com status, duração, erro por passo.

**Stack sugerida**

| Camada             | Tecnologia                                           |
| ------------------ | ---------------------------------------------------- |
| API + modelo       | Django (`plane/db/models`, serializers, permissions) |
| Fila               | Celery (já em uso)                                   |
| Front MVP          | Next.js (`apps/web`), formulário em passos           |
| Front Fase 2       | React Flow                                           |
| Integração externa | Webhooks existentes + env `N8N_WEBHOOK_*` (opcional) |

---

## 8. Modelo de dados (rascunho)

> Ajustar após respostas ao questionário.

```text
AutomationRule
  - id, workspace_id, project_id (nullable = regra global no workspace)
  - name, description
  - enabled: bool
  - definition: JSON  # trigger, conditions, actions
  - created_by, updated_at

AutomationRun
  - id, rule_id
  - trigger_event_id / correlation_id
  - status: pending | success | failed | skipped
  - started_at, finished_at
  - context_snapshot: JSON
  - steps_log: JSON[]   # { step, status, error?, duration_ms }
```

**Idempotência:** chave `(rule_id, event_id)` para não executar duas vezes o mesmo evento.

---

## 9. Catálogo inicial proposto (a validar contigo)

### 9.1 Gatilhos (triggers) — candidatos MVP

| ID proposto               | Descrição                                                     |
| ------------------------- | ------------------------------------------------------------- |
| `issue.created`           | Issue criada                                                  |
| `issue.updated`           | Issue atualizada (campo específico opcional)                  |
| `issue.state.changed`     | Transição de estado                                           |
| `status_report.saved`     | Relatório guardado (rascunho)                                 |
| `status_report.published` | Relatório publicado                                           |
| `schedule.cron`           | Agendamento (ex.: segunda 9h) — **confirmar se entra no MVP** |

### 9.2 Condições (conditions) — candidatos MVP

| ID proposto          | Descrição                                 |
| -------------------- | ----------------------------------------- |
| `project.equals`     | Projeto = X                               |
| `module.equals`      | Módulo = X                                |
| `issue.state.equals` | Estado = Y                                |
| `issue.type.equals`  | Tipo de card = Z                          |
| `issue.field.equals` | Campo customizado / prioridade / assignee |
| `user.role.is`       | Papel do ator (admin, …)                  |

### 9.3 Ações (actions) — candidatos MVP

| ID proposto                                | Descrição                                         |
| ------------------------------------------ | ------------------------------------------------- |
| `issue.set_field`                          | Alterar campo (estado, assignee, prioridade, …)   |
| `issue.add_comment`                        | Comentário automático                             |
| `notification.send`                        | In-app / e-mail (conforme infra existente)        |
| `webhook.post`                             | POST para URL (ou fila n8n)                       |
| `ai.generate_text`                         | Chamar LLM com template (ex.: resumo, comentário) |
| `status_report.generate_executive_summary` | Reutilizar fluxo IA do status report              |

---

## 10. UI/UX (Fase 1)

**Ecrãs mínimos**

1. **Lista de regras** — por projeto ou workspace; filtro ativas/inativas.
2. **Editor em passos** — (1) Gatilho (2) Condições, opcional (3) Ações.
3. **Detalhe de execução** — últimas runs, erro legível.
4. **Testar regra** — botão com payload de exemplo (issue fictícia ou última issue).

**Permissões (proposta default)**

- Criar/editar/ativar: **Admin** do workspace (ou papel board customizado futuro — ver MV5).
- Ver logs: Admin + opcionalmente Member.

> Confirmar no questionário.

---

## 11. Relação com Status Report e IA

Hoje o Status Report já gera **resumo executivo com IA ao guardar** (observações → LLM). Na automação:

| Cenário                                 | Implementação sugerida                                        |
| --------------------------------------- | ------------------------------------------------------------- |
| Manter comportamento fixo no produto    | Código atual em `project-status-report-detail`                |
| Cliente quer «só publicar às sextas»    | Regra `schedule` + `status_report.publish` ou ação agendada   |
| Cliente quer «outro prompt» por projeto | Ação `ai.generate_text` com template na regra (Fase 1 ou 1.1) |

**Decisão pendente:** IA no guardar continua **sempre** ou passa a ser **só se existir regra**? → Questionário, bloco 4.

---

## 12. Integração Atlassian e n8n

| Ferramenta                 | Papel                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------ |
| **Atlassian (MCP/skills)** | Criar issues/backlog/Confluence a partir de specs; **não** substitui regras internas |
| **n8n**                    | Cliente com ERP/Slack complexo: webhook do Operoz → fluxo n8n                        |
| **Webhooks Plane**         | Já existem; documentar payloads estáveis para automação externa                      |

---

## 13. Riscos e mitigação

| Risco                                         | Mitigação                                      |
| --------------------------------------------- | ---------------------------------------------- |
| Escopo inflacionar (canvas antes de executor) | Fase 1 sem React Flow                          |
| Loops infinitos (regra dispara regra)         | Profundidade máxima, idempotência, debounce    |
| Segurança em webhooks                         | Allowlist já existente (`WEBHOOK_ALLOWED_IPS`) |
| Performance                                   | Celery, limite de regras ativas por projeto    |
| Licença n8n embutido                          | Não embutir; sidecar opcional                  |

---

## 14. Fora de escopo (MVP)

- Cenários / templates de automação pré-configurados (o utilizador cria as regras).
- n8n ou Node-RED no deploy padrão.
- Agendamento cron (Fase 1.1).
- Marketplace de integrações de terceiros.
- Scripting (Python/JS) nas regras.
- Aprovação de regras antes de ativar.
- Sincronização bidirecional completa Jira ↔ Operoz (projeto à parte; ação pontual Jira pode entrar no catálogo).

---

## 15. Critérios de aceite do MVP (Fase 1)

- [ ] Admin do **board** cria regra no **canvas** (gatilho + ≥1 ação; filtros opcionais).
- [ ] Catálogo UI lista **todos** os gatilhos/filtros/ações registados no backend.
- [ ] Regra executa em background em &lt; 30s (p95) para fluxo simples.
- [ ] **Dry-run** mostra passos sem mutar dados.
- [ ] Log de execução visível (sucesso/erro por nó).
- [ ] Regra desativada não executa.
- [ ] Gatilhos MVP: issue (criar/atualizar/estado), SR (guardar/publicar), comentário.
- [ ] Canais de ação: in-app, e-mail, webhook, Slack/Teams, Jira, IA (comentário, prioridade, descrição, template).
- [ ] Resumo executivo do Status Report continua automático ao guardar (fora das regras).

---

## 16. Posição no roadmap Operoz

**Decisão:** desenvolvimento da automação **após MV4 (PRD)**.

```text
MV3 Status Report
        │
        ▼
MV4 PRD
        │
        ▼
MV? Automação Fase 1 (este documento)  ← início após PRD estável
        │
        ├── MV5 RBAC custom (papel «admin board» pode evoluir)
        └── MV6 Rebranding Operoz (ex-Kortex)
```

---

# Questionário de produto (respostas do stakeholder)

> **Fechado em 2026-05-19** (chat + seleção por opções). Resumo em [Respostas consolidadas](#respostas-consolidadas-questionário-fechado).

---

## Bloco 1 — Escopo de entidades

**1.1** A automação no MVP deve reagir a quê?

- [x] Issues / cards
- [x] Status Report
- [x] Módulos / projetos
- [x] Comentários
- [x] Utilizadores / convites

**1.2** As regras são configuradas por:

- [x] **Board / hub**

---

## Bloco 2 — Quem edita e vê

**2.1** Quem pode **criar e editar** regras? → **Admin do board**

**2.2** Quem pode **ver logs de execução**? → **Os mesmos (admin do board)**

---

## Bloco 3 — Agendamento e tempo

**3.1** Regras agendadas no MVP? → **Fase 1.1** (depois do MVP)

**3.2** Fuso horário → _a definir na spec_ (quando implementar cron)

---

## Bloco 4 — IA e Status Report

**4.1** Resumo executivo ao guardar → **Sempre automático** (comportamento atual)

**4.2** Outras ações IA no catálogo → Comentário em issue; sugerir prioridade; gerar descrição; template/prompt configurável

---

## Bloco 5 — Notificações e integrações

**5.1** Canais → In-app, e-mail, webhook, Slack/Teams, Jira remoto

**5.2** n8n no deploy → **Não** — só motor nativo Operoz

---

## Bloco 6 — Prioridade no roadmap

**6.1** Início do desenvolvimento → **Depois do MV4 (PRD)**

**6.2** Prazo → **Sem prazo fixo** (qualidade primeiro)

---

## Bloco 7 — Catálogo

**Gatilhos MVP** → `issue.created`, `issue.updated`, `issue.state.changed`, `status_report.saved`, `status_report.published`, `comment.added`

**Filtros** → **Todos** os que o backend expuser (catálogo dinâmico)

**Ações** → **Todas** as que o backend expuser (catálogo dinâmico)

---

## Bloco 8 — UX e sandbox

**8.1** Editor → **Canvas** (arrastar nós) no MVP

**8.2** Testar regra → **Dry-run**

---

## Bloco 9 — Compliance e limites

**9.1** Limite de regras ativas → **Sem limite**

**9.2** Aprovação antes de ativar → **Não**

---

## Bloco 10 — Casos de uso

**Decisão:** não entregar cenários/templates pré-definidos. O utilizador monta as regras no canvas; entregar **motor completo** (backend + frontend + catálogo).

---

# Registro de decisões

| Data       | Decisão                                             | Motivo      |
| ---------- | --------------------------------------------------- | ----------- |
| 2026-05-19 | Motor nativo; sem n8n no deploy                     | Stakeholder |
| 2026-05-19 | Canvas no MVP (não só formulário)                   | Stakeholder |
| 2026-05-19 | Catálogo dinâmico (todos filtros/ações disponíveis) | Stakeholder |
| 2026-05-19 | Sem cenários pré-definidos                          | Stakeholder |
| 2026-05-19 | Início após MV4 PRD                                 | Stakeholder |
| 2026-05-19 | Escopo por board; admin do board edita              | Stakeholder |

---

# Próximos passos

1. ~~Escrever spec técnica~~ → [operoz-automacao-mvp-spec.md](./operoz-automacao-mvp-spec.md).
2. Validar dependências (§15 da spec): `board_id` a partir de project/issue, user bot.
3. Criar épico Jira pós-MV4 PRD com sprints A–D da spec.
4. Spike React Flow (opcional antes de Sprint C).

---

# Histórico de revisões

| Versão | Data       | Autor | Notas                                        |
| ------ | ---------- | ----- | -------------------------------------------- |
| 0.1    | 2026-05-19 | —     | Rascunho inicial + questionário              |
| 0.2    | 2026-05-19 | —     | Questionário fechado; respostas consolidadas |

---

# Links relacionados

- [Roadmap MV3–MV6](./tech4humans-roadmap-mv3-mv5.md)
- [Plano board config / fases](./tech4humans-board-config-mvp3-plano.md)
- [Rebranding (Kortex → Operoz)](./tech4humans-rebranding-remocao-plane.md)
- Código Status Report + IA: `apps/web/core/components/project/status-report/`
- Webhooks API: `apps/api/operoz/app/views/webhook/`
