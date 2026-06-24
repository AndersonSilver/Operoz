# 01 — Modelo de Dados · Permission Scheme & Segurança

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Modelos (`db/models/permission_scheme.py`)

```python
class PermissionScheme(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  related_name="permission_schemes")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        db_table = "permission_schemes"


class ProjectRole(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  related_name="project_roles")
    name = models.CharField(max_length=80)        # Developer, QA, PM, Stakeholder
    is_system = models.BooleanField(default=False)

    class Meta:
        db_table = "project_roles"
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=Q(deleted_at__isnull=True),
                name="uq_project_role_ws_name"),
        ]


class PermissionGrant(BaseModel):
    scheme = models.ForeignKey(PermissionScheme, on_delete=models.CASCADE,
                               related_name="grants")
    permission_key = models.CharField(max_length=60, db_index=True)  # issue.create…
    # a quem se concede: papel, grupo, ou tipo especial (assignee/reporter)
    grant_type = models.CharField(max_length=20)   # role/group/special
    grant_ref = models.CharField(max_length=36, blank=True)  # role_id/group_id/keyword

    class Meta:
        db_table = "permission_grants"
        indexes = [models.Index(fields=["scheme", "permission_key"])]


class UserGroup(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  related_name="user_groups")
    name = models.CharField(max_length=120)
    class Meta:
        db_table = "user_groups"


class UserGroupMember(BaseModel):
    group = models.ForeignKey(UserGroup, on_delete=models.CASCADE,
                              related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name="group_memberships")
    class Meta:
        db_table = "user_group_members"
        constraints = [
            models.UniqueConstraint(
                fields=["group", "user"],
                condition=Q(deleted_at__isnull=True),
                name="uq_group_member"),
        ]


class SecurityLevel(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  related_name="security_levels")
    name = models.CharField(max_length=80)        # Internal Only, Confidential
    # quem pode ver issues com este nível
    members = models.JSONField(default=list)       # [{type: role/group/user, ref}]
    class Meta:
        db_table = "security_levels"


class AuditLogEntry(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  related_name="audit_log")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                              null=True, related_name="+")
    action = models.CharField(max_length=80)       # permission.changed, workflow.published…
    target_type = models.CharField(max_length=60)
    target_id = models.CharField(max_length=36)
    before = models.JSONField(default=dict)
    after = models.JSONField(default=dict)
    class Meta:
        db_table = "audit_log_entries"
        indexes = [models.Index(fields=["workspace", "action", "-created_at"])]
```

## Adições noutros modelos

```python
# Project: scheme + role assignments
Project.permission_scheme = FK(PermissionScheme, null=True, SET_NULL)
# ProjectRoleMember: liga (project, role, user/group)
# Issue.security_level = FK(SecurityLevel, null=True, SET_NULL)
```

## Catálogo de chaves (código — fonte única)

```python
# permissions/keys.py
PERMISSION_KEYS = [
    "project.browse", "project.admin", "project.manage_members",
    "issue.create", "issue.edit", "issue.delete", "issue.assign",
    "issue.transition", "issue.close", "issue.link", "issue.move",
    "issue.archive", "issue.set_security",
    "comment.create", "comment.edit_own", "comment.edit_all",
    "comment.delete_own", "comment.delete_all",
    "attachment.create", "attachment.delete_own", "attachment.delete_all",
    "worklog.create", "worklog.edit_own", "worklog.edit_all",
    "worklog.delete_own", "worklog.delete_all", "worklog.view_all",
    "view.create", "view.manage_shared",
    "automation.manage", "board.configure",
]
```

> As features 05 (worklog.*) e 03 (automation.manage) referenciam estas chaves —
> **uma só fonte**.

## Migração

- `00NN_permission_scheme.py`: tabelas + FKs aditivas. Data migration: criar
  scheme default que reproduz o comportamento atual (ADMIN tudo, MEMBER padrão,
  GUEST leitura) para não regredir.
