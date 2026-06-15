#!/usr/bin/env bash
# Cursor MCP — carrega Operis/mcp-server/.env e inicia o servidor stdio.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi
exec node "$ROOT/dist/index.js"
