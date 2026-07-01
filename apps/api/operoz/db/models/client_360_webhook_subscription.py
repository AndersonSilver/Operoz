import secrets

from django.db import models

from .base import BaseModel


def generate_webhook_secret() -> str:
    return secrets.token_hex(32)


class Client360WebhookSubscription(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="client_360_webhook_subscriptions",
    )
    url = models.URLField(max_length=512)
    secret = models.CharField(max_length=128, default=generate_webhook_secret)
    event_types = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "client_360_webhook_subscriptions"
        ordering = ("-created_at",)


class Client360WebhookDeliveryLog(BaseModel):
    STATUS_PENDING = "pending"
    STATUS_SUCCESS = "success"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_SUCCESS, "Success"),
        (STATUS_FAILED, "Failed"),
    )

    subscription = models.ForeignKey(
        Client360WebhookSubscription,
        on_delete=models.CASCADE,
        related_name="delivery_logs",
    )
    event_type = models.CharField(max_length=64)
    payload = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    response_code = models.PositiveSmallIntegerField(null=True, blank=True)
    error_message = models.TextField(blank=True, default="")
    attempt = models.PositiveSmallIntegerField(default=1)

    class Meta:
        db_table = "client_360_webhook_delivery_logs"
        ordering = ("-created_at",)
