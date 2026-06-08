# Configuração Cursor — Operoz

Skills (conhecimento profundo) + **Rules** (ativação automática por ficheiro/glob).

## Estrutura

```text
.cursor/
├── rules/                          ← 8 regras .mdc (1 orquestrador + 7 domínios)
│   ├── operoz-orchestrator.mdc     alwaysApply: true
│   ├── operoz-backend-django.mdc
│   ├── operoz-anti-patterns.mdc
│   ├── operoz-frontend-design.mdc
│   ├── operoz-issue-ux.mdc
│   ├── operoz-integrations.mdc
│   ├── operoz-pull-request.mdc
│   └── operoz-release-notes.mdc
├── skills/
│   ├── OPEROZ ENGENHARIA/
│   └── OPEROZ FLUXO/
└── README.md
```

## Mapa Rule ↔ Skill ↔ Globs

| Regra | Skill | Quando o Cursor aplica (globs) |
|-------|-------|--------------------------------|
| `operoz-orchestrator` | — | **Sempre** (`alwaysApply: true`) |
| `operoz-backend-django` | `DESENVOLVEDOR SENIOR/SKILL.md` | `apps/api/**/*` |
| `operoz-anti-patterns` | `ANTI_PATTERNS.md` | `apps/api/**/*.py`, `apps/web/**/*.{ts,tsx}` |
| `operoz-frontend-design` | `DESIGN SISTEMA/SKILL.md` | `apps/web/**`, `packages/tailwind-config/**`, `ui`, `propel` |
| `operoz-issue-ux` | `EXPERIÊNCIA JIRA/SKILL.md` | `apps/web/**/board/**`, `issues/**` |
| `operoz-integrations` | `CONTEXTO/SKILL.md` | `tests/fixtures/**`, `bgtasks/**`, `*webhook*` |
| `operoz-pull-request` | `DESCRIÇÃO PR/SKILL.md` | `.github/**` |
| `operoz-release-notes` | `RELEASE NOTES/SKILL.md` | `docs/**` (+ pedido explícito) |

## Skills (detalhe longo)

```text
.cursor/skills/
├── OPEROZ ENGENHARIA/
│   ├── DESENVOLVEDOR SENIOR/SKILL.md
│   ├── DESIGN SISTEMA/SKILL.md
│   ├── EXPERIÊNCIA JIRA/SKILL.md
│   └── ANTI_PATTERNS.md
└── OPEROZ FLUXO/
    ├── CONTEXTO/SKILL.md
    ├── DESCRIÇÃO PR/SKILL.md
    └── RELEASE NOTES/SKILL.md
```

**Regra:** a `.mdc` dispara no contexto certo; o `SKILL.md` tem o manual completo — o agente deve ler ambos quando implementar.

## Fixtures (raiz monorepo)

`tests/fixtures/github_webhook_pr.json` · `harness_cost_report.json`

## Como validar no Cursor

1. **Settings → Rules** — deve listar 8 regras Operoz.
2. Abrir `apps/api/.../views.py` — deve aparecer backend + anti-patterns.
3. Abrir `apps/web/.../board/...tsx` — design + issue-ux + anti-patterns.
4. Novo chat — orquestrador sempre ativo.

## Convenção

- Marca: **Operoz** · Pastas skills: **OPEROZ** (maiúsculas, português).
- Paths legados no código: `operis`, `apps/api/operis`.
