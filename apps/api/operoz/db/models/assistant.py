from django.conf import settings
from django.db import models

from .base import BaseModel


class AssistantSession(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="assistant_sessions",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assistant_sessions",
    )
    title = models.CharField(max_length=255, blank=True, default="")
    context = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "assistant_sessions"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["workspace", "user", "-created_at"], name="asst_sess_ws_user_idx"),
        ]

    def __str__(self) -> str:
        return self.title or str(self.id)


class AssistantMessage(BaseModel):
    ROLE_USER = "user"
    ROLE_ASSISTANT = "assistant"
    ROLE_TOOL = "tool"
    ROLE_SYSTEM = "system"
    ROLE_CHOICES = (
        (ROLE_USER, "User"),
        (ROLE_ASSISTANT, "Assistant"),
        (ROLE_TOOL, "Tool"),
        (ROLE_SYSTEM, "System"),
    )

    session = models.ForeignKey(
        AssistantSession,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    role = models.CharField(max_length=16, choices=ROLE_CHOICES)
    content = models.TextField(blank=True, default="")
    tool_calls = models.JSONField(default=list, blank=True)
    tool_call_id = models.CharField(max_length=128, blank=True, default="")
    citations = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "assistant_messages"
        ordering = ("created_at",)
        indexes = [
            models.Index(fields=["session", "created_at"], name="asst_msg_session_idx"),
        ]
