---
name: operoz-pr-description
description: >-
  Gera descrições de Pull Request Operoz perfeitas a partir do template
  .github/pull_request_template.md, analisando commits e diff. Usar ao pedir
  descrição de PR, abrir PR ou preencher template.
---

# Gerador de descrição de PR — Operoz

Automatiza PRs **claras, testáveis e alinhadas ao produto** para revisão rápida.

## Linguagem e marca

- **Português** (pt-BR salvo indicação).
- Produto: **Operoz**.
- Vocabulário: workspace, board (squad), projeto, card, módulo, status report, Cliente 360, Git, Harness, custo.

---

## Passos (sempre nesta ordem)

### 1. Branch base

```bash
git branch -vv
gh pr view --json baseRefName 2>/dev/null
```

Se ambíguo: perguntar (`main`, `master`, `develop`, `preview`).

### 2. Analisar alterações

```bash
git log <base>...HEAD --oneline
git diff <base>...HEAD --stat
git diff <base>...HEAD --no-color
```

Priorizar: `apps/`, `packages/`, `docs/operis-*`, migrações Django, integrações Git/Harness.

Classificar mentalmente:

- **Utilizador** — o que muda na UI ou API pública
- **Risco** — auth, custos, webhooks, migração DB
- **Escopo** — feature | fix | refactor | chore | docs

### 3. Preencher template

Ler `.github/pull_request_template.md` e produzir markdown **idêntico na estrutura**.

#### Description

- 1 parágrafo: **problema → solução → impacto Operoz**.
- Bullets se múltiplas áreas (web + API + i18n).
- Mencionar flags, migrações, variáveis de env novas.
- **Não** colar diff linha a linha.

#### Type of Change

Marcar `[x]` apenas o que aplicar (bug, feature, melhoria, refactor, performance, docs).

#### Screenshots and Media

**Não inventar.** Manter placeholder/comentário HTML do template **inalterado**.

#### Test Scenarios

Cenários **executáveis** derivados do diff, formato:

```markdown
- [ ] Como `<papel>`, abrir `<rota>` → `<ação>` → ver `<resultado>`
```

Incluir pelo menos um cenário de **permissão** se tocar RBAC. Incluir **regressão** se tocar transição de status ou custo.

#### References

- IDs de commits/branches: `[WEB-1234]`, `[OP-42]`.
- Links Jira/Linear/GitHub **só se o utilizador forneceu**.
- Não inventar tickets.

### 4. Título do PR (se pedido)

Formato sugerido:

```text
[WEB-1234] feat(board): resumo curto em português
```

Ou conventional commit alinhado ao repositório.

### 5. Formato de saída

- Markdown **cru**, pronto a colar no GitHub — **sem** envolver tudo num único bloco de código na resposta final ao utilizador.
- Secção **Checklist do autor** (opcional no final):

```markdown
## Checklist do autor
- [ ] `pnpm check:types` nos pacotes tocados
- [ ] Migração aplicada / nota de deploy
- [ ] Telas irmãs revistas (design system)
- [ ] Sem segredos no diff
```

---

## Qualidade «PR perfeita»

| Critério | Bom | Evitar |
|----------|-----|--------|
| Impacto | «Gestor vê custo Harness no Cliente 360» | «Alterados 12 ficheiros» |
| Testes | Passos com URL ou menu | «Testar tudo» |
| Risco | «Requer `HARNESS_API_KEY`» | Omitir breaking change |
| Escopo | Uma narrativa coerente | PR «kitchen sink» |

---

## Automação Cursor

Quando o utilizador pedir «gera a PR»:

1. Executar comandos git acima.
2. Ler template.
3. Entregar body completo + sugerir título.
4. Opcional: `gh pr create` / `gh pr edit` (HEREDOC ou ficheiro temporário no Windows).

```bash
gh pr create --title "..." --body-file pr-body.md
```

---

## Diretrizes

- Bullets para várias mudanças.
- Impacto PM/gestão quando custo, squad ou status report.
- Não inventar screenshots, testes ou tickets.
