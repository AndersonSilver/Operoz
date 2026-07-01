"""Test Settings"""

from .common import *  # noqa

DEBUG = True

# Hot path defer breaks synchronous audit/quality assertions in unit tests.
ASSISTANT_DEFER_NONCRITICAL = "0"
ASSISTANT_REQUIRE_SESSION_SCOPE = "0"

# Send it in a dummy outbox
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# base_host() exige origem pública (ex.: convites PRD review por e-mail).
WEB_URL = "http://localhost:3000"
APP_BASE_URL = "http://localhost:3000"

INSTALLED_APPS.append(  # noqa
    "operoz.tests"
)

# CI (GitHub Actions) só sobe Postgres/Redis — executar tasks Celery inline nos testes.
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
