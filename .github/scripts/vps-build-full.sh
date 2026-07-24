#!/usr/bin/env bash
# Build local de todas as imagens Operoz na VPS (sem GHCR).
# Uso: OPEROZ_REPO_PATH=/root/operoz-selfhost/Operoz OPEROZ_APP_PATH=/root/operoz-selfhost/plane-app bash vps-build-full.sh
set -euo pipefail

OPEROZ_REPO_PATH="${OPEROZ_REPO_PATH:-/root/operis-selfhost/Operis}"
OPEROZ_APP_PATH="${OPEROZ_APP_PATH:-/root/operis-selfhost/plane-app}"
GIT_BRANCH="${GIT_BRANCH:-preview}"

SCRIPT_DIR="${OPEROZ_REPO_PATH}/.github/scripts"
# shellcheck source=vps-compose-utils.sh
source "${SCRIPT_DIR}/vps-compose-utils.sh"

ENV_FILE="$(operoz_app_env_file "${OPEROZ_APP_PATH}")"

DOCKERHUB_USER="myoperoz"
APP_RELEASE="stable"
WEB_URL="https://www.operoz.io"

if [[ -f "${ENV_FILE}" ]]; then
  # shellcheck disable=SC1090
  source <(grep -E '^(DOCKERHUB_USER|APP_RELEASE|WEB_URL)=' "${ENV_FILE}" | sed 's/^/export /')
  DOCKERHUB_USER="${DOCKERHUB_USER:-myoperoz}"
  APP_RELEASE="${APP_RELEASE:-stable}"
  WEB_URL="${WEB_URL:-https://www.operoz.io}"
fi

echo "==> Atualizar código (${GIT_BRANCH})"
cd "${OPEROZ_REPO_PATH}"
git fetch origin "${GIT_BRANCH}"
git reset --hard "origin/${GIT_BRANCH}"

tag_image() {
  local service_name="$1"
  local dockerfile="$2"
  local context="$3"
  shift 3
  local image="${DOCKERHUB_USER}/${service_name}:${APP_RELEASE}"

  echo "==> Build ${image}"
  docker build -f "${OPEROZ_REPO_PATH}/${dockerfile}" -t "${image}" "$@" "${OPEROZ_REPO_PATH}/${context}"
}

echo "==> Build imagens (pode levar 40–90 min na VPS)"
tag_image "plane-frontend" "apps/web/Dockerfile.web" "." \
  --build-arg "VITE_ENABLE_BOARDS=true" \
  --build-arg "VITE_API_BASE_URL=${WEB_URL}"
tag_image "plane-space" "apps/space/Dockerfile.space" "."
tag_image "plane-admin" "apps/admin/Dockerfile.admin" "."
tag_image "plane-live" "apps/live/Dockerfile.live" "."
tag_image "plane-backend" "apps/api/Dockerfile.api" "apps/api"
tag_image "plane-proxy" "apps/proxy/Dockerfile.ce" "apps/proxy"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERRO: operoz.env ou operis.env não encontrado em ${OPEROZ_APP_PATH}"
  exit 1
fi

export OPEROZ_WEB_URL="${WEB_URL}"
operoz_sync_web_url_env "${ENV_FILE}"

echo "==> Migrações Django"
cd "${OPEROZ_APP_PATH}"
if operoz_dc "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}" config --services 2>/dev/null | grep -qx migrator; then
  operoz_dc "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}" run --rm --no-deps migrator
else
  echo "WARN: serviço migrator não encontrado — aplique migrações manualmente se necessário."
fi

echo "==> Recriar stack completa"
operoz_dc "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}" up -d --pull never --force-recreate

OVERLAY="$(operoz_assistant_overlay "${OPEROZ_REPO_PATH}")"
if [[ -f "${OVERLAY}" ]]; then
  echo "==> Subir workers do assistente (overlay)"
  operoz_dc "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}" up -d --pull never \
    assistant-worker api-chat assistant-chat-worker
fi

operoz_dc "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}" ps
operoz_health_check "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}" || true

echo "==> Build + deploy local concluído"
