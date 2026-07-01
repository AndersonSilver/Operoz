# 02 — OQL (Operoz Query Language) (P0)

> Pré-requisito: [`00-VISAO-GERAL`](../00-VISAO-GERAL/).

## Visão

O Jira domina em grande parte pela **JQL** — uma linguagem de query que nenhum
concorrente iguala. O Operoz tem rich filters (UI) mas não uma linguagem
textual. A **OQL** traz queries tipo `project = "APP" AND status = "In Progress"
AND assignee = currentUser() ORDER BY priority DESC`, compiladas com segurança
para Django ORM.

## Mapeamento ao roadmap

Cobre §11 (`11.1`–`11.9`) e §26.4 (NL→OQL): parser, funções, autocomplete,
página de pesquisa avançada.

## Decisões-chave

| #   | Decisão                                                                    | Alternativa rejeitada                    |
| --- | -------------------------------------------------------------------------- | ---------------------------------------- |
| 1   | OQL compila para **Django `Q` objects**, nunca SQL string                  | SQL interpolado — injeção                |
| 2   | Parser com gramática formal (lark/pyparsing)                               | Regex ad-hoc — frágil e inseguro         |
| 3   | Whitelist de campos e funções; tradução campo→ORM explícita                | Mapear qualquer atributo — fuga de dados |
| 4   | Autocomplete via endpoint de metadados (campos/valores/funções)            | Hard-code no frontend                    |
| 5   | NL→OQL como camada opcional sobre o LLM existente, com validação do parser | LLM gera SQL direto                      |

## Escopo

**Inclui:** gramática OQL, parser→`Q`, registry de campos e funções, endpoint de
pesquisa, autocomplete, editor CodeMirror, NL→OQL.

**Exclui:** guardar queries como views (já existe — `View`); usar OQL como source
de board (feature 04) e de subscription (feature 08) consomem este motor.

## Fases

1. **F1 — Parser + execução:** gramática, compilação para `Q`, endpoint
   `search/oql/`. Campos core (project, status, assignee, type, priority,
   label, dates).
2. **F2 — Funções + autocomplete:** `currentUser()`, `membersOf()`,
   `startOfDay()`…; endpoint de metadados; editor CodeMirror.
3. **F3 — Avançado:** `CHANGED`, custom fields `cf[id]`, NL→OQL.

## Ficheiros

- [01-modelo-de-dados.md](./01-modelo-de-dados.md)
- [02-contrato-de-api.md](./02-contrato-de-api.md)
- [03-frontend.md](./03-frontend.md)
- [04-seguranca.md](./04-seguranca.md)
- [05-clean-code-e-testes.md](./05-clean-code-e-testes.md)

## Reuso

- CodeMirror (já dependência do editor) para a UI.
- Assistente LLM existente (`apps/api/operoz/assistant/`) para NL→OQL.
- `View`/`Workspace views` existentes para guardar queries OQL.
