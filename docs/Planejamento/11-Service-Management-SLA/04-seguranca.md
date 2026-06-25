# 04 — Segurança · Service Management & SLA

Baseline em [`00-VISAO-GERAL/03-seguranca-transversal.md`](../00-VISAO-GERAL/03-seguranca-transversal.md).
Superfície dupla (interno + portal público) — o portal exige cuidado extra.

## Portal público (maior superfície de risco)

| Ameaça | Vetor | Mitigação |
| --- | --- | --- |
| Enumeração de pedidos | Adivinhar IDs de tickets | Token guest por sessão; cliente só vê os **seus** pedidos; IDs UUID |
| Spam/abuso | Criar pedidos em massa | Throttle por token/IP; CAPTCHA opcional; rate-limit |
| Escalada via portal | Tentar aceder a dados internos | Escopo do token mínimo: só request types + próprios pedidos; sem enumeração de workspace |
| Injeção via formulário | Payload no request form | Validação server-side (reusa validação de Intake); escapar no render |
| Fuga de PII | Pedido de um cliente visível a outro | Isolamento por token/identidade do solicitante |

- Portal segue o padrão guest existente (`Client360QbrGuestLink`): token opaco,
  TTL, revogação, cookie-less.

## SLA — integridade

| Ameaça | Vetor | Mitigação |
| --- | --- | --- |
| Manipular timer | Cliente/agente falsifica tempo | Timer é server-side; cálculo determinístico a partir de eventos e calendar |
| Pausa abusiva | Manter em "waiting" para mascarar breach | Auditar pausas; relatório de tempo pausado; estados de pausa configurados por admin |
| Escalation como vetor | Regra de escalation com webhook malicioso | Herda allowlist/sandbox da automação (feature 03) |

## Approvals

- Só quem está em `approvers` decide; verificação server-side.
- Decisão registada com ator e timestamp (audit); imutável depois de decidida.
- Approval que bloqueia workflow (feature 01) não pode ser contornada por
  transição direta na API.

## RBAC interno

- Configurar SLA/calendars/request types → board-admin (`board.configure`).
- Ver filas/SLA → agentes (MEMBER do board), recortado por board acessível.

## Validação

- `work_hours`/`holidays` com formato e intervalos válidos.
- `target_seconds` positivo; `metric`/`priority` em enums.
- `approvers` são membros do workspace.

## Auditoria

- Breach de SLA, pausas, decisões de aprovação e criação via portal entram em
  audit/atividade. Segredos (ex.: webhook de escalation) redigidos.
