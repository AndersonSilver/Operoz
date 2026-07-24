#!/usr/bin/env bash
set -euo pipefail

: "${GHCR_TOKEN:?GHCR_TOKEN is required}"
: "${WEB_IMAGE:?WEB_IMAGE is required}"
: "${OPEROZ_REPO_PATH:?OPEROZ_REPO_PATH is required}"
: "${OPEROZ_APP_PATH:?OPEROZ_APP_PATH is required}"
: "${GIT_REF:=${GIT_BRANCH:-preview}}"
: "${IMAGE_TAG:=preview}"
: "${LOCAL_RELEASE_TAG:=stable}"
: "${GITHUB_ACTOR:?GITHUB_ACTOR is required}"

SCRIPT_DIR="${OPEROZ_REPO_PATH}/.github/scripts"
# shellcheck source=vps-compose-utils.sh
source "${SCRIPT_DIR}/vps-compose-utils.sh"

ENV_FILE="$(operoz_app_env_file "${OPEROZ_APP_PATH}")"

echo "==> Login GHCR"
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GITHUB_ACTOR}" --password-stdin

PREV_SHA="$(git -C "${OPEROZ_REPO_PATH}" rev-parse HEAD 2>/dev/null || true)"

echo "==> Atualizar código (${GIT_REF}) em ${OPEROZ_REPO_PATH}"
operoz_sync_git_ref "${OPEROZ_REPO_PATH}" "${GIT_REF}"

echo "==> Pull imagem web: ${WEB_IMAGE}"
docker pull "${WEB_IMAGE}"

echo "==> Tags locais (compose plane-app)"
operoz_tag_pulled_image "${WEB_IMAGE}" "myoperoz/plane-frontend" "${LOCAL_RELEASE_TAG}"
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

if ! operoz_health_check "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}"; then
  echo "::error::Health check falhou após deploy web. Container pode estar quebrado." >&2
  if [[ -n "${PREV_SHA}" ]]; then
    echo "::notice::Para reverter: re-deploy com a imagem :${PREV_SHA} (tag já existe no GHCR)." >&2
  fi
  exit 1
fi

echo "==> Deploy web concluído"
