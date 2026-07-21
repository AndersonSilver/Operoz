#!/bin/bash
set -e
"$(dirname "$0")/ensure-python-deps.sh"
python manage.py wait_for_db
# Wait for migrations
python manage.py wait_for_migrations

# Create the default bucket
#!/bin/bash

# Collect system information
HOSTNAME=$(hostname)
MAC_ADDRESS=$(ip link show | awk '/ether/ {print $2}' | head -n 1)
CPU_INFO=$(cat /proc/cpuinfo)
MEMORY_INFO=$(free -h)
DISK_INFO=$(df -h)

# Concatenate information and compute SHA-256 hash
SIGNATURE=$(echo "$HOSTNAME$MAC_ADDRESS$CPU_INFO$MEMORY_INFO$DISK_INFO" | sha256sum | awk '{print $1}')

# Export the variables
export MACHINE_SIGNATURE=$SIGNATURE

# Register instance, configure and warm up caches/storage. These are
# best-effort bookkeeping steps — a slow/unreachable broker, MinIO or Redis
# must never be able to hang the container forever and keep gunicorn from
# ever starting. `timeout` turns a silent indefinite hang into a fast,
# visible failure that still lets startup continue.
echo "==> register_instance"
timeout 30 python manage.py register_instance "$MACHINE_SIGNATURE" || echo "WARN: register_instance failed or timed out, continuing"

echo "==> configure_instance"
timeout 30 python manage.py configure_instance || echo "WARN: configure_instance failed or timed out, continuing"

echo "==> create_bucket"
timeout 30 python manage.py create_bucket || echo "WARN: create_bucket failed or timed out, continuing"

echo "==> clear_cache"
timeout 30 python manage.py clear_cache || echo "WARN: clear_cache failed or timed out, continuing"

echo "==> collectstatic"
python manage.py collectstatic --noinput

exec gunicorn -w "$GUNICORN_WORKERS" -k uvicorn.workers.UvicornWorker operoz.asgi:application --bind 0.0.0.0:"${PORT:-8000}" --max-requests 1200 --max-requests-jitter 1000 --access-logfile -
