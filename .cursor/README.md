# Configuração Cursor — Operis

Skills e regras do agente Cursor para este monorepo. Tudo em **português** e com a marca **Operis**.

## Ficheiros na raiz do monorepo

| Ficheiro | Função |
|----------|--------|
| **`.cursorrules`** | Regras de design e código (tokens Operis, densidade enterprise, TypeScript). Lidas em cada prompt. |

## Hierarquia de skills

```text
.cursor/
└── skills/
    ├── OPERIS ENGENHARIA/              ← engenharia, design, arquitetura
    │   ├── DESENVOLVEDOR SENIOR/
    │   │   └── SKILL.md                → operis-desenvolvedor-senior
    │   ├── DESIGN SISTEMA/
    │   │   └── SKILL.md                → operis-design-sistema
    │   └── EXPERIÊNCIA JIRA/
    │       └── SKILL.md                → operis-experiencia-jira
    │
    └── OPERIS FLUXO/                   ← PR, release, contexto de produto
        ├── CONTEXTO/
        │   └── SKILL.md                → operis-contexto
        ├── DESCRIÇÃO PR/
        │   └── SKILL.md                → operis-pr-description
        └── RELEASE NOTES/
            └── SKILL.md                → operis-release-notes
```

## OPERIS ENGENHARIA

Arquitetura, segurança, design e layout enterprise.

| Pasta | Skill (`name`) | Quando usar |
|-------|----------------|-------------|
| `DESENVOLVEDOR SENIOR/` | `operis-desenvolvedor-senior` | **Qualquer desenvolvimento** — fluxo, camadas, RBAC, validação, IDOR |
| `DESIGN SISTEMA/` | `operis-design-sistema` | Tokens do monorepo (`tailwind-config`), canvas/surface/layer |
| `EXPERIÊNCIA JIRA/` | `operis-experiencia-jira` | Layout 70/30, issue/card, filtros (tokens Operis) |

Para features novas, o agente deve priorizar **DESENVOLVEDOR SENIOR** + **DESIGN SISTEMA** + `.cursorrules`.

## OPERIS FLUXO

Fluxos do dia a dia da equipa.

| Pasta | Skill (`name`) | Quando usar |
|-------|----------------|-------------|
| `CONTEXTO/` | `operis-contexto` | Domínio Operis, marca, tom em português |
| `DESCRIÇÃO PR/` | `operis-pr-description` | Descrição de pull request |
| `RELEASE NOTES/` | `operis-release-notes` | Notas de release (`release: vX.Y.Z`) |

## Como o Cursor carrega

- **`.cursorrules`** — contexto global automático na raiz do projeto.
- **`SKILL.md`** — sob `.cursor/skills/`; ativação pela `description` no frontmatter.

## Regras adicionais (opcional)

Ficheiros `.cursor/rules/*.mdc` para regras persistentes extra.

## Convenção de pastas

- Nomes de pastas em **MAIÚSCULAS** e **português**.
- Uma skill por pasta; ficheiro obrigatório `SKILL.md`.

## Origem

Migrado de `.claude/skills/`. Design alinhado ao tema Operis em `packages/tailwind-config/`.
