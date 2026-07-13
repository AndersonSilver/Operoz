from __future__ import annotations

import json
from collections import defaultdict
from datetime import date, timedelta

from celery import shared_task
from django.core.mail import EmailMultiAlternatives, get_connection
from django.utils import timezone

from operoz.alerts.email_renderer import render_digest_email
from operoz.license.utils.instance_value import get_email_configuration
from operoz.settings.redis import redis_instance


def _digest_key(*, user_id: str, workspace_id: str, day: date) -> str:
    return f"alert:digest:{workspace_id}:{user_id}:{day.isoformat()}"


def queue_alert_for_digest(*, user_id: str, workspace_id: str, payload: dict) -> None:
    try:
        ri = redis_instance()
        key = _digest_key(user_id=user_id, workspace_id=workspace_id, day=timezone.localdate())
        ri.rpush(key, json.dumps(payload))
        ri.expire(key, 86400 * 2)
    except Exception:
        pass


@shared_task
def send_daily_alert_digests() -> None:
    """Send batched digest emails for users with digest_daily preference."""
    from operoz.db.models import UserNotificationPreference, Workspace

    today = timezone.localdate()
    try:
        ri = redis_instance()
    except Exception:
        return

    for workspace in Workspace.objects.filter(deleted_at__isnull=True).iterator(chunk_size=100):
        prefs = UserNotificationPreference.objects.filter(
            workspace_id=workspace.id,
            deleted_at__isnull=True,
        ).select_related("user")
        for pref in prefs:
            channels = pref.channels or {}
            email_cfg = channels.get("email") or {}
            if email_cfg.get("frequency") != "digest_daily":
                continue
            if not email_cfg.get("enabled", True):
                continue
            user = pref.user
            if not user.is_active or not user.email:
                continue
            key = _digest_key(user_id=str(user.id), workspace_id=str(workspace.id), day=today)
            raw_items = ri.lrange(key, 0, -1)
            if not raw_items:
                continue
            items = [json.loads(item) for item in raw_items]
            subject, html, text = render_digest_email(
                user_name=user.display_name or user.email,
                items=items,
                workspace_slug=workspace.slug,
            )
            (
                EMAIL_HOST,
                EMAIL_HOST_USER,
                EMAIL_HOST_PASSWORD,
                EMAIL_PORT,
                EMAIL_USE_TLS,
                EMAIL_USE_SSL,
                EMAIL_FROM,
            ) = get_email_configuration()
            connection = get_connection(
                host=EMAIL_HOST,
                port=int(EMAIL_PORT),
                username=EMAIL_HOST_USER,
                password=EMAIL_HOST_PASSWORD,
                use_tls=EMAIL_USE_TLS == "1",
                use_ssl=EMAIL_USE_SSL == "1",
            )
            msg = EmailMultiAlternatives(subject, text, EMAIL_FROM, [user.email], connection=connection)
            msg.attach_alternative(html, "text/html")
            msg.send()
            ri.delete(key)


@shared_task
def send_weekly_stale_card_digest() -> None:
    """Every Monday: email each assignee their list of stale open cards (no update > 3 days)."""
    from operoz.db.models import Issue, Workspace

    now = timezone.now()
    stale_cutoff = now - timedelta(days=3)

    (
        EMAIL_HOST,
        EMAIL_HOST_USER,
        EMAIL_HOST_PASSWORD,
        EMAIL_PORT,
        EMAIL_USE_TLS,
        EMAIL_USE_SSL,
        EMAIL_FROM,
    ) = get_email_configuration()

    for workspace in Workspace.objects.filter(deleted_at__isnull=True).iterator(chunk_size=100):
        stale_issues = list(
            Issue.objects.filter(
                workspace_id=workspace.id,
                deleted_at__isnull=True,
                updated_at__lt=stale_cutoff,
            )
            .exclude(state__group__in=["completed", "cancelled"])
            .select_related("project", "state")
            .prefetch_related("assignees")
        )
        if not stale_issues:
            continue

        by_assignee: dict = defaultdict(list)
        for issue in stale_issues:
            for assignee in issue.assignees.all():
                if assignee.is_active and assignee.email and not getattr(assignee, "is_bot", False):
                    by_assignee[assignee].append(issue)

        for user, issues in by_assignee.items():
            _send_stale_card_email(
                user=user,
                issues=issues,
                workspace=workspace,
                email_config=(EMAIL_HOST, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD, EMAIL_PORT, EMAIL_USE_TLS, EMAIL_USE_SSL, EMAIL_FROM),
            )


def _send_stale_card_email(*, user, issues, workspace, email_config) -> None:
    (EMAIL_HOST, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD, EMAIL_PORT, EMAIL_USE_TLS, EMAIL_USE_SSL, EMAIL_FROM) = email_config
    name = user.display_name or user.email
    subject = f"[{workspace.name}] Seus cards parados esta semana"
    lines_html = "".join(
        f"<li><strong>{i.name}</strong> — {i.project.name if i.project else ''} "
        f"({i.state.name if i.state else 'sem estado'})</li>"
        for i in issues
    )
    lines_text = "\n".join(
        f"- {i.name} ({i.project.name if i.project else ''} / {i.state.name if i.state else 'sem estado'})"
        for i in issues
    )
    html = (
        f"<p>Olá {name},</p>"
        f"<p>Os seguintes cards do workspace <strong>{workspace.name}</strong> "
        f"estão sem atualização há mais de 3 dias:</p>"
        f"<ul>{lines_html}</ul>"
        f"<p>Acesse o Operoz para atualizar o status de cada card.</p>"
    )
    text = (
        f"Olá {name},\n\n"
        f"Os seguintes cards do workspace {workspace.name} estão sem atualização há mais de 3 dias:\n\n"
        f"{lines_text}\n\n"
        f"Acesse o Operoz para atualizar o status de cada card."
    )
    try:
        connection = get_connection(
            host=EMAIL_HOST,
            port=int(EMAIL_PORT),
            username=EMAIL_HOST_USER,
            password=EMAIL_HOST_PASSWORD,
            use_tls=EMAIL_USE_TLS == "1",
            use_ssl=EMAIL_USE_SSL == "1",
        )
        msg = EmailMultiAlternatives(subject, text, EMAIL_FROM, [user.email], connection=connection)
        msg.attach_alternative(html, "text/html")
        msg.send()
    except Exception:
        pass
