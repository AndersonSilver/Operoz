# Regras — Harness Engineering

Regras obrigatórias para agentes no loop **MCP + monorepo Operis**. Complementam `Operis/.cursor/rules/operoz-orchestrator.mdc` e `OPEROZ ENGENHARIA/ANTI_PATTERNS.md`.

Regras Cursor (`.mdc`): `.cursor/rules/harness-orchestrator.mdc`, `harness-backlog-mcp.mdc`, `harness-verification.mdc`.

## Princípios

| #   | Regra                       | Detalhe                                                                                                 |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | **Backlog no Operoz**       | Estado de cards/módulos vem do projeto **OPEROZDP** (workspace `operoz`), não de memória do chat        |
| 2   | **MCP antes de supor**      | Listar módulos/issues via MCP antes de planear; não inventar IDs nem estados                            |
| 3   | **Verificar antes de Done** | Testes/lint passando **antes** de marcar card ou módulo como concluído                                  |
| 4   | **Escopo mínimo**           | Um card (ou conjunto coeso) por iteração; sem refactors não pedidos                                     |
| 5   | **Fixtures canónicas**      | Git/Harness: `tests/fixtures/github_webhook_pr.json`, `harness_cost_report.json` — nunca JSON inventado |
| 6   | **Português ao utilizador** | Respostas em pt-BR; código e identificadores em inglês                                                  |
| 7   | **Marca Operoz**            | Copy e docs dizem **Operoz**; paths legados `operis` no código                                          |

## Gates (não saltar)

```text
G0 — Contexto MCP     → operis_get_capabilities / listar módulo alvo
G1 — Plano mínimo     → ficheiros + critério de aceite (3–5 bullets)
G2 — Implementação    → regras OPEROZ ENGENHARIA conforme camada
G3 — Verificação      → pytest / pnpm check:types nos pacotes tocados
G4 — Backlog          → atualizar COMPLETED_CARD_TITLES + mark_operoz_cards_done
G5 — Report           → resumo: o que mudou, testes, cards Done, próximo módulo
```

**Proibido** marcar Done em G4 sem evidência de G3.

## Roteamento técnico (herdado do orquestrador Operoz)

| Camada        | Regra Operoz             | Skill                                    |
| ------------- | ------------------------ | ---------------------------------------- |
| `apps/api/**` | `operoz-backend-django`  | `OPEROZ ENGENHARIA/DESENVOLVEDOR SENIOR` |
| `apps/web/**` | `operoz-frontend-design` | `DESIGN SISTEMA` / `EXPERIÊNCIA JIRA`    |
| Integrações   | `operoz-integrations`    | `OPEROZ FLUXO/CONTEXTO`                  |
| Anti-patterns | `operoz-anti-patterns`   | `ANTI_PATTERNS.md`                       |

## Backlog Plataforma Violenta (referência)

| Constante     | Valor                                                  |
| ------------- | ------------------------------------------------------ |
| Workspace     | `operoz`                                               |
| Projeto       | `OPEROZDP`                                             |
| Prefixo cards | `[ OPEROZ ]`                                           |
| Seed          | `seed_operoz_plataforma_violenta`                      |
| Mark done     | `mark_operoz_cards_done --workspace operoz`            |
| Lista Done    | `COMPLETED_CARD_TITLES` em `mark_operoz_cards_done.py` |

## Harness (custos de pipeline) vs Harness Engineering

- **Harness Engineering**: disciplina do **agente** — loop MCP + backlog + gates.
- **Harness (produto)**: custos de pipeline/CD no Operoz — `operoz-integrations.mdc`.

Não confundir os dois domínios.
