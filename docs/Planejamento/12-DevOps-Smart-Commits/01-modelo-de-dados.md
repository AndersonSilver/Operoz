# 01 — Modelo de Dados · DevOps & Smart Commits

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## 1. Integração existente (reuso)

```python
# db/models/integration/github.py — JÁ EXISTE (sync issues/comments)
# db/models/integration/base.py, slack.py — padrão de integração
# db/models/deploy_board.py — DeployBoard (reuso p/ deployments)
```

## 2. DevLink — eventos Git normalizados (agnóstico do provider)

```python
class DevLink(BaseModel):
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE,
                              related_name="dev_links")
    provider = models.CharField(max_length=20)     # github/gitlab
    link_type = models.CharField(max_length=20)    # branch/pull_request/commit
    external_id = models.CharField(max_length=200) # PR number, sha, branch name
    title = models.CharField(max_length=500, blank=True)
    url = models.URLField()
    state = models.CharField(max_length=30, blank=True)  # open/merged/closed/…
    review_state = models.CharField(max_length=30, blank=True)  # approved/changes_requested
    author_external = models.CharField(max_length=200, blank=True)
    metadata = models.JSONField(default=dict)      # extra do provider
    occurred_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "dev_links"
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "provider", "link_type", "external_id"],
                condition=Q(deleted_at__isnull=True),
                name="uq_dev_link"),
        ]
        indexes = [models.Index(fields=["issue", "link_type"])]
```

## 3. Build / CI status

```python
class BuildStatus(BaseModel):
    dev_link = models.ForeignKey(DevLink, on_delete=models.CASCADE,
                                 related_name="builds", null=True)
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE,
                              related_name="builds")
    name = models.CharField(max_length=120)        # CI pipeline
    status = models.CharField(max_length=20)       # pending/success/failed
    url = models.URLField(blank=True)
    class Meta:
        db_table = "build_statuses"


class Deployment(BaseModel):
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE,
                              related_name="deployments")
    environment = models.CharField(max_length=40)  # staging/production
    state = models.CharField(max_length=20)        # in_progress/deployed/failed
    deployed_at = models.DateTimeField(null=True, blank=True)
    url = models.URLField(blank=True)
    class Meta:
        db_table = "deployments"
        indexes = [models.Index(fields=["issue", "environment"])]
```

## 4. Smart commit — auditoria

```python
class SmartCommitLog(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  related_name="smart_commit_logs")
    issue = models.ForeignKey("db.Issue", on_delete=models.SET_NULL, null=True,
                              related_name="smart_commit_logs")
    commit_sha = models.CharField(max_length=64)
    committer_external = models.CharField(max_length=200)
    resolved_user = models.ForeignKey(settings.AUTH_USER_MODEL,
                                      on_delete=models.SET_NULL, null=True, related_name="+")
    commands = models.JSONField(default=list)      # [{cmd, args, applied, error}]
    class Meta:
        db_table = "smart_commit_logs"
```

## Design

- **`DevLink` normalizado:** GitHub e GitLab mapeiam para o mesmo modelo — o
  development panel é provider-agnóstico.
- **Smart commit auditado:** cada comando aplicado fica registado (sucesso/erro),
  essencial para confiança e depuração.
- **Deployments** podem também ligar-se ao `DeployBoard` existente para vista
  agregada no board.

## Migração

- `00NN_devops.py`: DevLink, BuildStatus, Deployment, SmartCommitLog. Aditivo.
