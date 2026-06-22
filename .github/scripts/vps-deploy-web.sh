#!/usr/bin/env bash
set -euo pipefail

: "${GHCR_TOKEN:?GHCR_TOKEN is required}"
: "${WEB_IMAGE:?WEB_IMAGE is required}"
: "${OPERIS_REPO_PATH:?OPERIS_REPO_PATH is required}"
: "${OPERIS_APP_PATH:?OPERIS_APP_PATH is required}"
: "${GIT_BRANCH:=preview}"
: "${GITHUB_ACTOR:?GITHUB_ACTOR is required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=vps-compose-utils.sh
source "${SCRIPT_DIR}/vps-compose-utils.sh"

ENV_FILE="${OPERIS_APP_PATH}/operis.env"

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

echo "==> Pull imagem web: ${WEB_IMAGE}"
docker pull "${WEB_IMAGE}"

echo "==> Tags locais (compose plane-app)"
docker tag "${WEB_IMAGE}" myoperis/plane-frontend:preview
docker tag "${WEB_IMAGE}" myoperis/plane-frontend:stable
docker tag "${WEB_IMAGE}" myoperis/plane-frontend:local

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERRO: operis.env não encontrado em ${OPERIS_APP_PATH}"
  exit 1
fi

operis_sync_web_url_env "${ENV_FILE}"

echo "==> Recriar contentor web"
cd "${OPERIS_APP_PATH}"
operis_dc "${OPERIS_APP_PATH}" "${OPERIS_REPO_PATH}" up -d --no-deps --pull never --force-recreate web

echo "==> Estado"
operis_dc "${OPERIS_APP_PATH}" "${OPERIS_REPO_PATH}" ps web

operis_health_check "${OPERIS_APP_PATH}" "${OPERIS_REPO_PATH}" || true

echo "==> Deploy web concluído"
