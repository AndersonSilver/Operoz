from uuid import uuid4

from django.db import models

from operoz.db.models.project import ProjectBaseModel


def get_intake_form_anchor() -> str:
    return uuid4().hex


def default_intake_form_fields() -> list:
    return [
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
    ]


class IntakeForm(ProjectBaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    header_title = models.CharField(max_length=255, blank=True)
    anchor = models.CharField(max_length=255, default=get_intake_form_anchor, unique=True, db_index=True)
    is_published = models.BooleanField(default=False)
    fields = models.JSONField(default=default_intake_form_fields)
    defaults = models.JSONField(default=dict, blank=True)
    submit_message = models.TextField(blank=True, default="")
    require_auth = models.BooleanField(default=False)

    class Meta:
        verbose_name = "IntakeForm"
        verbose_name_plural = "IntakeForms"
        db_table = "intake_forms"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["project", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="intake_form_unique_name_project_when_deleted_at_null",
            )
        ]

    def __str__(self) -> str:
        return f"{self.name} <{self.project_id}>"
