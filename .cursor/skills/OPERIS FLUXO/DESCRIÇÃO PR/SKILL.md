---
name: operis-pr-description
description: >-
  Gera a descrição de um pull request Operis seguindo o template em
  .github/pull_request_template.md. Analisa commits e diff da branch atual
  face à base. Usar quando o utilizador pedir descrição de PR, abrir PR ou
  preencher o template de PR.
---

# Gerador de descrição de PR (Operis)

Gera a descrição de um **pull request** neste repositório Operis, com base em `.github/pull_request_template.md`.

## Linguagem e marca

- Escrever **sempre em português** (pt-BR ou pt-PT conforme o utilizador).
- Referir o produto sempre como **Operis** na descrição do PR.
- Vocabulário: workspace, board, projeto, card, módulo, status report, Cliente 360.

## Passos

### 1. Determinar a branch base

- Se já existir PR: `gh pr view <número> --json baseRefName` e usar esse valor.
- Caso contrário: perguntar ou inferir (ex.: `main`, `master`, `develop`, `preview`) conforme o fluxo do repositório Operis.
- Se for ambíguo, perguntar ao utilizador.

### 2. Analisar alterações

Executar (substituir `<base>` pela branch base):

```bash
git log <base>...HEAD --oneline
git diff <base>...HEAD --stat
git diff <base>...HEAD --no-color
```

Se o diff for muito grande, priorizar ficheiros centrais (`apps/`, `packages/`, `docs/operis-*`, migrações API).

### 3. Preencher o template

Ler `.github/pull_request_template.md` e preencher:

#### Description

Resumo claro do **o quê** e **porquê**. Foco no impacto para utilizadores Operis, não em diff linha a linha. Decisões de implementação relevantes em 1–2 frases.

#### Type of Change

Marcar com `[x]` o que aplicar:

- Correção de bug (sem quebra)
- Funcionalidade nova (sem quebra)
- Melhoria (comportamento existente melhorado)
- Refatoração
- Performance
- Documentação

#### Screenshots and Media

**Não inventar.** Manter o placeholder/comentário HTML do template **tal como está** no ficheiro original.

#### Test Scenarios

Cenários de teste **concretos** derivados das alterações reais (ex.: «Abrir board X → separador Clientes → confirmar filtros»). Não listar testes genéricos irrelevantes.

#### References

- Identificadores de trabalho no branch/commits (ex.: `WEB-1234`, `OPERIS-42`) se existirem.
- Links de issue Jira/Linear/GitHub se o utilizador os tiver indicado.
- IDs Sentry ou URLs se mencionados na conversa.

### 4. Formato de saída

- Entregar o markdown **pronto a colar** na descrição do PR.
- **Não** envolver a saída num único bloco de código — markdown cru.
- Não alterar o título do PR salvo pedido explícito.

## Diretrizes

- Bullets quando houver várias mudanças.
- Impacto visível para gestão/PM quando fizer sentido (Cliente 360, status report, boards).
- Não inventar referências nem cenários de teste.

## Comandos úteis

```bash
gh pr create --title "..." --body "$(cat <<'EOF'
...descrição...
EOF
)"
```

No Windows PowerShell, preferir ficheiro temporário ou `gh pr edit` com body em ficheiro se HEREDOC falhar.
