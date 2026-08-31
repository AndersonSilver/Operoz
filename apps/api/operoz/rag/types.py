from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from operoz.db.models import User, Workspace


@dataclass(frozen=True)
class AssistantActorContext:
    user: User
    workspace: Workspace
    board_slug: str | None = None
    project_id: str | None = None

    def context_dict(self) -> dict[str, Any]:
        out: dict[str, Any] = {"workspace_slug": self.workspace.slug}
        if self.board_slug:
            out["board_slug"] = self.board_slug
        if self.project_id:
            out["project_id"] = self.project_id
        return out


@dataclass
class ToolResult:
    ok: bool
    data: dict[str, Any] = field(default_factory=dict)
    error: str | None = None
    citations: list[dict[str, Any]] = field(default_factory=list)

    def to_llm_content(self) -> str:
        if not self.ok:
            return f'{{"ok": false, "error": "{self.error or "access_denied"}"}}'
        import json

        return json.dumps({"ok": True, **self.data}, default=str)
