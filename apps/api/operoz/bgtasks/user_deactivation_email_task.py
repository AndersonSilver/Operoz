# Python imports
import logging

# Django imports
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

# Third party imports
from celery import shared_task

# Module imports
from operoz.db.models import User
from operoz.license.utils.instance_value import get_instance_smtp_connection
from operoz.utils.email import generate_plain_text_from_html
from operoz.utils.exception_logger import log_exception


@shared_task
def user_deactivation_email(current_site, user_id):
    try:
        # Send email to user when account is deactivated
        user = User.objects.get(id=user_id)
        subject = f"A conta de {user.first_name or user.display_name or user.email} foi desativada no Operoz"

        context = {"email": str(user.email), "login_url": current_site + "/login"}

        # Send email to user
        html_content = render_to_string("emails/user/user_deactivation.html", context)

        text_content = generate_plain_text_from_html(html_content)
        # Configure email connection from the database
        connection, EMAIL_FROM = get_instance_smtp_connection()


        # Send email
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=EMAIL_FROM,
            to=[user.email],
            connection=connection,
        )

        # Attach HTML content
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logging.getLogger("operoz.worker").info("Email sent successfully.")
        return
    except Exception as e:
        log_exception(e)
        return
