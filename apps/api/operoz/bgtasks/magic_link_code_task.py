# Python imports
import logging

# Third party imports
from celery import shared_task

# Django imports
# Third party imports
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

# Module imports
from operoz.license.utils.instance_value import get_instance_smtp_connection
from operoz.utils.email import generate_plain_text_from_html
from operoz.utils.exception_logger import log_exception


@shared_task
def magic_link(email, key, token):
    try:
        connection, EMAIL_FROM = get_instance_smtp_connection()

        # Send the mail
        subject = f"Seu código de acesso ao Operoz: {token}"
        context = {"code": token, "email": email}

        html_content = render_to_string("emails/auth/magic_signin.html", context)
        text_content = generate_plain_text_from_html(html_content)


        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=EMAIL_FROM,
            to=[email],
            connection=connection,
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logging.getLogger("operoz.worker").info("Email sent successfully.")
        return
    except Exception as e:
        log_exception(e)
        return
