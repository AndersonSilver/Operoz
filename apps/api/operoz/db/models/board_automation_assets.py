from django.db import models

from .base import BaseModel


class BoardAutomationScript(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="board_automation_scripts")
    board = models.ForeignKey("db.Board", on_delete=models.CASCADE, related_name="automation_scripts")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    source_code = models.TextField(default="")
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "board_automation_scripts"
        ordering = ("name",)
        indexes = [
            models.Index(fields=["board", "is_active"]),
        ]

    def __str__(self) -> str:
        return self.name


class BoardAutomationEmailTemplate(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="board_automation_email_templates"
    )
    board = models.ForeignKey("db.Board", on_delete=models.CASCADE, related_name="automation_email_templates")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    subject = models.CharField(max_length=500, default="")
    html_body = models.TextField(default="")
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "board_automation_email_templates"
        ordering = ("name",)
        indexes = [
            models.Index(fields=["board", "is_active"]),
        ]

    def __str__(self) -> str:
        return self.name
