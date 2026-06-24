# 03 — No-Code Rule Builder (P0)

> Pré-requisito: [`00-VISAO-GERAL`](../00-VISAO-GERAL/).

## Visão

O Operis já tem um **motor de automação potente** (`apps/api/operis/automation/`:
compiler → dispatcher → executor, grafo JSON, packs, playbooks, DLQ, policy,
governance). O que falta é a **camada no-code acessível**: hoje a configuração é
demasiado técnica. Esta feature entrega o builder visual `WHEN → IF → THEN` ao
nível do Jira Automation, **compilando para o motor existente** — não cria motor
novo.

## Mapeamento ao roadmap

Cobre §15 (`15.1.1`–`15.1.24`): rule builder visual, triggers, conditions,
actions, branches, smart values, scheduled rules, templates, governança.

## Decisões-chave

| # | Decisão | Alternativa rejeitada |
| --- | --- | --- |
| 1 | Reusar `BoardAutomationRule` (graph JSON) + compiler/dispatcher/executor | Motor novo — duplicação massiva |
| 2 | Reusar o canvas React Flow da automação, com paleta no-code amigável | Editor novo |
| 3 | Catálogo de triggers/conditions/actions declarativo (registry) | Nós hard-coded |
| 4 | Smart values `{{issue.summary}}` via template engine, com escaping | Interpolação ingénua |
| 5 | Dry-run obrigatório antes de ativar (reusar `dry_run_event.py`) | Ativar sem teste |

## Escopo

**Inclui:** paleta no-code (triggers/conditions/actions com formulários),
catálogo declarativo, smart values, dry-run UI, templates de regra, governança
(rate-limit/circuit já existentes).

**Exclui:** o runtime de execução (já existe); workflow transitions (feature 01,
que pode disparar `fire_event` para cá).

## Fases

1. **F1 — Paleta + catálogo:** triggers/conditions/actions essenciais com UI de
   formulário por nó; salvar no `BoardAutomationRule.graph`.
2. **F2 — Smart values + branches:** template engine, if/else, lookup de issues.
3. **F3 — Templates + governança UI:** galeria de templates, métricas, DLQ
   visível, dry-run guiado.

## Ficheiros

- [01-modelo-de-dados.md](./01-modelo-de-dados.md)
- [02-contrato-de-api.md](./02-contrato-de-api.md)
- [03-frontend.md](./03-frontend.md)
- [04-seguranca.md](./04-seguranca.md)
- [05-clean-code-e-testes.md](./05-clean-code-e-testes.md)

## Reuso (quase tudo já existe)

- `db/models/board_automation.py` — `BoardAutomationRule`, `BoardAutomationRun`.
- `automation/compiler.py`, `dispatcher.py`, `executor.py`, `dry_run_event.py`.
- `automation/policy.py`, `governance.py`, `secrets.py`.
- Canvas e `automation-utils.ts` no frontend.
