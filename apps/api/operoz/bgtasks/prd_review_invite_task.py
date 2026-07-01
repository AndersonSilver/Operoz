import logging

from celery import shared_task
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string

from operoz.db.models import PageReviewInvite
from operoz.license.utils.instance_value import get_email_configuration
from operoz.utils.email import generate_plain_text_from_html
from operoz.utils.exception_logger import log_exception
from operoz.utils.page_review_guest import build_prd_review_guest_url

logger = logging.getLogger(__name__)


@shared_task
def prd_review_invite_email(invite_id: str, current_site: str) -> None:
    try:
        invite = (
            PageReviewInvite.objects.filter(pk=invite_id)
            .select_related("session", "session__page", "session__workspace")
            .first()
        )
        if not invite or invite.revoked_at:
            return

        page_name = invite.session.page.name or "Documentação"
        review_url = build_prd_review_guest_url(invite.token)
        context = {
            "page_name": page_name,
            "review_url": review_url,
            "expires_at": invite.expires_at.strftime("%d/%m/%Y %H:%M"),
            "current_site": current_site,
        }
        html_content = render_to_string("emails/prd_review_invite.html", context)
        text_content = generate_plain_text_from_html(html_content)

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
            port=EMAIL_PORT,
            username=EMAIL_HOST_USER,
            password=EMAIL_HOST_PASSWORD,
            use_tls=EMAIL_USE_TLS,
            use_ssl=EMAIL_USE_SSL,
        )

        subject = f"Operoz — Revisão disponível: {page_name}"
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=EMAIL_FROM,
            to=[invite.email],
            connection=connection,
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
    except Exception as exc:
        log_exception(exc)
        logger.exception("prd_review_invite_email failed invite_id=%s", invite_id)
