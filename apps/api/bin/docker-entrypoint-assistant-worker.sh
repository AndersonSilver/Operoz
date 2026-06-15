#!/bin/bash
set -e
"$(dirname "$0")/ensure-python-deps.sh"

python manage.py wait_for_db
python manage.py wait_for_migrations

QUEUE="${ASSISTANT_CELERY_QUEUE:-assistant}"
CONCURRENCY="${ASSISTANT_WORKER_CONCURRENCY:-2}"
celery -A operis worker -Q "${QUEUE}" -l info -c "${CONCURRENCY}" -n assistant@%h
