from django.db import models
from django.db.models import Q

from .base import BaseModel


class BoardAutomationRule(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="board_automation_rules")
    board = models.ForeignKey("db.Board", on_delete=models.CASCADE, related_name="automation_rules")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    enabled = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    graph = models.JSONField(default=dict)
    graph_version = models.PositiveSmallIntegerField(default=1)
    published_graph = models.JSONField(default=dict)
    published_version = models.PositiveIntegerField(default=0)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "board_automation_rules"
        ordering = ("sort_order", "-created_at")
        indexes = [
            models.Index(fields=["board", "enabled"]),
            models.Index(fields=["workspace", "board"]),
            models.Index(fields=["board", "published_version"]),
        ]

    def __str__(self) -> str:
        return self.name


class BoardAutomationRuleRevision(BaseModel):
    KIND_DRAFT = "draft"
    KIND_PUBLISHED = "published"
    KIND_CHOICES = [
        (KIND_DRAFT, "Draft"),
        (KIND_PUBLISHED, "Published"),
    ]

    rule = models.ForeignKey(BoardAutomationRule, on_delete=models.CASCADE, related_name="revisions")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="board_automation_revisions")
    board = models.ForeignKey("db.Board", on_delete=models.CASCADE, related_name="automation_rule_revisions")
    kind = models.CharField(max_length=16, choices=KIND_CHOICES)
    graph = models.JSONField(default=dict)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    graph_version = models.PositiveSmallIntegerField(default=1)

    class Meta:
        db_table = "board_automation_rule_revisions"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["rule", "created_at"]),
            models.Index(fields=["board", "kind", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.rule_id} — {self.kind} ({self.created_at})"


class BoardAutomationRun(BaseModel):
    STATUS_PENDING = "pending"
    STATUS_RUNNING = "running"
    STATUS_SUCCESS = "success"
    STATUS_FAILED = "failed"
    STATUS_SKIPPED = "skipped"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_RUNNING, "Running"),
        (STATUS_SUCCESS, "Success"),
        (STATUS_FAILED, "Failed"),
        (STATUS_SKIPPED, "Skipped"),
    ]

    rule = models.ForeignKey(BoardAutomationRule, on_delete=models.CASCADE, related_name="runs")
    board = models.ForeignKey("db.Board", on_delete=models.CASCADE, related_name="automation_runs")
    event_id = models.CharField(max_length=128)
    event_type = models.CharField(max_length=64)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    dry_run = models.BooleanField(default=False)
    context_snapshot = models.JSONField(default=dict)
    graph_snapshot = models.JSONField(default=dict)
    graph_version = models.PositiveSmallIntegerField(default=1)
    correlation_id = models.CharField(max_length=128, blank=True, default="")
    step_logs = models.JSONField(default=list)
    error_message = models.TextField(blank=True, default="")
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "board_automation_runs"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["board", "status"]),
            models.Index(fields=["rule", "created_at"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["rule", "event_id"],
                condition=Q(dry_run=False),
                name="board_automation_run_rule_event_unique",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.rule_id} — {self.event_type} ({self.status})"


class BoardAutomationOutbox(BaseModel):
    STATUS_PENDING = "pending"
    STATUS_ENQUEUED = "enqueued"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_ENQUEUED, "Enqueued"),
        (STATUS_FAILED, "Failed"),
    ]

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="automation_outbox")
    board = models.ForeignKey("db.Board", on_delete=models.CASCADE, related_name="automation_outbox")
    rule = models.ForeignKey(BoardAutomationRule, on_delete=models.CASCADE, related_name="outbox_entries")
    event_id = models.CharField(max_length=128)
    event_payload = models.JSONField(default=dict)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    error_message = models.TextField(blank=True, default="")
    enqueued_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "board_automation_outbox"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["board", "event_id"]),
        ]


class BoardAutomationDeadLetter(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="automation_dlq")
    board = models.ForeignKey("db.Board", on_delete=models.CASCADE, related_name="automation_dlq")
    rule = models.ForeignKey(
        BoardAutomationRule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dead_letters",
    )
    event_id = models.CharField(max_length=128)
    event_payload = models.JSONField(default=dict)
    error_message = models.TextField(blank=True, default="")
    traceback_text = models.TextField(blank=True, default="")
    retry_count = models.PositiveSmallIntegerField(default=0)
    celery_task_id = models.CharField(max_length=128, blank=True, default="")

    class Meta:
        db_table = "board_automation_dead_letters"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["board", "created_at"]),
            models.Index(fields=["workspace", "created_at"]),
        ]


class BoardAutomationSecret(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="automation_secrets")
    key = models.CharField(max_length=128)
    value_encrypted = models.TextField()
    description = models.TextField(blank=True, default="")

    class Meta:
        db_table = "board_automation_secrets"
        ordering = ("key",)
        constraints = [
            models.UniqueConstraint(fields=["workspace", "key"], name="board_automation_secret_workspace_key_unique"),
        ]
