#!/bin/bash
set -e
"$(dirname "$0")/ensure-python-deps.sh"

python manage.py wait_for_db
python manage.py wait_for_migrations

QUEUES="celery,${AUTOMATION_CELERY_QUEUE:-automation},${AUTOMATION_EMAIL_CELERY_QUEUE:-automation_email},${ASSISTANT_CELERY_QUEUE:-assistant},${ASSISTANT_CHAT_CELERY_QUEUE:-assistant-chat}"
CONCURRENCY="${GENERAL_WORKER_CONCURRENCY:-8}"
celery -A operoz worker -Q "${QUEUES}" -l info -c "${CONCURRENCY}" -n general@%h
