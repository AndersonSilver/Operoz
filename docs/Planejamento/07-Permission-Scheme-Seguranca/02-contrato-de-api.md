# 02 — Contrato de API · Permission Scheme & Segurança

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Endpoints

```text
# Permission schemes
GET/POST/PATCH/DELETE /api/workspaces/{slug}/permission-schemes/{id}/
GET    /api/workspaces/{slug}/permission-keys/          # catálogo (PERMISSION_KEYS)
POST   /api/workspaces/{slug}/permission-schemes/{id}/grants/
DELETE /api/workspaces/{slug}/permission-schemes/{id}/grants/{gid}/

# Project roles
GET/POST /api/workspaces/{slug}/project-roles/
POST   /api/workspaces/{slug}/projects/{pid}/role-members/   { role, user|group }

# Groups
GET/POST /api/workspaces/{slug}/groups/
POST   /api/workspaces/{slug}/groups/{id}/members/  { user_id }
DELETE /api/workspaces/{slug}/groups/{id}/members/{uid}/

# Security levels
GET/POST /api/workspaces/{slug}/security-levels/
PATCH  /api/workspaces/{slug}/projects/{pid}/issues/{iid}/   # issue.security_level

# Auth (instance-level, config)
GET/POST /auth/sso/saml/config/        # metadata IdP, certs
GET/POST /auth/sso/oidc/config/
POST   /auth/2fa/enroll/               # TOTP
POST   /auth/2fa/verify/

# Audit
GET    /api/workspaces/{slug}/audit-log/?action=&actor=&from=&to=
```

## Permissões (meta!)

| Ação | Regra |
| --- | --- |
| Gerir schemes/roles/groups/security-levels | `ROLE.ADMIN` (workspace) |
| Config SSO/2FA da instância | superuser / instance admin |
| Ver audit log | `ROLE.ADMIN` |
| Atribuir security level a issue | `issue.set_security` |

## Avaliação de permissão (núcleo)

```python
def has_permission(user, permission_key, project) -> bool:
    scheme = project.permission_scheme or default_scheme(project.workspace)
    if is_workspace_admin(user, project.workspace):
        return True
    for grant in scheme.grants.filter(permission_key=permission_key):
        if grant.grant_type == "role" and user_in_project_role(user, project, grant.grant_ref):
            return True
        if grant.grant_type == "group" and user_in_group(user, grant.grant_ref):
            return True
        if grant.grant_type == "special":  # assignee/reporter
            return matches_special(user, grant.grant_ref, context)
    return False
```

- Novo decorator `@require_permission("issue.edit")` complementa
  `@allow_permission` (papel base) com a chave fina.

## Security level (filtro de issues)

```python
def visible_security(user, workspace) -> Q:
    allowed = security_levels_for(user, workspace)   # níveis a que pertence
    return Q(security_level__isnull=True) | Q(security_level__in=allowed)
# Aplicado a TODAS as queries de issue (lista, OQL, board, dashboard).
```

## Exemplos

```jsonc
// POST grants/
{ "permission_key": "issue.delete", "grant_type": "role",
  "grant_ref": "<project_role_id:PM>" }

// GET audit-log/?action=permission.changed
{ "results": [ { "actor": "ana", "action": "permission.changed",
   "target_type": "permission_scheme", "before": {...}, "after": {...},
   "created_at": "2026-06-24T10:00:00Z" } ] }
```

## Notas

- `membersOf(group)` da OQL (feature 02) resolve via `UserGroup`.
- Mudança de permissão/scheme **sempre** gera `AuditLogEntry`.
