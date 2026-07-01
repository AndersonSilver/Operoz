from __future__ import annotations

from django.db import transaction


def schedule_support_alert(
    *,
    intake_issue_id: str,
    alert_type: str,
    actor_id: str | None = None,
    extra: dict | None = None,
) -> None:
    """Queue support alert dispatch after commit; run inline if the broker is unavailable."""

    payload = {
        "intake_issue_id": intake_issue_id,
        "alert_type": alert_type,
        "actor_id": actor_id,
        "extra": extra,
    }

    def _dispatch() -> None:
        from operoz.bgtasks.alert_dispatch_task import dispatch_support_alert

        try:
            dispatch_support_alert.delay(**payload)
        except Exception:
            dispatch_support_alert(**payload)

    transaction.on_commit(_dispatch)
