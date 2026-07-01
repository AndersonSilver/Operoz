# 05 — Clean Code & Testes · Advanced Roadmaps (Plans)

Baseline em [`00-VISAO-GERAL/04-clean-code-global.md`](../00-VISAO-GERAL/04-clean-code-global.md)
e [`05-estrategia-de-testes.md`](../00-VISAO-GERAL/05-estrategia-de-testes.md).

## Organização de ficheiros

```text
apps/api/operoz/
├── db/models/plan.py
├── plans/
│   ├── sources.py       # resolve_sources(plan, user) → project_ids acessíveis
│   ├── timeline.py      # agregação → bars + dependências + conflitos (puro)
│   ├── capacity.py      # committed vs capacity por squad/ciclo
│   ├── overlay.py       # apply_overlay(bars, changes) (puro)
│   └── commit.py        # commit_scenario (transacional, permissões)
├── app/views/plan/…
└── app/serializers/plan.py
```

## Princípios específicos

- **Funções puras** para timeline/overlay/capacity (entrada→saída, sem efeitos),
  testáveis com datasets sintéticos.
- `commit.py` é a única peça com escrita; isolada, transacional, com verificação
  de permissão por projeto.
- Reuso: Gantt, `IssueRelation`, `visible_security`, `accessible_board_project_ids`
  — o plano não reinventa visibilidade nem dependências.
- Overlay como dados (não duplicação de issues) mantém o domínio simples.

## Casos de teste

### Unit

| Caso                                          | Esperado           |
| --------------------------------------------- | ------------------ |
| `resolve_sources` exclui projeto inacessível  | id ausente         |
| `apply_overlay` muda só as issues do scenario | baseline intacto   |
| deteção de conflito de dependência            | conflito reportado |
| capacity vs committed (sobre-alocação)        | flag over          |
| release report completion                     | percentagem certa  |

### Integração

| Caso                                           | Esperado                   |
| ---------------------------------------------- | -------------------------- |
| timeline para user com acesso parcial          | só fontes acessíveis       |
| issue restrita                                 | invisível no Gantt         |
| `scenario/commit` sem `issue.edit` num projeto | `403`, nada alterado       |
| `scenario/commit` válido                       | issues atualizadas + audit |
| `source_type=oql`                              | aplica visibilidade        |

### e2e

- Criar plano com 2 projetos, ver Gantt agregado com dependências, simular
  cenário arrastando barras, e fazer commit confirmando as mudanças.

## Definition of Done

- [ ] Timeline/overlay/capacity puros e testados.
- [ ] `resolve_sources` + `visible_security` em toda leitura (teste de fuga).
- [ ] Commit transacional com permissão por projeto (bloqueante).
- [ ] Versions + release report; lint/format/types verdes.
