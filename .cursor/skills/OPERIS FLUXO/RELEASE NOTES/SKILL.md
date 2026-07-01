---
name: operis-release-notes
description: >-
  Gera notas de release para um PR de versão Operis (semver, ex. release: vX.Y.Z).
  Lê commits do PR, filtra ruído, categoriza por conventional commits e atualiza
  a descrição do PR. Usar quando pedirem notas de release ou release notes.
---

# Gerador de notas de release (Operis)

Gera **notas de release** estruturadas a partir dos commits de um PR de release no repositório **Operis** e atualiza a descrição desse PR.

## Linguagem e marca

- Texto das notas em **português**.
- Produto: **Operis** em todo o texto das notas.
- Preservar identificadores de trabalho nos commits (`[WEB-XXXX]`, `[OPERIS-XXXX]`, etc.).

## Versionamento

- **Semver** `vX.Y.Z` (major.minor.patch).
- Título típico do PR: `release: vX.Y.Z` ou `release: vX.Y.Z-operis`.
- Branches: confirmar com `gh pr view` (`baseRefName`, `headRefName`) — confirmar no vosso fluxo (`main`, `master`, `canary`, `preview`).

## Quando usar

- Utilizador partilha ou menciona um PR de release com versão semver.
- Pedido explícito: «notas de release», «atualizar descrição do PR de release».

## Passos

### 1. Obter commits

```bash
gh pr view <NUM_PR> --json title,body,baseRefName,headRefName,commits \
  --jq '.commits[] | .messageHeadline + "\n---BODY---\n" + .messageBody + "\n===END==="'
```

Visão rápida:

```bash
gh pr view <NUM_PR> --json commits \
  --jq '.commits[] | {oid: .oid[0:10], message: .messageHeadline}'
```

### 2. Filtrar ruído

**Excluir sempre** (não são mudanças para utilizadores):

| Padrão | Motivo |
|--------|--------|
| `fix: merge conflicts` | Artefacto de merge |
| `Merge branch '...' of github.com:...` | Merge automático |
| `Revert "..."` (se logo reaplicado) | Churn interno |

### 3. Identificadores de trabalho

Muitos commits Operis começam com ID entre colchetes — **manter** nas notas:

- `[WEB-XXXX]` — frontend / produto web
- `[API-XXXX]` — backend Django
- Outros prefixos do vosso processo (Jira, Linear, etc.)

### 4. (Opcional) Enriquecer contexto

Só para features grandes com mensagem de commit vaga:

- **Jira / Atlassian MCP**: se estiver configurado no Cursor, buscar o ticket pelo ID.
- **Não** enriquecer todos os itens — descrições de ticket costumam estar vazias; o corpo do commit costuma bastar.

### 5. Categorizar (conventional commits)

| Prefixo | Secção nas notas |
|---------|------------------|
| `feat:`, `feat(escopo):` | Novidades |
| `fix:`, `fix(escopo):` | Correções |
| `refactor:` | Refatoração e manutenção |
| `chore:`, `chore(escopo):` | Refatoração e manutenção |
| `chore(deps):`, Dependabot | Dependências |

### 6. Formato das notas

```markdown
# Release vX.Y.Z — Operis

## Novidades

- **Título legível** — [WEB-XXXX] (#NNNN)
  Uma ou duas frases opcionais (critérios de aceite, flag, migração).

## Correções

- **Título legível** — [WEB-XXXX] (#NNNN)

## Refatoração e manutenção

- **Título legível** — [WEB-XXXX] (#NNNN)

## Dependências

- Atualizar `<pacote>` X.Y.Z → A.B.C (#NNNN)
```

Regras:

- Título em **negrito**, reescrever se o subject do commit for críptico.
- Sempre ID de trabalho + número do PR de merge `(#NNNN)`.
- Sub-linha só se o corpo do commit tiver informação útil (migração, feature flag, config de deploy).
- Omitir secções vazias.

### 7. Atualizar descrição do PR

```bash
gh pr edit <NUM_PR> --body "$(cat <<'EOF'
<markdown das notas>
EOF
)"
```

Usar HEREDOC com `'EOF'` para não interpretar `` ` `` e `$` no shell.

## Erros comuns

- Incluir commits de merge sem conteúdo funcional.
- Remover o ID `[WEB-XXXX]` — a equipa usa para rastrear.
- Enriquecer tudo via MCP — lento e muitas vezes inútil.
- Esquecer `(#NNNN)` do PR mergeado.
- Corromper markdown sem HEREDOC.
- Alterar o **título** do PR de release — só o **corpo**.

## Convenções Operis (produto)

- **Board** = unidade de time; **projeto** = cliente no modelo Operis (1:1 em Cliente 360).
- Releases podem incluir: boards, status report, Cliente 360, automações, campos customizados de projeto.
- Documentação interna: `docs/operis-*` e `docs/tech4humans-*`.
