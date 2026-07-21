#!/usr/bin/env bash
set -euo pipefail

: "${GHCR_TOKEN:?GHCR_TOKEN is required}"
: "${MCP_IMAGE:?MCP_IMAGE is required}"
: "${OPEROZ_REPO_PATH:?OPEROZ_REPO_PATH is required}"
: "${OPEROZ_MCP_ENV:=${OPEROZ_REPO_PATH}/deployments/mcp/operoz-mcp.env}"
: "${GIT_REF:=${GIT_BRANCH:-preview}}"
: "${LOCAL_RELEASE_TAG:=stable}"
: "${GITHUB_ACTOR:?GITHUB_ACTOR is required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=vps-compose-utils.sh
source "${SCRIPT_DIR}/vps-compose-utils.sh"

echo "==> Login GHCR"
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GITHUB_ACTOR}" --password-stdin

echo "==> Atualizar código (${GIT_REF}) em ${OPEROZ_REPO_PATH}"
operoz_sync_git_ref "${OPEROZ_REPO_PATH}" "${GIT_REF}"

echo "==> Pull imagem MCP: ${MCP_IMAGE}"
docker pull "${MCP_IMAGE}"

echo "==> Tags locais"
operoz_tag_pulled_image "${MCP_IMAGE}" "myoperoz/operoz-mcp" "${LOCAL_RELEASE_TAG}"

if [[ ! -f "${OPEROZ_MCP_ENV}" ]]; then
  EXAMPLE="${OPEROZ_REPO_PATH}/deployments/mcp/operoz-mcp.env.example"
  if [[ -f "${EXAMPLE}" ]]; then
    echo "==> Criar ${OPEROZ_MCP_ENV} a partir do example (edite MCP_ALLOWED_HOSTS e URL)"
    cp "${EXAMPLE}" "${OPEROZ_MCP_ENV}"
  else
    echo "ERRO: ${OPEROZ_MCP_ENV} não existe e example não encontrado."
    exit 1
  fi
fi

COMPOSE_FILE="${OPEROZ_REPO_PATH}/deployments/mcp/docker-compose.yml"
if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "ERRO: ${COMPOSE_FILE} não encontrado."
  exit 1
fi

# Migração rebrand: operis-mcp ocupava a porta 3100 antes de operoz-mcp existir.
if docker ps -a --format '{{.Names}}' | grep -qx operis-mcp; then
  echo "==> Remover container legado operis-mcp (libera porta 3100)"
  docker stop operis-mcp 2>/dev/null || true
  docker rm operis-mcp 2>/dev/null || true
fi

echo "==> Subir operoz-mcp"
docker compose -f "${COMPOSE_FILE}" --env-file "${OPEROZ_MCP_ENV}" up -d --pull never --force-recreate --remove-orphans operoz-mcp

echo "==> Health (localhost:3100)"
sleep 3
if curl -fsS "http://127.0.0.1:3100/health" | head -c 200; then
  echo ""
else
  echo "WARN: health check falhou — verifique logs: docker logs operoz-mcp"
fi

echo "==> Estado"
docker compose -f "${COMPOSE_FILE}" --env-file "${OPEROZ_MCP_ENV}" ps operoz-mcp

echo "==> Deploy MCP concluído"
