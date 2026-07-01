# 03 — Frontend · Service Management & SLA

Padrões em [`00-VISAO-GERAL/02-padroes-frontend.md`](../00-VISAO-GERAL/02-padroes-frontend.md).
Há duas superfícies: **app interno** (agentes) e **portal público** (`apps/space`).

## App interno

```text
core/components/service-management/
├── queue-view.tsx              # lista de tickets da fila (SLA visível por linha)
├── sla-badge.tsx               # tempo restante / breached (cor por estado)
├── sla-policy-editor.tsx       # metas por prioridade + calendar
├── business-calendar-editor.tsx# horário + feriados
├── request-type-manager.tsx
└── approval-panel.tsx          # aprovar/rejeitar na issue
```

- **`sla-badge`** mostra contagem decrescente de business time; vermelho quando
  breached, âmbar quando em risco. Usado na fila e no issue detail.
- **`queue-view`** reusa a lista de issues com colunas extra de SLA e ordenação
  por urgência/tempo restante.

## Portal público (`apps/space`)

```text
apps/space/.../portal/
├── portal-home.tsx             # escolher request type
├── request-form.tsx            # formulário (reusa intake form renderer)
├── my-requests.tsx             # estado dos pedidos do cliente
└── request-detail.tsx
```

- Reusa o renderer de Intake form existente; o portal é leve e cookie-less
  (token na URL).

## Store

```text
core/store/service-management/sla.store.ts → SlaStore (timers por issue)
core/store/service-management/queue.store.ts → QueueStore
```

## Service

`service-management.service.ts`: `slaPolicies`, `slaGoals`, `businessCalendars`,
`issueSla`, `queues`, `queueIssues`, `requestTypes`, `approvals`, `decide`.
Portal usa um `portal.service.ts` separado (rotas públicas).

## Tipos (`@operoz/types`)

```ts
export type TSlaTimer = {
  metric: string;
  status: "running" | "paused" | "met" | "breached";
  remaining_seconds?: number;
  breach_at?: string;
};
```

## Rotas

```text
:workspaceSlug/boards/:boardSlug/filas            # já há base de sustentação
:workspaceSlug/settings/boards/:boardSlug/sustentacao  # já existe
# Portal: app space, rota /portal/:token
```

## i18n (pt-BR)

`sla.remaining`, `sla.breached`, `sla.at_risk`, `queue.title`,
`request_type.report_bug`, `approval.approve`, etc.

## UX

- SLA badge com cor e tooltip do alvo/calendar.
- Fila ordenável por tempo restante; agrupar por prioridade/tipo.
- Portal simples e brandável (segue o estilo do Space).
