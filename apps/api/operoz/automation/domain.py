from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Any
from uuid import uuid4


@dataclass(frozen=True)
class DomainEvent:
    event_id: str
    event_type: str
    workspace_id: str
    board_id: str
    actor_id: str | None
    entity_type: str
    entity_id: str
    project_id: str | None
    payload: dict[str, Any]
    occurred_at: datetime
    automation_origin: bool = False

    @staticmethod
    def create(
        *,
        event_type: str,
        workspace_id: str,
        board_id: str,
        actor_id: str | None,
        entity_type: str,
        entity_id: str,
        project_id: str | None,
        payload: dict[str, Any],
        automation_origin: bool = False,
    ) -> "DomainEvent":
        return DomainEvent(
            event_id=str(uuid4()),
            event_type=event_type,
            workspace_id=str(workspace_id),
            board_id=str(board_id),
            actor_id=str(actor_id) if actor_id else None,
            entity_type=entity_type,
            entity_id=str(entity_id),
            project_id=str(project_id) if project_id else None,
            payload=payload,
            occurred_at=datetime.utcnow(),
            automation_origin=automation_origin,
        )

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["occurred_at"] = self.occurred_at.isoformat()
        return data

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "DomainEvent":
        occurred = data.get("occurred_at")
        if isinstance(occurred, str):
            occurred_at = datetime.fromisoformat(occurred.replace("Z", "+00:00"))
        else:
            occurred_at = occurred or datetime.utcnow()
        return cls(
            event_id=data["event_id"],
            event_type=data["event_type"],
            workspace_id=data["workspace_id"],
            board_id=data["board_id"],
            actor_id=data.get("actor_id"),
            entity_type=data["entity_type"],
            entity_id=data["entity_id"],
            project_id=data.get("project_id"),
            payload=data.get("payload") or {},
            occurred_at=occurred_at,
            automation_origin=bool(data.get("automation_origin", False)),
        )
