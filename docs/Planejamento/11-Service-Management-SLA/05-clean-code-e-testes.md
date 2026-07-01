# 05 — Clean Code & Testes · Service Management & SLA

Baseline em [`00-VISAO-GERAL/04-clean-code-global.md`](../00-VISAO-GERAL/04-clean-code-global.md)
e [`05-estrategia-de-testes.md`](../00-VISAO-GERAL/05-estrategia-de-testes.md).

## Organização de ficheiros

```text
apps/api/operoz/
├── db/models/service_management.py     # BusinessCalendar, SlaGoal, SlaTimer, RequestType, ApprovalStep
├── service_management/
│   ├── business_time.py    # business_delta(start, end, calendar) (puro)
│   ├── sla.py              # start/pause/resume/evaluate timers
│   ├── escalation.py       # emite evento sla.at_risk (→ automação)
│   └── approvals.py
├── app/views/board/support_queue.py        # JÁ EXISTE — estender
├── app/views/board/support_sla_policy.py    # JÁ EXISTE — estender
└── space/.../portal.py                      # rotas públicas do portal
```

## Princípios específicos

- **`business_time.py` puro** — o cálculo de tempo útil (horário + feriados +
  pausas) é a parte mais subtil; isolá-lo torna-o testável exaustivamente.
- SLA timers reagem a eventos de transição (signal), não fazem polling caro;
  só a verificação de "em risco" é agendada.
- Escalation delega na automação (feature 03); approvals podem delegar no
  workflow (feature 01) — não duplicar motores.
- Portal reusa renderer/validação de Intake.

## Casos de teste

### Unit (business time — crítico)

| Caso                      | Esperado                         |
| ------------------------- | -------------------------------- |
| delta dentro do horário   | só conta horas úteis             |
| atravessa fim de semana   | salta sábado/domingo             |
| atravessa feriado         | exclui feriado                   |
| pausa e retoma            | subtrai tempo pausado            |
| timezone diferente        | cálculo correto no fuso          |
| breach exatamente no alvo | marca breached no instante certo |

### Integração

| Caso                                      | Esperado                  |
| ----------------------------------------- | ------------------------- |
| timer pausa ao entrar em "waiting"        | status=paused             |
| `at_risk` dispara automação               | regra de escalation corre |
| decidir aprovação sem ser approver        | `403`                     |
| transição bloqueada por approval pendente | `422`                     |
| portal: cliente vê só os seus pedidos     | sem enumeração            |
| portal: spam                              | throttled                 |

### e2e

- Criar política de SLA, abrir ticket via portal, ver o timer correr no app
  interno, pausar via estado e confirmar o cálculo.

## Definition of Done

- [ ] `business_time` puro com cobertura alta (fusos/feriados/pausas).
- [ ] Reuso de queue/SLA policy existentes (sem reescrever suporte).
- [ ] Escalation via automação; approvals integráveis no workflow.
- [ ] Portal guest seguro (token, throttle, isolamento) — testes bloqueantes.
- [ ] Lint/format/types verdes.
