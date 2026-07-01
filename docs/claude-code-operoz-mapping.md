# Mapeamento Claude Code → Operoz (referência)

Documento de **referência arquitetural**: como conceitos do ecossistema [Claude Code](https://code.claude.com/docs/en/overview) foram traduzidos para a Plataforma Violenta / Operoz.

> Status: implementação concluída nas Fases 3–5. Este ficheiro não descreve trabalho pendente — apenas o mapa conceito → código.

## Mapa rápido

| Claude Code                         | Operoz                                       | Fase     | Código / doc                                                           |
| ----------------------------------- | -------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| Plugin manifest (`.claude-plugin/`) | **Automation Pack** (`pack.json`)            | 4        | [packs-authoring.md](./packs-authoring.md), `operoz/automation/packs/` |
| Commands (slash workflows)          | **Templates one-click** (galeria)            | 3.4      | `board-automation-templates-gallery.tsx`, API templates                |
| Agents (subagentes)                 | **Subagentes + `parallel.fan_out`**          | 5.5, 3.7 | `operoz/automation/subagents.py`, `executor_advanced.py`               |
| Skills (`SKILL.md`)                 | **Board Playbooks**                          | 3.3      | `operoz/playbooks/`, `BoardPlaybook` model                             |
| Hooks Pre/Post/Stop                 | **Lifecycle hooks**                          | 3.1      | `hooks_registry.py`, `BoardAutomationHook`                             |
| MCP servers                         | **`action.mcp_call` + `action.operoz_tool`** | 5.3      | `catalog/actions.py`, [operoz-mcp.md](./operoz-mcp.md)                 |
| Ralph loop (iterar até completar)   | **`action.retry_until`**                     | 3.7      | `catalog/actions.py`, `executor.py`                                    |
| security-guidance (PreToolUse)      | **Policy engine (PreAction)**                | 3.2      | `operoz/automation/policy.py`, `BoardAutomationPolicy`                 |
| Confidence scoring (code-review)    | **`decision.llm`** + threshold               | 5.1      | `catalog/decisions.py`, `llm_decision.py`                              |

---

## REF — Plugin manifest → Automation Pack

**Claude Code:** `plugin.json` / manifest com permissões, hooks e comandos empacotados.

**Operoz:** `packs/automation-packs/<nome>/pack.json` instalável por board.

```text
operoz-pack-exemplo/
├── pack.json          # name, version, permissions, hooks, rules
├── hooks/hooks.json
└── playbooks/         # opcional
```

- Instalação: `POST .../boards/{board}/automation/packs/install/`
- Sandbox: sem Python arbitrário — `handler_ref` built-in only
- UI galeria: `/{workspace}/automacao/packs`

**Ver:** [packs-authoring.md](./packs-authoring.md), schema `packs/automation-packs/schema.json`

---

## REF — Commands → Templates one-click

**Claude Code:** `/command` dispara workflow pré-definido.

**Operoz:** Galeria de **templates de automação** — grafos prontos instaláveis com um clique no editor do board.

- Frontend: `board-automation-templates-gallery.tsx`
- Backend: templates oficiais no catálogo + regras seed por pack
- Chat: `propose_automation_rule` / `propose_automation_pack_install` para instalação conversacional

**Ver:** módulo seed «Fase 3 — Galeria de Templates de Automação»

---

## REF — Agents → Subagentes + fan-out

**Claude Code:** subagentes especializados delegados pelo agente principal.

**Operoz:**

| Peça                               | Função                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `parallel.fan_out`                 | Ramifica execução com `join_policy` all/any                              |
| `operoz/automation/subagents.py`   | `parallel_triage_classifiers` — classificadores LLM em paralelo          |
| Assistente `agent_orchestrator.py` | Scaffold decomposição de queries (flag `ASSISTANT_ORCHESTRATOR_ENABLED`) |

**Ver:** `executor_advanced.py`, testes `test_llm_decision.py`

---

## REF — Skills → Board Playbooks

**Claude Code:** `SKILL.md` carregado lazy com procedimentos e referências.

**Operoz:** **Board Playbooks** — conhecimento procedural por board injetado em automação e chat.

- Modelo: `BoardPlaybook` (intents, snippet markdown)
- Resolver: `operoz/playbooks/resolver.py`
- Lifecycle: `playbooks/lifecycle.py` — injeção em `build_execution_context` e `build_system_prompt`

**Ver:** testes `operoz/tests/unit/playbooks/`

---

## REF — Hooks Pre/Post → Lifecycle hooks

**Claude Code:** `hooks.json` com `PreToolUse`, `PostToolUse`, etc.

**Operoz:** hooks no executor de automação + hooks embutidos em packs.

| Fase executor          | Equivalente                            |
| ---------------------- | -------------------------------------- |
| PreDispatch            | Antes do outbox                        |
| PreAction              | Antes de cada nó action (≈ PreToolUse) |
| PostAction             | Depois de cada action                  |
| OnFailure / OnComplete | Fim de run                             |

- Registry: `operoz/automation/hooks_registry.py`
- Persistência: `BoardAutomationHook`
- UI: settings automação do board → aba Hooks

---

## REF — MCP → action.mcp_call + operoz_tool

**Claude Code:** servidores MCP expõem tools externas ao agente.

**Operoz (dois níveis):**

| Camada                                     | Uso                                             |
| ------------------------------------------ | ----------------------------------------------- |
| **MCP externo** (`mcp-server/`, 379 tools) | Cursor, agentes fora do produto                 |
| **`action.mcp_call`**                      | Grafo de automação chama operação MCP           |
| **`action.operoz_tool`**                   | Grafo chama subset curado do assistente         |
| **Assistente in-app**                      | ~17 tools com permission gate (não espelha 379) |

**Ver:** [operoz-mcp.md](./operoz-mcp.md), [assistant-adrs.md](./assistant-adrs.md) (ADR-003)

---

## REF — Ralph loop → retry_until

**Claude Code:** loop «Ralph» — repetir até critério de sucesso.

**Operoz:** nó **`action.retry_until`** no grafo.

- Config: `max_iterations`, condição de saída no ramo conectado
- Validação: `validator.py` exige `max_iterations ≥ 1`
- Executor trata iterações no path de saída (stub no catálogo; lógica no executor)

**Ver:** `catalog/actions.py` (`action.retry_until`)

---

## REF — security-guidance → Policy engine

**Claude Code:** hook PreToolUse bloqueia ações inseguras antes da execução.

**Operoz:** **Policy engine** avaliada em **PreAction**.

- Modelo: `BoardAutomationPolicy` (allowlist URLs, limites script, dry-run)
- `evaluate_pre_action_policy()` em `policy.py`
- Executor: `_run_policy_pre_action()` → step `blocked_by_policy` no histórico

**Ver:** `operoz/automation/policy.py`, migration `0153_board_automation_policy`

---

## REF — confidence scoring → decision.llm

**Claude Code:** code-review plugin com score de confiança e escalonamento humano.

**Operoz:** nó **`decision.llm`**.

- LLM classifica evento em ramos configurados
- `confidence_threshold` (default alinhado a `DEFAULT_CONFIDENCE_THRESHOLD`)
- Abaixo do threshold → ramo `human_branch_id` (revisão humana)
- Implementação: `llm_decision.py`, `evaluate_llm_decision()`

**Ver:** `catalog/decisions.py`, `test_llm_decision.py`

---

## Diagrama de camadas

```text
┌─────────────────────────────────────────────────────────────┐
│ EXPERIÊNCIA: Chat Operoz │ Galeria │ Canvas │ Cliente 360   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│ INTELIGÊNCIA: RAG │ Tool Router │ Orchestrator │ decision.llm │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│ MOTOR Claude Code-like: Packs │ Hooks │ Policy │ parallel   │
│              retry_until │ mcp_call │ outbox │ governance     │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│ DADOS: Issues │ Pages │ Runs │ Playbooks │ Analytics        │
└─────────────────────────────────────────────────────────────┘
```

---

## Documentação relacionada

- [Roadmap completo](./operoz-plataforma-violenta-roadmap.md) — secção 3
- [Índice assistente](./assistant-index.md)
- [ADR-001 Governança](./operoz-assistant-adr-001-governanca.md)

## Manutenção

Ao adicionar novo conceito Claude Code ao Operoz:

1. Linha nesta tabela + secção REF
2. ADR se decisão arquitetural
3. Card OPEROZDP apenas se houver gap de implementação (este módulo é **referência**, não backlog de features)
