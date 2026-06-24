# 03 — Frontend · Permission Scheme & Segurança

Padrões em [`00-VISAO-GERAL/02-padroes-frontend.md`](../00-VISAO-GERAL/02-padroes-frontend.md).

## Componentes

```text
core/components/settings/permissions/
├── permission-scheme-list.tsx
├── permission-matrix.tsx       # grelha: chaves × (papéis/grupos/special)
├── project-roles-editor.tsx
├── group-manager.tsx           # grupos + membros
├── security-levels-editor.tsx
└── audit-log-viewer.tsx        # filtros + tabela (TanStack + Virtual)

core/components/settings/auth/
├── sso-saml-config.tsx
├── sso-oidc-config.tsx
└── two-factor-enroll.tsx       # QR code TOTP
```

- **`permission-matrix`** é o ecrã central: uma grelha onde cada célula
  (chave × grantee) é um toggle. Lê `permission-keys/` para as linhas.
- **`audit-log-viewer`** com filtros por ação/ator/data; cada entrada mostra
  diff before/after.

## Store

```text
core/store/permissions/permission.store.ts → PermissionStore
```

- `schemes`, `keys`, `groups`, `securityLevels`, `auditLog`. Actions CRUD.
- **`can(permissionKey, projectId)`** — `computedFn` central que a UI usa para
  esconder/desabilitar ações (a verificação real é sempre no servidor).

## Service

`permission.service.ts`: schemes, grants, roles, roleMembers, groups,
groupMembers, securityLevels, auditLog. `auth.service.ts`: ssoSamlConfig,
ssoOidcConfig, enroll2fa, verify2fa.

## Tipos (`@operis/types`)

```ts
export type TPermissionKey = string;
export type TPermissionGrant = {
  id: string; permission_key: TPermissionKey;
  grant_type: "role" | "group" | "special"; grant_ref: string;
};
export type TAuditEntry = {
  actor: string; action: string; target_type: string;
  before: unknown; after: unknown; created_at: string;
};
```

## Rotas

```text
:workspaceSlug/settings/permissions
:workspaceSlug/settings/permissions/schemes/:id
:workspaceSlug/settings/groups
:workspaceSlug/settings/security-levels
:workspaceSlug/settings/audit-log
:workspaceSlug/settings/sso
settings/profile/security          → 2FA enrollment
```

## i18n (pt-BR)

`perm.matrix.title`, `perm.key.issue.delete`, `perm.group.add`,
`security.level.confidential`, `audit.action.permission_changed`, etc.

## UX

- A UI usa `can()` só para **conveniência** (esconder botões). Nunca é a
  fronteira de segurança — o servidor decide.
- Matriz com agrupamento de chaves por categoria (Issues, Comentários, Worklog…).
- 2FA com QR + códigos de recuperação.
