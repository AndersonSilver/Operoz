from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from operis.db.models import IntakeIssue, Issue, User, Workspace


@dataclass
class AlertSubject:
    issue: Issue
    intake_issue: IntakeIssue | None = None


@dataclass
class AlertContext:
    subject: AlertSubject
    user: User
    alert_type: str
    workspace: Workspace
    extra: dict[str, Any] = field(default_factory=dict)
    issue_url: str = ""


@dataclass
class AlertResult:
    success: bool
    error: str = ""
