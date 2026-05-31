#!/usr/bin/env bash
set -euo pipefail

: "${GHCR_TOKEN:?GHCR_TOKEN is required}"
: "${MCP_IMAGE:?MCP_IMAGE is required}"
: "${OPERIS_REPO_PATH:?OPERIS_REPO_PATH is required}"
: "${OPERIS_MCP_ENV:=${OPERIS_REPO_PATH}/deployments/mcp/operis-mcp.env}"
: "${GIT_BRANCH:=preview}"
: "${GITHUB_ACTOR:?GITHUB_ACTOR is required}"

echo "==> Login GHCR"
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GITHUB_ACTOR}" --password-stdin

echo "==> Atualizar código (${GIT_BRANCH}) em ${OPERIS_REPO_PATH}"
if [[ -d "${OPERIS_REPO_PATH}/.git" ]]; then
  cd "${OPERIS_REPO_PATH}"
  git fetch origin "${GIT_BRANCH}"
  git reset --hard "origin/${GIT_BRANCH}"
else
  echo "WARN: repo não encontrado em ${OPERIS_REPO_PATH}; apenas imagem será atualizada."
fi

echo "==> Pull imagem MCP: ${MCP_IMAGE}"
docker pull "${MCP_IMAGE}"

echo "==> Tags locais"
docker tag "${MCP_IMAGE}" myoperis/operis-mcp:preview
docker tag "${MCP_IMAGE}" myoperis/operis-mcp:stable

if [[ ! -f "${OPERIS_MCP_ENV}" ]]; then
  EXAMPLE="${OPERIS_REPO_PATH}/deployments/mcp/operis-mcp.env.example"
  if [[ -f "${EXAMPLE}" ]]; then
    echo "==> Criar ${OPERIS_MCP_ENV} a partir do example (edite MCP_ALLOWED_HOSTS e URL)"
    cp "${EXAMPLE}" "${OPERIS_MCP_ENV}"
  else
    echo "ERRO: ${OPERIS_MCP_ENV} não existe e example não encontrado."
    exit 1
  fi
fi

COMPOSE_FILE="${OPERIS_REPO_PATH}/deployments/mcp/docker-compose.yml"
if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "ERRO: ${COMPOSE_FILE} não encontrado."
  exit 1
fi

echo "==> Subir operis-mcp"
docker compose -f "${COMPOSE_FILE}" --env-file "${OPERIS_MCP_ENV}" up -d --pull never --force-recreate operis-mcp

echo "==> Health (localhost:3100)"
sleep 3
if curl -fsS "http://127.0.0.1:3100/health" | head -c 200; then
  echo ""
else
  echo "WARN: health check falhou — verifique logs: docker logs operis-mcp"
fi

echo "==> Estado"
docker compose -f "${COMPOSE_FILE}" --env-file "${OPERIS_MCP_ENV}" ps operis-mcp

echo "==> Deploy MCP concluído"
