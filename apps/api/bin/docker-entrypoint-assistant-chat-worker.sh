#!/bin/bash
set -e
"$(dirname "$0")/ensure-python-deps.sh"

python manage.py wait_for_db
python manage.py wait_for_migrations

QUEUE="${ASSISTANT_CHAT_CELERY_QUEUE:-assistant-chat}"
CONCURRENCY="${ASSISTANT_CHAT_WORKER_CONCURRENCY:-8}"
celery -A operoz worker -Q "${QUEUE}" -l info -c "${CONCURRENCY}" -n assistant-chat@%h
