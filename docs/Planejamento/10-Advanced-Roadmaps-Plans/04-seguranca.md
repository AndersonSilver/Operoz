# 04 — Segurança · Advanced Roadmaps (Plans)

Baseline em [`00-VISAO-GERAL/03-seguranca-transversal.md`](../00-VISAO-GERAL/03-seguranca-transversal.md).

## Risco central: plano agrega muitas fontes → fuga cross-project

Tal como o board hub (feature 04), um plano cruza projetos. E ainda escreve
(scenario commit). Dois riscos: ver demais e escrever onde não devia.

| Ameaça | Vetor | Mitigação |
| --- | --- | --- |
| Fuga via fontes do plano | Plano inclui projeto sem acesso | `resolve_sources(plan, user)` só devolve fontes acessíveis; timeline recorta |
| Fuga via security level | Issue restrita no Gantt | `visible_security(user)` (feature 07) aplicado na agregação |
| Escrita indevida via commit | `scenario/commit` altera issues sem permissão | `commit` verifica `issue.edit` em **cada** projeto afetado; transação atómica |
| OQL source | `source_type=oql` tenta alargar | Reusa whitelist/visibilidade da OQL (feature 02) |
| Capacity expõe equipa | Dados sensíveis de alocação | Capacity recortada às squads acessíveis |
| DoS por timeline | Plano com milhares de issues | Paginação/limite de fontes; throttle; cache curto por (plano, user, scenario) |

## Regra de ouro

```python
project_ids = resolve_sources(plan, user)   # interseção com acessível
# Timeline, capacity, dependências e commit partem deste conjunto.
```

## Scenario commit (escrita sensível)

```python
@transaction.atomic
def commit_scenario(scenario, user):
    affected = group_changes_by_project(scenario.changes)
    for project_id, changes in affected.items():
        require_permission(user, "issue.edit", project_id)   # ou aborta tudo
    apply_changes(changes)            # datas/cycle/board nas issues reais
    audit_log("scenario.committed", actor=user, before=…, after=…)
```

- Tudo-ou-nada: se falta permissão num projeto, o commit inteiro reverte.
- Audita o que mudou.

## Validação

- `source_type`/`zoom`/`hierarchy` validados contra enums.
- `changes` do scenario: só campos permitidos (start/target/cycle/board) e ids
  do workspace.
- Capacity: números não-negativos.

## Auditoria

- `scenario/commit` e mudanças de versão registam ator e diff.
- Plano partilhado: timeline calculada por viewer (mesmo princípio dos
  dashboards), nunca com privilégio do owner.
