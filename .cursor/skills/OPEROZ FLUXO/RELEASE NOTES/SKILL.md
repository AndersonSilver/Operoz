---
name: operoz-release-notes
description: >-
  Gera notas de release Operoz para PR semver e conteúdo LinkedIn estilo Build
  in Public. Filtra ruído de commits, categoriza mudanças e reescreve para
  audiência de produto.
---

# Release notes — Operoz (produto + LinkedIn)

Duas saídas a partir do mesmo PR de release `release: vX.Y.Z`:

1. **Corpo do PR** — changelog técnico para a equipa.
2. **Post LinkedIn** — narrativa Build in Public para founders/PMs/devs.

## Marca e idioma

- Produto: **Operoz**.
- Texto em **português**.
- Manter IDs `[WEB-XXXX]`, `[API-XXXX]`, `(#NNNN)` no changelog interno.
- LinkedIn: tom humano, menos jargão de commit.

---

## Quando usar

- PR com título `release: vX.Y.Z` (ou variante `-operoz`).
- Pedido: «notas de release», «post de lançamento», «LinkedIn».

---

## Passo 1 — Obter commits

```bash
gh pr view <NUM> --json title,body,baseRefName,headRefName,commits \
  --jq '.commits[] | .messageHeadline'
```

### Filtrar ruído (excluir)

| Padrão | Motivo |
|--------|--------|
| `fix: merge conflicts` | Artefacto |
| `Merge branch '...'` | Merge automático |
| `Revert "..."` (se reaplicado) | Churn |
| `chore: bump version` só | Sem valor público |

---

## Passo 2 — Categorizar

| Prefixo commit | Secção PR | Ângulo LinkedIn |
|----------------|-----------|-----------------|
| `feat:` | Novidades | «O que construímos» |
| `fix:` | Correções | «O que corrigimos» |
| `perf:` | Performance | «Mais rápido» |
| `refactor:`, `chore:` | Manutenção | Omitir ou 1 linha |
| `chore(deps):` | Dependências | Omitir no LinkedIn |

---

## Formato A — Corpo do PR (changelog)

```markdown
# Release vX.Y.Z — Operoz

## Novidades

- **Título legível para humanos** — [WEB-1234] (#456)
  Detalhe opcional: flag, migração, integração Git/Harness.

## Correções

- **Título** — [WEB-1234] (#457)

## Performance

- **Título** — [API-99] (#458)

## Refatoração e manutenção

- **Título** — [WEB-1234] (#459)

## Dependências

- Atualizar `pacote` X → Y (#460)
```

Regras:

- Título em **negrito**; reescrever subjects crípticos.
- Sempre ID de trabalho + `(#PR)`.
- Omitir secções vazias.
- Destacar: boards, custo Harness, Git webhooks, Cliente 360, automações.

Atualizar PR:

```bash
gh pr edit <NUM> --body-file release-notes.md
```

Não alterar o **título** do PR de release.

---

## Formato B — LinkedIn (Build in Public)

Estrutura fixa (copiar como post):

```markdown
🚀 Operoz vX.Y.Z — [uma frase de valor]

Esta semana no Operoz [1–2 frases: para quem é e o que melhorou].

✨ Destaques
• [Benefício 1 — linguagem de utilizador, não de commit]
• [Benefício 2]
• [Benefício 3 — máximo 5 bullets]

🔧 Para equipas técnicas
• [Opcional: 1 linha se migração, API ou integração Git/Harness]

🙏 Obrigado a quem testou e reportou feedback.

#buildinpublic #saas #gestaodeprojetos #devops #harness

---
👉 Experimenta: [URL do produto ou waitlist]
```

### Regras do post

- **Primeira linha** = gancho (resultado, não versão seca).
- Bullets = **benefícios**, não nomes de ficheiros.
- Mencionar **custo**, **squad** ou **Git** só se entraram nesta release.
- Tom: confiante, transparente, sem hype vazio.
- Hashtags: 3–5 relevantes; não spam.
- Emojis: máx. 1 no título, opcionais nos bullets.
- **Não** listar 20 fixes menores — agrupar «várias correções de estabilidade».

### Exemplo de transformação

| Commit | LinkedIn |
|--------|----------|
| `feat(board): harness cost rollup` | «Vê o custo real dos pipelines Harness por cliente no Cliente 360» |
| `fix(web): kanban drag 404` | «Arrastar cards no board voltou a ser instantâneo» |

---

## Enriquecimento opcional

- Jira/Atlassian MCP: **só** para 1–2 features grandes com commit vago.
- Não enriquecer tudo — corpo do commit costuma bastar.

---

## Erros comuns

- Post LinkedIn igual ao changelog (muito técnico).
- Esquecer `(#NNNN)` no PR.
- Incluir merges sem valor.
- Prometer feature não presente nos commits filtrados.
