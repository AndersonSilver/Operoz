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

echo "==> register_instance"
timeout 30 python manage.py register_instance "$MACHINE_SIGNATURE" || echo "WARN: register_instance failed or timed out, continuing"

echo "==> configure_instance"
timeout 30 python manage.py configure_instance || echo "WARN: configure_instance failed or timed out, continuing"

echo "==> clear_cache"
timeout 30 python manage.py clear_cache || echo "WARN: clear_cache failed or timed out, continuing"

WORKERS="${GUNICORN_CHAT_WORKERS:-${GUNICORN_WORKERS:-8}}"
TIMEOUT="${GUNICORN_CHAT_TIMEOUT:-120}"

exec gunicorn \
  -w "$WORKERS" \
  -k uvicorn.workers.UvicornWorker \
  operoz.asgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --timeout "$TIMEOUT" \
  --graceful-timeout 30 \
  --keep-alive 75 \
  --max-requests 800 \
  --max-requests-jitter 200 \
  --access-logfile -
