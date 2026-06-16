---
name: harness-engineering-operoz
description: >-
  Harness de engenharia Operoz via MCP Operis: executar backlog OPEROZDP
  (implementar, testar, marcar cards Done, avançar módulos), consultar
  issues/módulos pelo MCP e respeitar gates de verificação. Usar quando o
  utilizador pedir para avançar módulos Operoz, sincronizar backlog, marcar
  cards Done, trabalhar na Plataforma Violenta/assistente, ou orquestrar
  desenvolvimento com MCP Operoz.
---

# Harness Engineering — Operoz + MCP

Skill de **orquestração de agente** para desenvolvimento guiado pelo backlog no Operoz. O MCP Operis é o painel de controlo; o código vive em `Operis/`.

**Ler também:** [RULES.md](RULES.md) · [references/mcp-operoz.md](references/mcp-operoz.md) · [prd-review-client-upload.md](prd-review-client-upload.md)  
**Regras:** `.cursor/rules/harness-*.mdc`  
**Skills irmãs (código):** `Operis/.cursor/skills/OPEROZ ENGENHARIA/SKILL.md` (UX antes de UI), `DESIGN SISTEMA/`, `OPEROZ FLUXO/`

## Pré-requisitos

1. MCP `operis` configurado (`.cursor/mcp.json` ou `mcp.json.enterprise.example`) e API a responder (`GET /api/instances/` → 200)
2. Monorepo em `Operis/` com Docker (`api`, `db`, `redis`, `mq`) e `pnpm dev` para web
3. Projeto backlog seedado: `OPEROZDP` no workspace `operoz`

Setup: [`.cursor/README.md`](../../README.md)

## Loop principal (obrigatório)

```text
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│ 1. Descobrir │ → │ 2. Implementar│ → │ 3. Verificar │ → │ 4. Backlog   │
│    (MCP)     │    │  (monorepo)  │    │   (testes)   │    │  (mark done) │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
```

### 1. Descobrir (MCP)

Antes de codar:

1. Chamar `operis_get_capabilities` ou `operis_list_operations` com `domain` relevante
2. Identificar **módulo alvo** (ex. `Fase 2 — RAG: Retrieval e segurança`) e cards pendentes
3. Confirmar constantes: workspace `operoz`, projeto `OPEROZDP`, prefixo `[ OPEROZ ]`

Se MCP indisponível: informar o utilizador e usar `mark_operoz_cards_done --dry-run` + leitura do seed — **não inventar** progresso.

### 2. Implementar

- Activar regras/skills da camada (`Operis/.cursor/rules/operoz-orchestrator.mdc`)
- Escopo = cards do módulo actual; diff mínimo
- Assistente/RAG: `Operis/apps/api/operis/assistant/`, migrations `db/migrations/`
- Frontend assistente: MobX em `apps/web/core/store/assistant/` (não Zustand)

### 3. Verificar (gate — bloqueante)

Regra: `harness-verification.mdc`

| Camada         | Comando típico                                                                          |
| -------------- | --------------------------------------------------------------------------------------- |
| API assistente | `pytest operis/tests/unit/assistant operis/tests/contract/app/test_assistant_app.py -q` |
| Tipos web      | `pnpm check:types` nos pacotes tocados                                                  |
| Migration      | `python manage.py migrate` no container `api`                                           |

**Sem output verde, não avançar para passo 4.**

**Antes de push/PR/deploy em `preview`:** gate adicional `harness-ci-parity-before-push.mdc` (ler workflow + rodar web-build, api-tests, mcp-build com env do CI).

### 4. Backlog

Regra: `harness-backlog-mcp.mdc`

1. Acrescentar títulos a `COMPLETED_CARD_TITLES` em  
   `Operis/apps/api/operis/db/management/commands/mark_operoz_cards_done.py`
2. Se módulo inteiro concluído, entrada em `MODULE_STATUS_WHEN_ALL_DONE`
3. Executar:

```bash
docker compose -f Operis/docker-compose-local.yml exec api \
  python manage.py mark_operoz_cards_done --workspace operoz
```

### 5. Reportar ao utilizador

Resumo em português: módulo/cards, evidência de testes, total Done, próximo módulo.

## MCP — atalhos

| Intenção          | Acção                               |
| ----------------- | ----------------------------------- |
| Ver ferramentas   | `operis_list_operations` + `domain` |
| Login app         | `operis_sign_in`                    |
| Módulos           | `operis_list_modules_app`           |
| Mudar estado card | `operis_update_issue_app`           |
| Lote Done         | `mark_operoz_cards_done`            |

Detalhe: [references/mcp-operoz.md](references/mcp-operoz.md)

## O que não fazer

Ver [RULES.md](RULES.md).
