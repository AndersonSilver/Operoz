from uuid import uuid4

from django.db import models

from .base import BaseModel


def get_board_intake_form_anchor() -> str:
    return uuid4().hex


def default_board_intake_form_fields() -> list:
    return [
        {
            "id": "field-client",
            "field_type": "client",
            "label": "Cliente",
            "help_text": "",
            "required": True,
            "form_span": "full",
            "maps_to": "project_id",
        },
        {
            "id": "field-name",
            "field_type": "name",
            "label": "Resumo",
            "help_text": "",
            "required": True,
            "form_span": "full",
            "maps_to": "name",
        },
        {
            "id": "field-description",
            "field_type": "description",
            "label": "Descrição",
            "help_text": "",
            "required": False,
            "form_span": "full",
            "maps_to": "description_html",
        },
        {
            "id": "field-criticality",
            "field_type": "criticality",
            "label": "Criticidade",
            "help_text": "",
            "required": True,
            "form_span": "full",
        },
        {
            "id": "field-problem-started",
            "field_type": "datetime",
            "label": "Início do problema",
            "help_text": "",
            "required": True,
            "form_span": "full",
            "maps_to": "problem_started_at",
        },
        {
            "id": "field-sla-due",
            "field_type": "sla_due",
            "label": "SLA do chamado",
            "help_text": "",
            "required": False,
            "form_span": "full",
        },
        {
            "id": "field-ticket-number",
            "field_type": "ticket_number",
            "label": "Número do Chamado",
            "help_text": "",
            "required": False,
            "form_span": "full",
        },
    ]


class BoardIntakeFormTheme(models.TextChoices):
    DEFAULT = "default", "Default"
    MINIMAL = "minimal", "Minimal"
    SUPPORT = "support", "Support"
    INCIDENT = "incident", "Incident"


class BoardIntakeForm(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="board_intake_forms")
    board = models.ForeignKey("db.Board", on_delete=models.CASCADE, related_name="intake_forms")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    header_title = models.CharField(max_length=255, blank=True, default="")
    anchor = models.CharField(max_length=255, default=get_board_intake_form_anchor, unique=True, db_index=True)
    is_published = models.BooleanField(default=False)
    fields = models.JSONField(default=default_board_intake_form_fields)
    defaults = models.JSONField(default=dict, blank=True)
    submit_message = models.TextField(blank=True, default="")
    require_auth = models.BooleanField(default=False)
    theme = models.CharField(
        max_length=32,
        choices=BoardIntakeFormTheme.choices,
        default=BoardIntakeFormTheme.DEFAULT,
    )

    class Meta:
        verbose_name = "BoardIntakeForm"
        verbose_name_plural = "BoardIntakeForms"
        db_table = "board_intake_forms"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["board", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="board_intake_form_unique_name_board_when_deleted_at_null",
            )
        ]
        indexes = [
            models.Index(fields=["board", "is_published"]),
            models.Index(fields=["workspace", "board"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} <board={self.board_id}>"
