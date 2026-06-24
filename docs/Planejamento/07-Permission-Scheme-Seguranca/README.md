# 07 — Permission Scheme & Segurança (P1)

> Pré-requisito: [`00-VISAO-GERAL`](../00-VISAO-GERAL/).

## Visão

O Operis tem RBAC funcional (`ROLE` ADMIN/MEMBER/GUEST + `BoardRolePermission`)
mas **menos granular** que os Permission Schemes do Jira (roadmap §16). Esta
feature traz permissões finas por projeto, grupos de utilizadores, security
levels por issue, e SSO/SAML — sem partir o RBAC existente, antes estendendo-o.

## Mapeamento ao roadmap

Cobre §16 (`16.1`–`16.14`): Permission Scheme, project roles, global permissions,
issue-level security, groups, SSO/SAML/OIDC, 2FA, audit log, sessões.

## Decisões-chave

| # | Decisão | Alternativa rejeitada |
| --- | --- | --- |
| 1 | Estender o mecanismo de chaves do `BoardRolePermission` para um `PermissionScheme` reutilizável | Sistema paralelo de permissões |
| 2 | `UserGroup` workspace-level usado em permissões e OQL `membersOf()` | Grupos ad-hoc |
| 3 | `SecurityLevel` por issue, opcional e aditivo | Tornar todas as issues restritas |
| 4 | SSO via biblioteca SAML/OIDC madura, config por instance | Implementar protocolo à mão |
| 5 | Audit log centralizado consumindo `created_by`/`updated_by` + eventos | Logs dispersos |

## Escopo

**Inclui:** PermissionScheme + chaves granulares, project roles, UserGroup,
SecurityLevel por issue, SSO/SAML/OIDC, 2FA TOTP, audit log central.

**Exclui:** field-level security (P3, fica como nota); IP allowlist (P3).

## Fases

1. **F1 — Schemes + roles:** PermissionScheme com ~20 chaves, project roles,
   `@require_permission` fino.
2. **F2 — Groups + security levels:** UserGroup, SecurityLevel por issue.
3. **F3 — SSO + 2FA + audit:** SAML/OIDC, TOTP, audit log central.

## Ficheiros

- [01-modelo-de-dados.md](./01-modelo-de-dados.md)
- [02-contrato-de-api.md](./02-contrato-de-api.md)
- [03-frontend.md](./03-frontend.md)
- [04-seguranca.md](./04-seguranca.md)
- [05-clean-code-e-testes.md](./05-clean-code-e-testes.md)

## Reuso

- `app/permissions/base.py` (`ROLE`, `@allow_permission`).
- `db/models/board_role.py` (`BoardRole`, `BoardRolePermission`,
  `BoardMemberRole`) como base do mecanismo de chaves.
- `authentication/` para integração SSO.
