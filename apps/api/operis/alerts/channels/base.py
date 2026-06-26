from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

from operis.alerts.types import AlertContext, AlertResult

if TYPE_CHECKING:
    from operis.db.models import User, Workspace


class BaseAlertChannel(ABC):
    channel_type: str = ""

    @abstractmethod
    def send(self, context: AlertContext) -> AlertResult:
        """Send alert to user via this channel."""

    def validate_account(self, user: User, workspace: Workspace) -> bool:
        return True
