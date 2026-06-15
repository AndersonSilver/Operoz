#!/usr/bin/env bash
# Gera API token (se necessário) e grava Operis/mcp-server/.env para o MCP local.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MONOREPO="$(cd "$ROOT/.." && pwd)"
COMPOSE_FILE="$MONOREPO/docker-compose-local.yml"
ENV_FILE="$ROOT/.env"

if ! docker compose -f "$COMPOSE_FILE" ps api --status running -q 2>/dev/null | grep -q .; then
  echo "Erro: container api não está a correr. Sobe com: docker compose -f docker-compose-local.yml up -d api"
  exit 1
fi

TOKEN="$(
  docker compose -f "$COMPOSE_FILE" exec -T api python manage.py shell -c "
from operis.db.models.api import APIToken
from operis.db.models import User
t = APIToken.objects.filter(is_active=True, label='cursor-mcp-local').first()
if t:
    print(t.token)
else:
    u = User.objects.filter(is_active=True).order_by('date_joined').first()
    if not u:
        raise SystemExit('NO_USER')
    t = APIToken.objects.create(user=u, label='cursor-mcp-local', description='Cursor MCP local')
    print(t.token)
" 2>/dev/null | tail -1
)"

if [[ -z "$TOKEN" || "$TOKEN" == "NO_USER" ]]; then
  echo "Erro: não foi possível obter utilizador/token. Cria um user no Operoz primeiro."
  exit 1
fi

cat > "$ENV_FILE" <<EOF
# Gerado por bin/setup-cursor-mcp.sh — não commitar
OPERIS_API_BASE_URL=http://localhost:8000
OPERIS_API_KEY=$TOKEN
EOF
chmod 600 "$ENV_FILE"
echo "OK: $ENV_FILE atualizado (OPERIS_API_KEY configurado)."
