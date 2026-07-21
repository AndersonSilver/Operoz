#!/bin/bash
set -e
"$(dirname "$0")/ensure-python-deps.sh"
python manage.py wait_for_db
python manage.py wait_for_migrations

# Instance registration/configuration is owned by the `api` container.
# Running it here too raced both containers over the same Instance row on
# every boot, which could deadlock/hang the DB write and, in turn, gunicorn
# startup. Only clear_cache is safe and useful to repeat per-process.
echo "==> clear_cache"
timeout -k 10 20 python manage.py clear_cache || echo "WARN: clear_cache failed or timed out, continuing"

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
