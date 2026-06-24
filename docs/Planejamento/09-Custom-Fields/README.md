# 09 — Custom Fields (P2)

> Pré-requisito: [`00-VISAO-GERAL`](../00-VISAO-GERAL/).

## Visão

O Operis tem `WorkspaceCustomField` com `settings` JSON, mas a cobertura de
**tipos** e de **configuração** (obrigatório/visível/contexto, valores default,
cascata) é limitada face ao Jira (roadmap §4). Esta feature completa o sistema de
campos personalizados e, de passagem, traz **Components** e **Resolution** (§3.7,
§1.1.4) que partilham a mesma infraestrutura de campos estruturados.

## Mapeamento ao roadmap

Cobre §4 (`4.1`–`4.20`), §3.7 (Resolution), §1.1.4 (Components): todos os tipos
de campo, field configuration, contextos, valores default, cascading select.

## Decisões-chave

| # | Decisão | Alternativa rejeitada |
| --- | --- | --- |
| 1 | Estender `WorkspaceCustomField` (já existe) com mais tipos via `settings` JSON | Tabela por tipo de campo |
| 2 | Valor por issue numa tabela `IssueCustomFieldValue` (EAV controlado) | Coluna por campo (impraticável) |
| 3 | `FieldConfiguration` define required/hidden/readonly por contexto | Flags soltas no campo |
| 4 | Components e Resolution como entidades dedicadas (não custom field) por serem nativas do fluxo | Tudo como custom field genérico |
| 5 | OQL `cf[<id>]` (feature 02) consulta valores | Sem query em custom fields |

## Escopo

**Inclui:** todos os tipos de campo, field configuration + scheme, contextos,
defaults, cascading; Components; Resolution.

**Exclui:** field-level security (P3, herda da feature 07).

## Fases

1. **F1 — Tipos + valores:** todos os tipos básicos, `IssueCustomFieldValue`,
   render na issue.
2. **F2 — Configuração:** field configuration (required/hidden/readonly),
   defaults, contextos por tipo de issue/projeto.
3. **F3 — Avançado:** cascading select, Components, Resolution.

## Ficheiros

- [01-modelo-de-dados.md](./01-modelo-de-dados.md)
- [02-contrato-de-api.md](./02-contrato-de-api.md)
- [03-frontend.md](./03-frontend.md)
- [04-seguranca.md](./04-seguranca.md)
- [05-clean-code-e-testes.md](./05-clean-code-e-testes.md)

## Reuso

- `WorkspaceCustomField` + `CustomFieldType` (já existem em
  `db/models/custom_field.py`).
- `BoardIssueType`/`IssueType` para contextos.
- OQL `cf[<id>]` (feature 02).
