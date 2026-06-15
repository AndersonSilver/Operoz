from __future__ import annotations

from django.utils import timezone

from operis.assistant.indexing import index_playbook
from operis.db.models import BoardPlaybook


def publish_playbook(playbook: BoardPlaybook) -> BoardPlaybook:
    playbook.published_markdown = playbook.draft_markdown or ""
    playbook.published_version = (playbook.published_version or 0) + 1
    playbook.published_at = timezone.now()
    playbook.is_active = True
    playbook.save(
        update_fields=[
            "published_markdown",
            "published_version",
            "published_at",
            "is_active",
            "updated_at",
        ]
    )
    index_playbook(str(playbook.id))
    return playbook
