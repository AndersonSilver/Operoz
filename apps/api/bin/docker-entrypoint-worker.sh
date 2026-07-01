#!/bin/bash
set -e
"$(dirname "$0")/ensure-python-deps.sh"

python manage.py wait_for_db
# Wait for migrations
python manage.py wait_for_migrations
# Run the processes
celery -A operoz worker -Q celery -l info -n general@%h