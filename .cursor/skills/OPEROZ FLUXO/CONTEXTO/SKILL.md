---
name: operoz-contexto
description: >-
  Contexto de produto Operoz: gestão de projetos, squads e custos com Git e
  Harness. Webhooks Git, mapeamento de métricas de custo, modelo de domínio e
  tom em português. Usar em qualquer tarefa no monorepo.
---

# Contexto de negócio — Operoz

Skill de **inteligência de produto e integrações**. Aplicar com `.cursor/rules/operoz-integrations.mdc` + backend/anti-patterns.

## Marca e tom

- Produto: **Operoz** — SaaS de gestão de **projetos**, **squads (boards)** e **custos**, com integração **Git** e **Harness**.
- Documentação, PRs, UI e respostas ao utilizador em **português** (salvo pedido contrário).
- Código e nomes técnicos em inglês quando for convenção do repositório.
- Monorepo legado pode usar prefixos `operis` em paths (`apps/api/operis`); a marca visível é **Operoz**.

---

## Modelo de domínio

| Conceito | Significado Operoz |
|----------|-------------------|
| Workspace | Organização / tenant (isolamento total de dados) |
| Board | Squad ou carteira de entrega |
| Projeto | Frequentemente = **cliente** (Cliente 360: 1 projeto = 1 cliente) |
| Módulo | Frente de entrega dentro do cliente |
| Issue / card | Unidade de trabalho rastreável |
| Ciclo / sprint | Janela de planeamento do board |
| Status report | Relatório periódico para stakeholders |
| Integração Git | Repo ligado a projeto/board — eventos alimentam cards e métricas |
| Custo Harness | Gasto de pipeline/CD atribuído a projeto, módulo ou card |

---

## Webhooks Git (entrada)

### Objetivo

Ligar atividade de repositório ao trabalho visível no Operoz: commits, PRs, branches, deploys — sem duplicar o Git como fonte de verdade.

### Fluxo alvo

```text
Git Provider (GitHub / GitLab / …)
  → POST webhook (assinatura HMAC)
  → API Operoz (endpoint dedicado por integração)
  → validação + fila Celery
  → normalização de evento (payload → DTO interno)
  → correlação: repo_id + branch/PR → project_id / issue_id
  → persistência (atividade + opcional atualização de card)
  → webhooks de saída Operoz (se configurados)
```

### Regras de implementação

- **Idempotência:** `delivery_id` ou hash `(event_type, ref, sha)` — ignorar duplicados.
- **Correlação:** mapa `repository_url` → `project`; labels/branch `OP-123` ou título `fix(WEB-123)` para issue.
- **Segurança:** validar secret; rejeitar payloads oversized; rate limit por integração.
- **Observabilidade:** `WebhookLog` com status; nunca guardar tokens em claro.
- Código de referência outbound: `apps/api/operis/bgtasks/webhook_task.py`, modelos `db/models/webhook.py`.
- **Fixtures canónicos (não inventar payloads):** `tests/fixtures/github_webhook_pr.json`, `tests/fixtures/harness_cost_report.json`.

### Eventos mínimos úteis

| Evento Git | Efeito Operoz |
|------------|----------------|
| `push` | Atividade no card ligado; opcional mover estado |
| `pull_request` opened/merged | Link PR ↔ issue; comentário automático |
| `deployment` | Marcar ambiente; disparar automação |
| `workflow_run` (CI) | Início/fim de pipeline para custo Harness |

---

## Harness e métricas de custo

### Objetivo

Responder: **quanto esta squad/cliente/pipeline custou** e **tendência no período** — para PM, engenharia e financeiro.

### Fluxo alvo

```text
Harness (pipeline / stage / cloud cost)
  → export API ou webhook de billing
  → ingestão Operoz (job agendado ou evento)
  → normalização: { pipeline_id, stage, duration, cost_usd, currency, timestamp }
  → atribuição: Harness project ↔ Operoz project/board
  → agregação: dia / sprint / módulo / cliente
  → UI: Cliente 360, dashboard board, detalhe issue (se alocado)
```

### Mapeamento de atribuição (prioridade)

1. **Tag explícita** no Harness alinhada a `project.identifier` ou `board.slug`.
2. **Repo Git** já ligado ao mesmo projeto.
3. **Regra manual** no Operoz (admin board): pipeline pattern → projeto.
4. **Fallback:** custo «não alocado» do workspace (visível só para admins).

### Modelo de dados (conceitual)

- `CostSnapshot`: valor, moeda, período, origem (`harness`), chave externa.
- `CostAllocation`: liga snapshot a `project_id` / `module_id` / `issue_id` (opcional).
- Conversão de moeda: taxa do workspace na data do snapshot (não recalcular retroativamente sem migração).

### Métricas expostas na UI

| Métrica | Uso |
|---------|-----|
| Custo período (R$) | Cliente 360, overview board |
| Custo por pipeline | Drill-down engenharia |
| Custo por issue (se alocado) | Detalhe card |
| Burn vs orçamento | Alertas e filtros «acima do orçamento» |

---

## Stack do monorepo

- Web: `apps/web` (React), pacotes `packages/*`
- API: `apps/api` (Django), workers Celery + RabbitMQ
- Live/collab: `apps/live`
- MCP: `mcp-server/` (agentes Cursor contra API hospedada)
- Comandos: `pnpm dev`, `pnpm check`, `pnpm fix`
- Boards: `VITE_ENABLE_BOARDS`

## Documentação interna

- `docs/operis-*` — specs (automação, Cliente 360, MCP)
- `docs/tech4humans-*` — boards, webhooks, roadmap
- `docs/arquitetura-devops-azure.md` — filas, deploy, segurança

---

## Ao implementar

- Reutilizar MobX/SWR e `core/services` existentes.
- Escopo mínimo; feature flags para integrações incompletas.
- i18n: `packages/i18n` (pt-BR + en).
- Identificadores em commits/PRs: `WEB-`, `API-`, `OP-` — preservar em release notes.

## Skills relacionadas

| Pasta | Uso |
|-------|-----|
| `OPEROZ ENGENHARIA/DESENVOLVEDOR SENIOR` | API, segurança, queries |
| `OPEROZ ENGENHARIA/DESIGN SISTEMA` | dashboards de custo |
| `OPEROZ FLUXO/DESCRIÇÃO PR` | entregas de integração |
| `OPEROZ FLUXO/RELEASE NOTES` | comunicar valor Git/custo |
