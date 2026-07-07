#!/usr/bin/env bash
set -euo pipefail

: "${GHCR_TOKEN:?GHCR_TOKEN is required}"
: "${MCP_IMAGE:?MCP_IMAGE is required}"
: "${OPEROZ_REPO_PATH:?OPEROZ_REPO_PATH is required}"
: "${OPEROZ_MCP_ENV:=${OPEROZ_REPO_PATH}/deployments/mcp/operoz-mcp.env}"
: "${GIT_BRANCH:=preview}"
: "${GITHUB_ACTOR:?GITHUB_ACTOR is required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=vps-compose-utils.sh
source "${SCRIPT_DIR}/vps-compose-utils.sh"

echo "==> Login GHCR"
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GITHUB_ACTOR}" --password-stdin

PREVIOUS_SHA="$(operoz_current_repo_sha "${OPEROZ_REPO_PATH}" || true)"

echo "==> Atualizar código (${GIT_BRANCH}) em ${OPEROZ_REPO_PATH}"
if [[ -d "${OPEROZ_REPO_PATH}/.git" ]]; then
  cd "${OPEROZ_REPO_PATH}"
  git fetch origin "${GIT_BRANCH}"
  git reset --hard "origin/${GIT_BRANCH}"
else
  echo "WARN: repo não encontrado em ${OPEROZ_REPO_PATH}; apenas imagem será atualizada."
fi

echo "==> Pull imagem MCP: ${MCP_IMAGE}"
docker pull "${MCP_IMAGE}"

echo "==> Tags locais"
docker tag "${MCP_IMAGE}" myoperoz/operoz-mcp:preview
docker tag "${MCP_IMAGE}" myoperoz/operoz-mcp:stable

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
health_ok=false
for attempt in $(seq 1 10); do
  if curl -fsS "http://127.0.0.1:3100/health" -o /dev/null 2>/dev/null; then
    health_ok=true
    break
  fi
  sleep 2
done

if [[ "${health_ok}" != "true" ]]; then
  echo "::error::Health check do operoz-mcp falhou após o deploy."
  echo "Logs: docker logs operoz-mcp"
  docker logs --tail=40 operoz-mcp 2>/dev/null || true
  operoz_print_rollback_hint "${PREVIOUS_SHA}"
  exit 1
fi
echo "==> Health check OK"

echo "==> Estado"
docker compose -f "${COMPOSE_FILE}" --env-file "${OPEROZ_MCP_ENV}" ps operoz-mcp

echo "==> Deploy MCP concluído"
