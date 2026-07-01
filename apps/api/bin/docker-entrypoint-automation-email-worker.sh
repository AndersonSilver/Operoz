#!/bin/bash
set -e
"$(dirname "$0")/ensure-python-deps.sh"

python manage.py wait_for_db
python manage.py wait_for_migrations

QUEUE="${AUTOMATION_EMAIL_CELERY_QUEUE:-automation_email}"
CONCURRENCY="${AUTOMATION_EMAIL_WORKER_CONCURRENCY:-2}"
celery -A operoz worker -Q "${QUEUE}" -l info -c "${CONCURRENCY}" -n automation-email@%h
