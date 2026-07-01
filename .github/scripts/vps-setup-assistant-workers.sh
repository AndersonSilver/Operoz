#!/usr/bin/env bash
# Sobe assistant-worker, api-chat e assistant-chat-worker no plane-app (VPS).
# Não edita docker-compose.yaml — usa overlay deployments/cli/community/docker-compose.assistant.yml
set -euo pipefail

OPEROZ_REPO_PATH="${OPEROZ_REPO_PATH:-$HOME/operoz-selfhost/Operoz}"
OPEROZ_APP_PATH="${OPEROZ_APP_PATH:-$HOME/operoz-selfhost/plane-app}"
OVERLAY="${OPEROZ_REPO_PATH}/deployments/cli/community/docker-compose.assistant.yml"
ENV_FILE="${OPEROZ_APP_PATH}/operoz.env"
COMPOSE_FILE="${OPEROZ_APP_PATH}/docker-compose.yaml"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  COMPOSE_FILE="${OPEROZ_APP_PATH}/docker-compose.yml"
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "ERRO: docker-compose não encontrado em ${OPEROZ_APP_PATH}"
  exit 1
fi

if [[ ! -f "$OVERLAY" ]]; then
  echo "ERRO: overlay não encontrado. Faça git pull em ${OPEROZ_REPO_PATH}"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERRO: operoz.env não encontrado em ${OPEROZ_APP_PATH}"
  exit 1
fi

if ! grep -qE '^LLM_API_KEY=.+' "$ENV_FILE" 2>/dev/null; then
  echo "AVISO: LLM_API_KEY ausente ou vazio em operoz.env — indexação RAG vai falhar."
  echo "       Adicione: LLM_API_KEY=sk-..."
fi

cd "$OPEROZ_APP_PATH"

echo "==> Subir serviços do assistente (overlay)"
docker compose \
  -f "$COMPOSE_FILE" \
  -f "$OVERLAY" \
  --env-file operoz.env \
  up -d assistant-worker api-chat assistant-chat-worker

echo "==> Estado"
docker compose -f "$COMPOSE_FILE" -f "$OVERLAY" --env-file operoz.env ps assistant-worker api-chat assistant-chat-worker

echo "==> Verificar LLM_API_KEY dentro do container api"
docker compose -f "$COMPOSE_FILE" -f "$OVERLAY" --env-file operoz.env exec -T api python -c \
  "from operoz.assistant.embeddings import get_embedding_config; print('LLM OK' if get_embedding_config()[0] else 'FALTA LLM_API_KEY')" \
  || echo "WARN: não foi possível verificar LLM no api"

echo ""
echo "Concluído. Se proxy estiver em restart loop, rode Deploy Operoz → full no GitHub Actions"
echo "(imagem plane-proxy com Caddyfile corrigido)."
