#!/bin/bash
# Nome do arquivo mantido de proposito: os compose de HML e producao vivem nas
# VPS e chamam este caminho. Renomear aqui quebraria os workers de la.
set -e
"$(dirname "$0")/ensure-python-deps.sh"

python manage.py wait_for_db
python manage.py wait_for_migrations

QUEUE="${RAG_CELERY_QUEUE:-${ASSISTANT_CELERY_QUEUE:-assistant}}"
CONCURRENCY="${RAG_WORKER_CONCURRENCY:-${ASSISTANT_WORKER_CONCURRENCY:-2}}"
celery -A operoz worker -Q "${QUEUE}" -l info -c "${CONCURRENCY}" -n assistant@%h
