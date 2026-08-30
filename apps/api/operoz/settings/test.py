"""Test Settings"""

import os

from .common import *  # noqa

DEBUG = True

# Send it in a dummy outbox
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
# Os fluxos de magic link abortam com SMTP_NOT_CONFIGURED quando EMAIL_HOST
# esta vazio. A checagem le os.environ diretamente (via get_configuration_value
# em magic_code.py), nao o setting do Django — por isso vai no ambiente.
os.environ.setdefault("EMAIL_HOST", "localhost")
EMAIL_HOST = os.environ["EMAIL_HOST"]

# base_host() exige origem pública (ex.: convites PRD review por e-mail).
WEB_URL = "http://localhost:3000"
APP_BASE_URL = "http://localhost:3000"

INSTALLED_APPS.append(  # noqa
    "operoz.tests"
)

# CI (GitHub Actions) só sobe Postgres/Redis — executar tasks Celery inline nos testes.
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
