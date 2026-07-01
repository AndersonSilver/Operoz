#!/bin/bash
set -e
"$(dirname "$0")/ensure-python-deps.sh"

python manage.py wait_for_db
python manage.py wait_for_migrations

QUEUE="${AUTOMATION_CELERY_QUEUE:-automation}"
CONCURRENCY="${AUTOMATION_WORKER_CONCURRENCY:-4}"
celery -A operoz worker -Q "${QUEUE}" -l info -c "${CONCURRENCY}" -n automation@%h
