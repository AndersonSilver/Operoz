# 05 — Clean Code & Testes · OQL

Baseline em [`00-VISAO-GERAL/04-clean-code-global.md`](../00-VISAO-GERAL/04-clean-code-global.md)
e [`05-estrategia-de-testes.md`](../00-VISAO-GERAL/05-estrategia-de-testes.md).

## Organização de ficheiros

```text
apps/api/operoz/oql/
├── __init__.py
├── grammar.py        # gramática lark (LALR) — uma fonte
├── parser.py         # texto → AST (dataclasses imutáveis)
├── ast.py            # nós do AST (And/Or/Not/Clause/Function/Literal)
├── fields.py         # FIELD_REGISTRY (campo → OqlField)
├── functions.py      # FUNCTION_REGISTRY (currentUser, startOfDay, …)
├── compiler.py       # AST + Context → Django Q
├── errors.py         # OqlSyntaxError, OqlUnknownFieldError, …
└── service.py        # run_oql(workspace, user, query, cursor)

apps/api/operoz/app/views/search/oql.py   # OqlSearchViewSet (fino)
```

## Princípios específicos

- **Separação rígida** parse / validate / compile / execute. Cada etapa é pura
  e testável; só `service.run_oql` toca o DB.
- **AST imutável** (dataclasses `frozen=True`) — facilita testes e evita efeitos
  colaterais.
- **Registries** (`FIELD_REGISTRY`, `FUNCTION_REGISTRY`) como ponto de extensão
  (Open/Closed): novo campo/função = nova entrada, sem mexer no compilador.
- Erros tipados com posição → mensagens úteis no editor.
- Zero SQL string em qualquer ficheiro (regra verificável por lint/grep no CI).

## Casos de teste

### Unit — parser/compiler (muitos, rápidos)

| Caso                                      | Esperado                                    |
| ----------------------------------------- | ------------------------------------------- |
| `project = "APP"`                         | AST correto; `Q(project__identifier="APP")` |
| `a AND b OR c`                            | precedência correta (AND liga mais)         |
| `NOT (status = "Done")`                   | negação correta                             |
| `assignee = currentUser()`                | usa context.user                            |
| `due < endOfWeek()`                       | data calculada do context.now               |
| `cf[12] = "x"` com id válido              | traduz; id inválido → erro                  |
| campo fora do registry                    | `OqlUnknownFieldError` + sugestões          |
| operador inválido para o tipo             | erro                                        |
| query > 4KB / profundidade > 50           | rejeitada (limite)                          |
| **fuzz**: strings aleatórias              | nunca crash; sempre erro tratado            |
| **segurança**: `"; DROP TABLE` como valor | tratado como literal string, sem efeito     |

### Integração (DRF client)

| Caso                                | Esperado                        |
| ----------------------------------- | ------------------------------- |
| query simples                       | `200` + resultados do workspace |
| query que tentaria ver outro tenant | só issues visíveis              |
| GUEST                               | `403`                           |
| `validate/` query inválida          | `400` com `position`            |
| throttle excedido                   | `429`                           |

### Frontend (unit)

- `oql-language` completion source devolve campos do `meta`.
- Linter mapeia `position` para a marca correta no CodeMirror.

### e2e

- Escrever OQL na pesquisa avançada, ver autocomplete, correr e obter
  resultados; introduzir erro e ver o sublinhado.

## Definition of Done

- [ ] Gramática + parser + compiler com cobertura alta (inclui fuzz).
- [ ] Whitelist de campos/funções; zero SQL string (verificado no CI).
- [ ] Endpoint com throttle, paginação e visibilidade aplicada antes da OQL.
- [ ] Editor CodeMirror com autocomplete + linter.
- [ ] Testes de injeção e cross-tenant verdes.
- [ ] Lint/format/types verdes.
