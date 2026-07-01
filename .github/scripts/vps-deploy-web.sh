#!/usr/bin/env bash
set -euo pipefail

: "${GHCR_TOKEN:?GHCR_TOKEN is required}"
: "${WEB_IMAGE:?WEB_IMAGE is required}"
: "${OPEROZ_REPO_PATH:?OPEROZ_REPO_PATH is required}"
: "${OPEROZ_APP_PATH:?OPEROZ_APP_PATH is required}"
: "${GIT_BRANCH:=preview}"
: "${GITHUB_ACTOR:?GITHUB_ACTOR is required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=vps-compose-utils.sh
source "${SCRIPT_DIR}/vps-compose-utils.sh"

ENV_FILE="$(operoz_app_env_file "${OPEROZ_APP_PATH}")"

echo "==> Login GHCR"
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GITHUB_ACTOR}" --password-stdin

echo "==> Atualizar código (${GIT_BRANCH}) em ${OPEROZ_REPO_PATH}"
if [[ -d "${OPEROZ_REPO_PATH}/.git" ]]; then
  cd "${OPEROZ_REPO_PATH}"
  git fetch origin "${GIT_BRANCH}"
  git reset --hard "origin/${GIT_BRANCH}"
else
  echo "WARN: repo não encontrado em ${OPEROZ_REPO_PATH}; apenas imagem será atualizada."
fi

echo "==> Pull imagem web: ${WEB_IMAGE}"
docker pull "${WEB_IMAGE}"

echo "==> Tags locais (compose plane-app)"
docker tag "${WEB_IMAGE}" myoperoz/plane-frontend:preview
docker tag "${WEB_IMAGE}" myoperoz/plane-frontend:stable
docker tag "${WEB_IMAGE}" myoperoz/plane-frontend:local
operoz_tag_legacy_image_aliases "${OPEROZ_APP_PATH}" "plane-frontend"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERRO: operoz.env ou operis.env não encontrado em ${OPEROZ_APP_PATH}"
  exit 1
fi

operoz_sync_web_url_env "${ENV_FILE}"

echo "==> Recriar contentor web"
cd "${OPEROZ_APP_PATH}"
operoz_dc "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}" up -d --no-deps --pull never --force-recreate web

echo "==> Estado"
operoz_dc "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}" ps web

operoz_health_check "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}" || true

echo "==> Deploy web concluído"
