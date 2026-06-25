# 04 — Segurança · Time Tracking

Baseline em [`00-VISAO-GERAL/03-seguranca-transversal.md`](../00-VISAO-GERAL/03-seguranca-transversal.md).

## Threat-model específico

| Ameaça | Vetor | Mitigação |
| --- | --- | --- |
| Editar horas de outro | PATCH worklog de outro autor | `worklog.edit_own` verifica `author == request.user`; `edit_all` só ADMIN |
| Ver horas de toda a equipa | GET timesheet de outro user | `worklog.view_all`; senão só o próprio |
| Inflar horas (fraude) | `time_spent_seconds` absurdo | Validação: `> 0` e `<= 24h`/dia; soma diária plausível |
| Worklog em issue sem acesso | `issue_id` de projeto restrito | Verificar pertença da issue ao workspace/projeto acessível |
| Timer duplicado | Vários separadores | `UniqueConstraint` parcial (um timer ativo por user) |
| Manipular `started_at` | Data no futuro/passado distante | Validar intervalo razoável; `started_at <= now` |
| Fuga via relatório | `reports/time/` de projeto restrito | Filtrar por projetos acessíveis ao utilizador |

## RBAC (matriz)

```text
worklog.create     → MEMBER (cria os seus)
worklog.edit_own   → MEMBER (só author == user)
worklog.edit_all   → ADMIN / project lead
worklog.delete_own → MEMBER
worklog.delete_all → ADMIN
worklog.view_all   → ADMIN / lead (timesheet de terceiros)
```

- Implementar via decorator `@allow_permission` + verificação de `author` na
  action; granularidade fina reusa `BoardRolePermission` (feature 07).

## Validação de input

- Duração: inteiro positivo, teto diário; rejeitar overflow.
- `started_at`: ISO, não-futuro, dentro de janela razoável.
- `activity_type`/`issue`: pertencem ao workspace do request.

## Privacidade

- Horas e faturabilidade podem ser sensíveis (custo/cliente). `reports/time/` e
  timesheet de terceiros são restritos a admin/lead.
- Não expor `is_billable`/custo em endpoints acessíveis a guest.

## Integração FinOps

- Ao alimentar o Cliente 360 FinOps, garantir que o consumidor (perfil FinOps)
  também valida acesso — o relatório de horas não é um bypass para dados de
  custo restritos.

## Auditoria

- Audit nativo (`created_by`/`updated_by`) em cada worklog.
- Edições de worklog por `edit_all` (admin a alterar horas de outrem) devem
  registar entrada de auditoria explícita (quem alterou o quê).
