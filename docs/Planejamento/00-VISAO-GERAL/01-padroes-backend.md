# 01 — Padrões de Backend (Django REST)

Referência única para a camada Python. As features assumem estes padrões.

## 1. Modelos

### Hierarquia base (`db/models/base.py`)

```python
class BaseModel(AuditModel):
    id = models.UUIDField(default=uuid4, editable=False, primary_key=True)
    # AuditModel = TimeAuditModel + UserAuditModel + SoftDeleteModel
    # → created_at, updated_at, created_by, updated_by, deleted_at
    objects = SoftDeletionManager()      # filtra deleted_at__isnull=True
    all_objects = models.Manager()       # inclui soft-deleted

    class Meta:
        abstract = True
```

- **`ProjectBaseModel`** adiciona `project` FK e auto-preenche `workspace` no
  `save()`. Usar para tudo que pertence a um projeto (Issue, State, Worklog…).
- **`ChangeTrackerMixin`** quando precisar de `changed_fields`/`old_values`
  (ex.: registar histórico, time-in-status).

### Convenções de modelo

```python
class WorklogManager(SoftDeletionManager):
    def get_queryset(self):
        return super().get_queryset().select_related("issue", "author")

class Worklog(ProjectBaseModel):           # herda id/audit/soft-delete/workspace
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE,
                              related_name="worklogs")
    author = models.ForeignKey(settings.AUTH_USER_MODEL,
                               on_delete=models.SET_NULL, null=True,
                               related_name="worklogs")
    time_spent_seconds = models.PositiveIntegerField()
    started_at = models.DateTimeField()
    description = models.TextField(blank=True)
    is_billable = models.BooleanField(default=True)

    objects = WorklogManager()

    class Meta:
        verbose_name = "Worklog"
        db_table = "worklogs"
        ordering = ("-started_at",)
        indexes = [
            models.Index(fields=["issue", "author"]),
            models.Index(fields=["workspace", "started_at"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "author", "started_at"],
                condition=Q(deleted_at__isnull=True),   # soft-delete aware
                name="uq_worklog_issue_author_started",
            )
        ]
```

Regras:
- M2M sempre via **through-model explícito** (permite timestamps/audit), como
  `IssueAssignee`, `IssueLabel`.
- `UniqueConstraint` com `condition=Q(deleted_at__isnull=True)` para coexistir
  com soft-delete.
- `db_table` explícito e em snake_case plural.
- JSONField para config flexível e versionável (padrão do `BoardAutomationRule`).

## 2. Views (`app/views/base.py`)

```python
class WorklogViewSet(BaseViewSet):
    serializer_class = WorklogSerializer
    model = Worklog

    def get_queryset(self):
        return Worklog.objects.filter(
            workspace__slug=self.workspace_slug,
            issue_id=self.kwargs["issue_id"],
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id, issue_id):
        serializer = WorklogSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(workspace_id=..., project_id=project_id,
                        issue_id=issue_id, author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def list(self, request, slug, project_id, issue_id):
        return self.paginate(
            request=request,
            queryset=self.get_queryset(),
            on_results=lambda items: WorklogSerializer(items, many=True).data,
            default_per_page=50,
        )
```

- `BaseViewSet` já traz: auth de sessão, filter backends, tratamento de
  `IntegrityError`/`ValidationError`/`DoesNotExist` → HTTP, propriedades
  `workspace_slug`/`project_id`/`fields`/`expand`, e `paginate()`.
- Nunca apanhar exceções genéricas e engolir — deixar o `BaseViewSet` mapear.
- Optimizar querysets com `select_related`/`prefetch_related` no `get_queryset`.

## 3. Serializers (`app/serializers/base.py`)

```python
class WorklogSerializer(DynamicBaseSerializer):
    class Meta:
        model = Worklog
        fields = ["id", "issue", "author", "time_spent_seconds",
                  "started_at", "description", "is_billable",
                  "created_at", "updated_at"]
        read_only_fields = ["id", "author", "created_at", "updated_at"]
```

- `DynamicBaseSerializer` suporta `?expand=author,issue` para eager-load
  seletivo via serializers Lite.
- Validação de negócio em `validate_<campo>()`/`validate()`, nunca na view.

## 4. URLs (`app/urls/<feature>.py`)

```python
urlpatterns = [
    path("workspaces/<str:slug>/projects/<uuid:project_id>/issues/"
         "<uuid:issue_id>/worklogs/",
         WorklogViewSet.as_view({"get": "list", "post": "create"})),
    path(".../worklogs/<uuid:pk>/",
         WorklogViewSet.as_view({"patch": "partial_update",
                                 "delete": "destroy"})),
]
```

Registar o módulo em `app/urls/__init__.py` (importar `urlpatterns` e
espalhar na lista final).

## 5. Paginação (`utils/paginator.py`)

- Use `paginate()` do `BaseViewSet` (cursor-based). Resposta inclui
  `results`, `total_count`, `next_cursor`, `prev_cursor`, `total_pages`.
- Para agrupar (ex.: issues por estado no kanban) use `GroupedOffsetPaginator`
  (Window + RowNumber).

## 6. Migrações

- Sequenciais em `db/migrations/` (`00NN_<descrição>.py`).
- Uma migração por entrega lógica; nunca editar migrações já aplicadas.
- Migrações de dados pesadas → comando de gestão + Celery, não no `migrate`.

## 7. Tarefas assíncronas

- Trabalho > ~200ms ou I/O externo → Celery task (fila dedicada quando fizer
  sentido, ex.: `automation-worker`).
- Idempotência e retries com backoff; registar resultado para auditoria.

## Anti-padrões a evitar

- ❌ `Model.objects.all()` sem filtro de workspace.
- ❌ `delete()` físico em dados de utilizador.
- ❌ Lógica de negócio no serializer `create()` quando devia ser num serviço.
- ❌ Endpoint sem `@allow_permission`.
- ❌ SQL cru com interpolação de strings.
