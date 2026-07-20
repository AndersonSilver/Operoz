# Django imports
from django.db import models

# Module imports
from operoz.db.models.project import ProjectBaseModel


class Intake(ProjectBaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(verbose_name="Intake Description", blank=True)
    is_default = models.BooleanField(default=False)
    view_props = models.JSONField(default=dict)
    logo_props = models.JSONField(default=dict)

    def __str__(self):
        """Return name of the intake"""
        return f"{self.name} <{self.project.name}>"

    class Meta:
        unique_together = ["name", "project", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "project"],
                condition=models.Q(deleted_at__isnull=True),
                name="intake_unique_name_project_when_deleted_at_null",
            )
        ]
        verbose_name = "Intake"
        verbose_name_plural = "Intakes"
        db_table = "intakes"
        ordering = ("name",)


class SourceType(models.TextChoices):
    IN_APP = "IN_APP"
    PUBLIC_FORM = "PUBLIC_FORM"
    EMAIL = "EMAIL"
    DISCORD = "DISCORD"


class IntakeTicketKind(models.TextChoices):
    INTAKE = "intake", "Intake"
    SUPPORT = "support", "Support"


class IntakeIssueStatus(models.IntegerChoices):
    PENDING = -2
    REJECTED = -1
    SNOOZED = 0
    ACCEPTED = 1
    DUPLICATE = 2
    CLOSED = 3


class IntakeOutcome(models.TextChoices):
    CONVERTED = "converted", "Convertido"
    CONSULTING = "consulting", "Consultoria"
    DEFERRED = "deferred", "Não priorizado"
    REJECTED = "rejected", "Recusado"


class IntakeIssue(ProjectBaseModel):
    intake = models.ForeignKey("db.Intake", related_name="issue_intake", on_delete=models.CASCADE)
    issue = models.ForeignKey("db.Issue", related_name="issue_intake", on_delete=models.CASCADE)
    status = models.IntegerField(
        choices=(
            (-2, "Pending"),
            (-1, "Rejected"),
            (0, "Snoozed"),
            (1, "Accepted"),
            (2, "Duplicate"),
            (3, "Closed"),
        ),
        default=-2,
    )
    snoozed_till = models.DateTimeField(null=True)
    support_queue = models.ForeignKey(
        "db.BoardSupportQueue",
        related_name="intake_issues",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    duplicate_to = models.ForeignKey(
        "db.Issue",
        related_name="intake_duplicate",
        on_delete=models.SET_NULL,
        null=True,
    )
    source = models.CharField(max_length=255, default="IN_APP", null=True, blank=True)
    source_email = models.TextField(blank=True, null=True)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)
    extra = models.JSONField(default=dict)
    intake_form = models.ForeignKey(
        "db.IntakeForm",
        related_name="submissions",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    board_intake_form = models.ForeignKey(
        "db.BoardIntakeForm",
        related_name="submissions",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    ticket_kind = models.CharField(
        max_length=16,
        choices=IntakeTicketKind.choices,
        default=IntakeTicketKind.SUPPORT,
        db_index=True,
    )
    # E1 — cross-project convert tracking
    converted_to_issue = models.ForeignKey(
        "db.Issue",
        related_name="intake_converted_origin",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    # E2 — typed outcomes
    outcome = models.CharField(
        max_length=16,
        choices=IntakeOutcome.choices,
        null=True,
        blank=True,
        db_index=True,
    )
    outcome_note = models.TextField(blank=True, null=True)
    deferred_until = models.DateField(null=True, blank=True)
    # E5 — "pedir complemento" flag (stays PENDING but signals requester)
    awaiting_info = models.BooleanField(default=False)

    class Meta:
        verbose_name = "IntakeIssue"
        verbose_name_plural = "IntakeIssues"
        db_table = "intake_issues"
        ordering = ("-created_at",)

    def __str__(self):
        """Return name of the Issue"""
        return f"{self.issue.name} <{self.intake.name}>"
