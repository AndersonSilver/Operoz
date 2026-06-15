#!/bin/bash
set -e
"$(dirname "$0")/ensure-python-deps.sh"

python manage.py wait_for_db $1

python manage.py migrate $1