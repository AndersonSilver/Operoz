#!/bin/bash
set -e

python manage.py wait_for_db
python manage.py wait_for_migrations

QUEUE="${AUTOMATION_CELERY_QUEUE:-automation}"
celery -A operis worker -Q "${QUEUE}" -l info -n automation@%h
