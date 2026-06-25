# 04 — Segurança · Workflow Engine

Baseline em [`00-VISAO-GERAL/03-seguranca-transversal.md`](../00-VISAO-GERAL/03-seguranca-transversal.md).
Aqui só o que é específico do workflow.

## Threat-model específico

| Ameaça | Vetor | Mitigação |
| --- | --- | --- |
| Bypass de condição | Utilizador chama `execute/` numa transição que não devia poder | `check_conditions()` server-side **sempre**; a UI esconder não basta |
| Post-function como SSRF | `function_type=webhook` aponta para rede interna | Reusar `policy.webhook_allowed_domains` (allowlist) da automação |
| Escalonamento via post-function | `assign`/`update_field` altera campos restritos | Post-functions correm com ator de sistema mas respeitam permissões de campo |
| Workflow inconsistente em produção | Publicar grafo com estado órfão prende issues | Validação no `publish/`: todo estado alcançável + estado inicial único |
| Tampering do grafo | PUT graph de não-admin | `@allow_permission([ROLE.ADMIN], level="WORKSPACE")` |
| Transição cross-tenant | `to_state`/`from_state` de outro workspace | Validar que estados pertencem ao mesmo workspace do workflow |

## Enforcement RBAC

- **Configurar** workflow/scheme → `ROLE.ADMIN` (workspace).
- **Executar** transição → `ROLE.MEMBER` + condições da transição:
  - `assignee_only` → `request.user in issue.assignees`.
  - `reporter_only` → `request.user == issue.created_by`.
  - `role` → utilizador tem o papel exigido no projeto/board.
  - `group` → utilizador pertence ao grupo (feature 07).

## Validação de input

- `condition_type`/`validator_type`/`function_type` validados contra catálogo
  whitelisted (enum no código). Tipo desconhecido → `400`.
- `config` validado por schema por tipo (ex.: `webhook` exige `url` válida e em
  allowlist; `required_fields` exige IDs de campos do projeto).
- IDs de estados/campos no grafo verificados quanto a pertença ao workspace
  (anti-IDOR).

## Isolamento das post-functions

- `webhook` → mesma sandbox de saída da automação (allowlist + timeout).
- `fire_event` → entra no `dispatcher` da automação (feature 03), herdando
  rate-limit/circuit-breaker — evita loops workflow↔automação infinitos
  (guardar profundidade de cadeia de eventos).

## Auditoria

- Cada `execute/` regista `IssueActivity` (from_state, to_state, transition,
  ator, timestamp). Base para time-in-status (feature 08).
- `publish/` regista entrada de auditoria: quem publicou, versão, diff resumido.

## Concorrência

- `execute/` dentro de `transaction.atomic`; verificar `issue.state` atual
  contra o esperado (optimistic) → `409` se mudou, evitando transições
  duplicadas em corrida.

## Rollback

- Projetos sem `workflow_scheme` usam o comportamento atual (mudança de estado
  livre). A feature é aditiva e desligável por projeto.
- Despublicar um workflow reverte para o anterior `published_version`.
