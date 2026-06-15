import secrets

from django.db import models

from .base import BaseModel


def generate_prd_review_invite_token() -> str:
    return f"operoz_prd_{secrets.token_urlsafe(32)}"


class PageReviewSession(BaseModel):
    STATUS_DRAFT = "draft"
    STATUS_SENT = "sent"
    STATUS_APPROVED = "approved"
    STATUS_CHANGES_REQUESTED = "changes_requested"
    STATUS_CHOICES = (
        (STATUS_DRAFT, "Draft"),
        (STATUS_SENT, "Sent"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_CHANGES_REQUESTED, "Changes requested"),
    )

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="page_review_sessions")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="page_review_sessions")
    page = models.ForeignKey("db.Page", on_delete=models.CASCADE, related_name="review_sessions")
    page_version = models.ForeignKey(
        "db.PageVersion",
        on_delete=models.SET_NULL,
        related_name="review_sessions",
        null=True,
        blank=True,
    )
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_DRAFT, db_index=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "page_review_sessions"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["page", "status"]),
            models.Index(fields=["workspace", "project"]),
        ]

    def __str__(self) -> str:
        return f"PageReviewSession page={self.page_id} status={self.status}"


class PageReviewInvite(BaseModel):
    session = models.ForeignKey(PageReviewSession, on_delete=models.CASCADE, related_name="invites")
    email = models.EmailField(max_length=255, db_index=True)
    token = models.CharField(max_length=128, unique=True, default=generate_prd_review_invite_token, db_index=True)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(null=True, blank=True)
    last_access_at = models.DateTimeField(null=True, blank=True)
    access_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "page_review_invites"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["session", "email"]),
            models.Index(fields=["expires_at"]),
        ]

    def __str__(self) -> str:
        return f"PageReviewInvite {self.email} session={self.session_id}"


class PageReviewComment(BaseModel):
    TYPE_SECTION = "section"
    TYPE_INLINE = "inline"
    TYPE_CHOICES = (
        (TYPE_SECTION, "Section"),
        (TYPE_INLINE, "Inline"),
    )

    session = models.ForeignKey(PageReviewSession, on_delete=models.CASCADE, related_name="comments")
    comment_type = models.CharField(max_length=16, choices=TYPE_CHOICES, db_index=True)
    section_id = models.CharField(max_length=255)
    quote = models.TextField(blank=True, default="")
    anchor = models.JSONField(default=dict, blank=True)
    body = models.TextField()
    author_email = models.EmailField(max_length=255)

    class Meta:
        db_table = "page_review_comments"
        ordering = ("created_at",)
        indexes = [
            models.Index(fields=["session", "comment_type"]),
            models.Index(fields=["session", "section_id"]),
        ]

    def __str__(self) -> str:
        return f"PageReviewComment {self.comment_type} session={self.session_id}"


class PageReviewEvent(BaseModel):
    EVENT_OPENED = "opened"
    EVENT_COMMENTED = "commented"
    EVENT_APPROVED = "approved"
    EVENT_FEEDBACK_SUBMITTED = "feedback_submitted"
    EVENT_INVITE_CREATED = "invite_created"
    EVENT_SESSION_SENT = "session_sent"
    EVENT_CHOICES = (
        (EVENT_OPENED, "Opened"),
        (EVENT_COMMENTED, "Commented"),
        (EVENT_APPROVED, "Approved"),
        (EVENT_FEEDBACK_SUBMITTED, "Feedback submitted"),
        (EVENT_INVITE_CREATED, "Invite created"),
        (EVENT_SESSION_SENT, "Session sent"),
    )

    session = models.ForeignKey(PageReviewSession, on_delete=models.CASCADE, related_name="events")
    event_type = models.CharField(max_length=32, choices=EVENT_CHOICES, db_index=True)
    payload = models.JSONField(default=dict, blank=True)
    actor_email = models.EmailField(max_length=255, blank=True, default="")

    class Meta:
        db_table = "page_review_events"
        ordering = ("created_at",)
        indexes = [models.Index(fields=["session", "event_type"])]

    def __str__(self) -> str:
        return f"PageReviewEvent {self.event_type} session={self.session_id}"
