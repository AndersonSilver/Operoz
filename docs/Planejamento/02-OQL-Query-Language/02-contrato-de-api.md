# 02 — Contrato de API · OQL

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Endpoints

```text
# Executar pesquisa OQL (paginada)
GET  /api/workspaces/{slug}/search/oql/?q=<query>&cursor=&per_page=
POST /api/workspaces/{slug}/search/oql/        # query longa no body { "q": "..." }

# Validar sem executar (para o editor)
POST /api/workspaces/{slug}/search/oql/validate/   { "q": "..." }

# Metadados para autocomplete
GET  /api/workspaces/{slug}/search/oql/meta/       # campos, operadores, funções
GET  /api/workspaces/{slug}/search/oql/values/?field=status   # valores possíveis

# NL → OQL (F3)
POST /api/workspaces/{slug}/search/oql/from-text/  { "text": "minhas issues atrasadas" }

# Histórico
GET  /api/workspaces/{slug}/search/oql/history/
```

## Permissões

- Todos: `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")`.
- O resultado é **sempre** filtrado adicionalmente pela visibilidade do
  utilizador: projetos a que pertence + issues que pode ver. A OQL nunca alarga
  permissões — só restringe dentro do que já é visível.
- `GUEST` não acede à OQL.

## Gramática (esboço)

```text
query     := orExpr ( ORDER BY orderList )?
orExpr    := andExpr ( OR andExpr )*
andExpr   := unary ( AND unary )*
unary     := NOT unary | "(" query ")" | clause
clause    := field operator value
field     := IDENT | "cf[" NUMBER "]"
operator  := "=" | "!=" | ">" | ">=" | "<" | "<="
           | "IN" | "NOT IN" | "IS" | "IS NOT" | "~" | "!~"
           | "CHANGED"
value     := STRING | NUMBER | DATE | function | list
function  := IDENT "(" args? ")"
list      := "(" value ( "," value )* ")"
```

Funções suportadas (F2): `currentUser()`, `membersOf(group)`, `now()`,
`startOfDay(n)`, `endOfDay(n)`, `startOfWeek(n)`, `endOfWeek(n)`,
`startOfMonth(n)`, `endOfMonth(n)`.

## Pipeline de execução

```text
GET .../search/oql/?q=...
  1. parse(q)                → AST  (erro de sintaxe → 400 com posição)
  2. validate(AST)           → campos/operadores/funções no registry (→ 400)
  3. compile(AST, context)   → Django Q object (+ ORDER BY whitelisted)
  4. base_qs = Issue.objects.filter(workspace=…)
                .filter(visibility_for(user))   # nunca alargar permissões
  5. qs = base_qs.filter(compiled_q)
  6. paginate (cursor) + serialize (IssueLiteSerializer)
```

## Respostas

```jsonc
// 200
{ "results": [ { "id": "…", "name": "…", "state": {…}, "priority": "high" } ],
  "total_count": 42, "next_cursor": "50:1:0" }

// 400 — sintaxe
{ "error": "oql_syntax_error", "message": "Esperado operador.",
  "position": 18 }

// 400 — campo desconhecido
{ "error": "oql_unknown_field", "field": "foo",
  "suggestions": ["assignee", "status"] }
```

## `meta/` e `values/`

- `meta/` devolve o registry público: campos (key, tipo, operadores), funções e
  exemplos. Alimenta o autocomplete.
- `values/?field=status` devolve valores possíveis **scoped** ao workspace (ex.:
  nomes de estados, labels) para sugestão — respeitando visibilidade.

## Notas

- `validate/` é barato (parse + validate, sem tocar no DB) — usado a cada
  keystroke com debounce.
- `from-text/` chama o assistente LLM e **passa o resultado pelo mesmo
  parser/validador** antes de devolver — o LLM nunca produz SQL.
