#!/bin/bash
set -e
"$(dirname "$0")/ensure-python-deps.sh"
python manage.py wait_for_db
python manage.py wait_for_migrations

HOSTNAME=$(hostname)
MAC_ADDRESS=$(ip link show | awk '/ether/ {print $2}' | head -n 1)
CPU_INFO=$(cat /proc/cpuinfo)
MEMORY_INFO=$(free -h)
DISK_INFO=$(df -h)
SIGNATURE=$(echo "$HOSTNAME$MAC_ADDRESS$CPU_INFO$MEMORY_INFO$DISK_INFO" | sha256sum | awk '{print $1}')

export MACHINE_SIGNATURE=$SIGNATURE

python manage.py register_instance "$MACHINE_SIGNATURE"
python manage.py configure_instance
python manage.py clear_cache

PORT="${PORT:-8001}"

# Local dev uses runserver (gunicorn is production-only in requirements).
exec python manage.py runserver "0.0.0.0:${PORT}" --settings=operoz.settings.local
