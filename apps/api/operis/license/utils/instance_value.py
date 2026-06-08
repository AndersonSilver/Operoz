# Python imports
import os

# Django imports
from django.conf import settings

# Module imports
from operis.license.models import InstanceConfiguration
from operis.license.utils.encryption import decrypt_data


# Helper function to return value from the passed key
def get_configuration_value(keys):
    environment_list = []
    if settings.SKIP_ENV_VAR:
        # Get the configurations
        instance_configuration = InstanceConfiguration.objects.values("key", "value", "is_encrypted")

        for key in keys:
            for item in instance_configuration:
                if key.get("key") == item.get("key"):
                    if item.get("is_encrypted", False):
                        environment_list.append(decrypt_data(item.get("value")))
                    else:
                        environment_list.append(item.get("value"))

                    break
            else:
                environment_list.append(key.get("default"))
    else:
        # Get the configuration from os
        for key in keys:
            environment_list.append(os.environ.get(key.get("key"), key.get("default")))

    return tuple(environment_list)


def get_email_configuration():
    return get_configuration_value(
        [
            {"key": "EMAIL_HOST", "default": os.environ.get("EMAIL_HOST")},
            {"key": "EMAIL_HOST_USER", "default": os.environ.get("EMAIL_HOST_USER")},
            {
                "key": "EMAIL_HOST_PASSWORD",
                "default": os.environ.get("EMAIL_HOST_PASSWORD"),
            },
            {"key": "EMAIL_PORT", "default": os.environ.get("EMAIL_PORT", 587)},
            {"key": "EMAIL_USE_TLS", "default": os.environ.get("EMAIL_USE_TLS", "1")},
            {"key": "EMAIL_USE_SSL", "default": os.environ.get("EMAIL_USE_SSL", "0")},
            {
                "key": "EMAIL_FROM",
                "default": os.environ.get("EMAIL_FROM", "Team Plane <team@mailer.plane.so>"),
            },
        ]
    )


def get_instance_smtp_connection(*, fail_silently: bool = False):
    """SMTP real (God mode / instance config), independente de EMAIL_BACKEND local (console)."""
    from django.core.mail import get_connection

    (
        email_host,
        email_host_user,
        email_host_password,
        email_port,
        email_use_tls,
        email_use_ssl,
        email_from,
    ) = get_email_configuration()

    connection = get_connection(
        backend="django.core.mail.backends.smtp.EmailBackend",
        host=email_host,
        port=int(email_port or 587),
        username=email_host_user,
        password=email_host_password,
        use_tls=email_use_tls == "1",
        use_ssl=email_use_ssl == "1",
        fail_silently=fail_silently,
    )
    return connection, email_from
