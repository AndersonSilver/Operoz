# 05 — Clean Code & Testes · Time Tracking

Baseline em [`00-VISAO-GERAL/04-clean-code-global.md`](../00-VISAO-GERAL/04-clean-code-global.md)
e [`05-estrategia-de-testes.md`](../00-VISAO-GERAL/05-estrategia-de-testes.md).

## Organização de ficheiros

```text
apps/api/operoz/
├── db/models/worklog.py
├── app/views/time_tracking/worklog.py
├── app/views/time_tracking/timer.py
├── app/views/time_tracking/reports.py
├── app/serializers/worklog.py
├── app/urls/time_tracking.py
└── time_tracking/
    ├── duration.py     # parse/format de durações (puro)
    ├── aggregation.py  # somas por issue/dia/membro
    └── timer.py        # start/stop (regra do timer único)
```

## Princípios específicos

- **`duration.py` puro** (parse/format) — sem DB, 100% testável; partilhado
  back/front (mesma lógica, dois idiomas, mesmos casos de teste).
- `time_spent` **derivado** por agregação, não persistido (evita divergência);
  se cachear, atualizar por signal e testar consistência.
- Lógica de timer (sessão única, cálculo de duração) isolada em `timer.py`.
- Views finas; agregação e validação no domínio.

## Casos de teste

### Unit

| Caso                              | Esperado      |
| --------------------------------- | ------------- |
| `parseDuration("2h 30m")`         | 9000          |
| `parseDuration("1d")` (8h)        | 28800         |
| `formatDuration(9000)`            | "2h 30m"      |
| soma de worklogs por issue        | total correto |
| duração inválida (negativa, >24h) | rejeitada     |
| `started_at` no futuro            | rejeitada     |

### Integração

| Caso                                     | Esperado                         |
| ---------------------------------------- | -------------------------------- |
| criar worklog (MEMBER)                   | `201`; aparece na lista          |
| editar worklog de outro (edit_own)       | `403`                            |
| editar worklog de outro (admin edit_all) | `200` + audit                    |
| GUEST cria worklog                       | `403`                            |
| timesheet de terceiro sem `view_all`     | `403`                            |
| start timer com timer já ativo           | `409`                            |
| stop timer                               | cria worklog com duração correta |
| worklog em issue de projeto restrito     | `403/404`                        |

### e2e

- Iniciar timer numa issue, parar, confirmar worklog; abrir timesheet semanal e
  ver as horas; registar manualmente via modal.

## Definition of Done

- [ ] 3 modelos + 2 campos de estimativa + seed de activity types.
- [ ] `duration.py` com testes partilhados back/front.
- [ ] Matriz de permissões `worklog.*` aplicada e testada.
- [ ] Timer único por user garantido por constraint + teste.
- [ ] Relatório FinOps-compatível; lint/format/types verdes.
