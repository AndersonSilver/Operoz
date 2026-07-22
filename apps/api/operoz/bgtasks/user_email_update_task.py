# Python imports
import logging

# Third party imports
from celery import shared_task

# Django imports
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

# Module imports
from operoz.license.utils.instance_value import get_instance_smtp_connection
from operoz.utils.email import generate_plain_text_from_html
from operoz.utils.exception_logger import log_exception


@shared_task
def send_email_update_magic_code(email, token):
    try:
        connection, EMAIL_FROM = get_instance_smtp_connection()

        # Send the mail
        subject = f"Confirme seu novo e-mail no Operoz: {token}"
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


@shared_task
def send_email_update_confirmation(email):
    """
    Send a confirmation email to the user after their email address has been successfully updated.

    Args:
        email: The new email address that was successfully updated
    """
    try:
        connection, EMAIL_FROM = get_instance_smtp_connection()

        # Send the confirmation email
        subject = "Seu endereço de e-mail no Operoz foi atualizado com sucesso"
        context = {"email": email}

        html_content = render_to_string("emails/user/email_updated.html", context)
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
        logging.getLogger("operoz.worker").info(f"Email update confirmation sent successfully to {email}.")
        return
    except Exception as e:
        log_exception(e)
        return
