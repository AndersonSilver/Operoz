#!/usr/bin/env bash
# Gate go-live staging — Assistente Operoz (150+ utilizadores)
#
# Uso:
#   ./bin/validate-assistant-go-live.sh
#   ./bin/validate-assistant-go-live.sh --with-llm
#   RUN_K6=1 ./bin/validate-assistant-go-live.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose-local.yml)
WORKSPACE_SLUG="${GO_LIVE_WORKSPACE_SLUG:-operoz}"

echo "==> Go-live Assistente Operoz"
echo "    Monorepo: $ROOT"

echo "==> Subindo serviços mínimos..."
"${COMPOSE[@]}" up -d api api-chat assistant-chat-worker operoz-db operoz-redis operoz-mq >/dev/null

echo "==> Validação Django (container api)..."
"${COMPOSE[@]}" exec -T api python manage.py validate_assistant_go_live "$@"

if [[ "${RUN_K6:-0}" == "1" ]]; then
  if ! command -v k6 >/dev/null 2>&1; then
    echo "ERRO: k6 não instalado no host. https://k6.io/docs/get-started/installation/"
    exit 1
  fi
  echo "==> k6 smoke (host → localhost, LLM real)..."
  # shellcheck disable=SC2046
  eval "$("${COMPOSE[@]}" exec -T api python manage.py validate_assistant_go_live \
    --export-k6-env --workspace-slug "$WORKSPACE_SLUG")"
  export BASE_URL="${GO_LIVE_K6_BASE_URL:-http://localhost:8000}"
  export CHAT_API_URL="${GO_LIVE_K6_CHAT_URL:-http://localhost:8001}"
  export ASYNC_MODE=1
  k6 run tests/load/assistant-chat-go-live-smoke.k6.js
fi

echo ""
echo "✓ Go-live staging concluído."
