# 05 — Clean Code & Testes · Relatórios & Analytics

Baseline em [`00-VISAO-GERAL/04-clean-code-global.md`](../00-VISAO-GERAL/04-clean-code-global.md)
e [`05-estrategia-de-testes.md`](../00-VISAO-GERAL/05-estrategia-de-testes.md).

## Organização de ficheiros

```text
apps/api/operoz/analytics/
├── metrics/
│   ├── registry.py       # METRIC_REGISTRY + MetricSpec
│   ├── burndown.py       # compute_burndown(base, scope, ctx) → series (puro)
│   ├── velocity.py
│   ├── cfd.py
│   ├── control.py
│   ├── time_in_status.py # consome IssueActivity
│   └── scope.py          # scoped_issue_qs(user, scope)
├── snapshots/tasks.py    # Celery beat: snapshots diários
└── export.py             # CSV/PDF/PNG

app/views/analytic/metrics.py   # MetricViewSet (fino)
```

## Princípios específicos

- **Cada métrica é uma função pura** `(queryset_base, scope, context) → series`.
  Testável com datasets sintéticos, sem acoplar à view.
- **Registry** (Open/Closed): nova métrica = nova função + entrada. Sem tocar no
  resolver nem na view.
- **Uma só fonte de visibilidade** (`scope.py`) partilhada por relatórios e
  gadgets — segurança e DRY.
- Snapshots idempotentes; recompute on-read só do ponto "hoje".

## Casos de teste

### Unit (dataset sintético)

| Caso                                   | Esperado                   |
| -------------------------------------- | -------------------------- |
| burndown de ciclo conhecido            | curva ideal/actual correta |
| velocity últimos N sprints             | committed/completed certos |
| cfd a partir de snapshots              | série empilhada coerente   |
| time_in_status de issue com transições | somas por estado corretas  |
| created_vs_resolved                    | contagens diárias certas   |
| scope kind incompatível                | erro                       |

### Integração

| Caso                             | Esperado                          |
| -------------------------------- | --------------------------------- |
| métrica só conta issues visíveis | exclui restritas/sem acesso       |
| `scope=oql`                      | aplica whitelist + visibilidade   |
| export csv/pdf                   | herda permissão; ficheiro correto |
| métrica pesada sem `from/to`     | exige janela                      |
| throttle excedido                | `429`                             |

### e2e

- Abrir relatório de burndown de um sprint, alternar scope, e exportar PDF.

## Definition of Done

- [ ] Métricas como funções puras testadas com datasets sintéticos.
- [ ] `scoped_issue_qs` única, partilhada com dashboards; teste de fuga por
      agregação verde.
- [ ] Snapshots Celery idempotentes.
- [ ] Componentes de chart reutilizados pelos gadgets (feature 06).
- [ ] Export seguro (TTL); lint/format/types verdes.
