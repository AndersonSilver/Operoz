"""Test Settings"""

from .common import *  # noqa

DEBUG = True

# Hot path defer breaks synchronous audit/quality assertions in unit tests.
ASSISTANT_DEFER_NONCRITICAL = "0"
ASSISTANT_REQUIRE_SESSION_SCOPE = "0"

# Send it in a dummy outbox
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

INSTALLED_APPS.append(  # noqa
    "operis.tests"
)
