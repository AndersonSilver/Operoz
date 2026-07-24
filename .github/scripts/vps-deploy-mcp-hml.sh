#!/usr/bin/env bash
set -euo pipefail

: "${GHCR_TOKEN:?GHCR_TOKEN is required}"
: "${MCP_HML_IMAGE:?MCP_HML_IMAGE is required}"
: "${OPEROZ_REPO_PATH:?OPEROZ_REPO_PATH is required}"
: "${OPEROZ_MCP_HML_ENV:=${OPEROZ_REPO_PATH}/deployments/mcp-hml/operoz-mcp-hml.env}"
: "${GIT_REF:=main}"
: "${LOCAL_RELEASE_TAG:=hml}"
: "${GITHUB_ACTOR:?GITHUB_ACTOR is required}"

SCRIPT_DIR="${OPEROZ_REPO_PATH}/.github/scripts"
# shellcheck source=vps-compose-utils.sh
source "${SCRIPT_DIR}/vps-compose-utils.sh"

echo "==> Login GHCR"
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GITHUB_ACTOR}" --password-stdin

echo "==> Atualizar código (${GIT_REF}) em ${OPEROZ_REPO_PATH}"
operoz_sync_git_ref "${OPEROZ_REPO_PATH}" "${GIT_REF}"

echo "==> Pull imagem MCP-HML: ${MCP_HML_IMAGE}"
docker pull "${MCP_HML_IMAGE}"

echo "==> Tags locais"
operoz_tag_pulled_image "${MCP_HML_IMAGE}" "myoperoz/operoz-mcp" "${LOCAL_RELEASE_TAG}"

if [[ ! -f "${OPEROZ_MCP_HML_ENV}" ]]; then
  EXAMPLE="${OPEROZ_REPO_PATH}/deployments/mcp-hml/operoz-mcp-hml.env.example"
  if [[ -f "${EXAMPLE}" ]]; then
    echo "==> Criar ${OPEROZ_MCP_HML_ENV} a partir do example (edite MCP_ALLOWED_HOSTS e URL)"
    cp "${EXAMPLE}" "${OPEROZ_MCP_HML_ENV}"
  else
    echo "ERRO: ${OPEROZ_MCP_HML_ENV} não existe e example não encontrado."
    exit 1
  fi
fi

COMPOSE_FILE="${OPEROZ_REPO_PATH}/deployments/mcp-hml/docker-compose.yml"
if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "ERRO: ${COMPOSE_FILE} não encontrado."
  exit 1
fi

echo "==> Subir operoz-mcp-hml"
docker compose -f "${COMPOSE_FILE}" --env-file "${OPEROZ_MCP_HML_ENV}" up -d --pull never --force-recreate --remove-orphans operoz-mcp-hml

echo "==> Health (localhost:3101)"
sleep 3
if curl -fsS "http://127.0.0.1:3101/health" | head -c 200; then
  echo ""
else
  echo "WARN: health check falhou — verifique logs: docker logs operoz-mcp-hml"
fi

echo "==> Estado"
docker compose -f "${COMPOSE_FILE}" --env-file "${OPEROZ_MCP_HML_ENV}" ps operoz-mcp-hml

echo "==> Deploy MCP-HML concluído"
