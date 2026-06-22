#!/usr/bin/env bash
set -euo pipefail

: "${GHCR_TOKEN:?GHCR_TOKEN is required}"
: "${IMAGE_PREFIX:?IMAGE_PREFIX is required}"
: "${OPERIS_REPO_PATH:?OPERIS_REPO_PATH is required}"
: "${OPERIS_APP_PATH:?OPERIS_APP_PATH is required}"
: "${GIT_BRANCH:=preview}"
: "${GITHUB_ACTOR:?GITHUB_ACTOR is required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=vps-compose-utils.sh
source "${SCRIPT_DIR}/vps-compose-utils.sh"

SERVICES=(
  "plane-frontend:myoperis/plane-frontend"
  "plane-backend:myoperis/plane-backend"
  "plane-space:myoperis/plane-space"
  "plane-admin:myoperis/plane-admin"
  "plane-live:myoperis/plane-live"
  "plane-proxy:myoperis/plane-proxy"
)

ENV_FILE="${OPERIS_APP_PATH}/operis.env"

echo "==> Login GHCR"
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GITHUB_ACTOR}" --password-stdin

echo "==> Atualizar código"
cd "${OPERIS_REPO_PATH}"
git fetch origin "${GIT_BRANCH}"
git reset --hard "origin/${GIT_BRANCH}"

for entry in "${SERVICES[@]}"; do
  ghcr_name="${entry%%:*}"
  local_name="${entry##*:}"
  remote="${IMAGE_PREFIX}/${ghcr_name}:preview"
  echo "==> Pull ${remote}"
  docker pull "${remote}"
  docker tag "${remote}" "${local_name}:preview"
  docker tag "${remote}" "${local_name}:stable"
  docker tag "${remote}" "${local_name}:local"
done

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERRO: operis.env não encontrado em ${OPERIS_APP_PATH}"
  exit 1
fi

operis_sync_web_url_env "${ENV_FILE}"

echo "==> Migrações Django (nova imagem plane-backend)"
cd "${OPERIS_APP_PATH}"
if operis_dc "${OPERIS_APP_PATH}" "${OPERIS_REPO_PATH}" config --services 2>/dev/null | grep -qx migrator; then
  operis_dc "${OPERIS_APP_PATH}" "${OPERIS_REPO_PATH}" run --rm --no-deps migrator
else
  echo "WARN: serviço migrator não encontrado — aplique migrações manualmente se necessário."
fi

echo "==> Recriar stack (inclui proxy com Caddyfile do GHCR)"
operis_dc "${OPERIS_APP_PATH}" "${OPERIS_REPO_PATH}" up -d --pull never

OVERLAY="$(operis_assistant_overlay "${OPERIS_REPO_PATH}")"
if [[ -f "${OVERLAY}" ]]; then
  echo "==> Subir workers do assistente (overlay)"
  operis_dc "${OPERIS_APP_PATH}" "${OPERIS_REPO_PATH}" up -d --pull never \
    assistant-worker api-chat assistant-chat-worker
else
  echo "WARN: overlay assistente não encontrado em ${OVERLAY}"
fi

echo "==> Forçar recreate proxy e web (imagens novas)"
operis_dc "${OPERIS_APP_PATH}" "${OPERIS_REPO_PATH}" up -d --pull never --force-recreate proxy web

operis_dc "${OPERIS_APP_PATH}" "${OPERIS_REPO_PATH}" ps

operis_health_check "${OPERIS_APP_PATH}" "${OPERIS_REPO_PATH}" || true

echo "==> Deploy full concluído"
