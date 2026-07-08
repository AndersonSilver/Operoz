#!/usr/bin/env bash
set -euo pipefail

: "${GHCR_TOKEN:?GHCR_TOKEN is required}"
: "${IMAGE_PREFIX:?IMAGE_PREFIX is required}"
: "${OPEROZ_REPO_PATH:?OPEROZ_REPO_PATH is required}"
: "${OPEROZ_APP_PATH:?OPEROZ_APP_PATH is required}"
: "${GIT_REF:=${GIT_BRANCH:-preview}}"
: "${IMAGE_TAG:=preview}"
: "${LOCAL_RELEASE_TAG:=stable}"
: "${GITHUB_ACTOR:?GITHUB_ACTOR is required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=vps-compose-utils.sh
source "${SCRIPT_DIR}/vps-compose-utils.sh"

SERVICES=(
  "plane-frontend:myoperoz/plane-frontend"
  "plane-backend:myoperoz/plane-backend"
  "plane-space:myoperoz/plane-space"
  "plane-admin:myoperoz/plane-admin"
  "plane-live:myoperoz/plane-live"
  "plane-proxy:myoperoz/plane-proxy"
)

ENV_FILE="$(operoz_app_env_file "${OPEROZ_APP_PATH}")"

echo "==> Login GHCR"
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GITHUB_ACTOR}" --password-stdin

echo "==> Atualizar código"
operoz_sync_git_ref "${OPEROZ_REPO_PATH}" "${GIT_REF}"

for entry in "${SERVICES[@]}"; do
  ghcr_name="${entry%%:*}"
  local_name="${entry##*:}"
  image_name="${local_name#myoperoz/}"
  remote="${IMAGE_PREFIX}/${ghcr_name}:${IMAGE_TAG}"
  echo "==> Pull ${remote}"
  docker pull "${remote}"
  operoz_tag_pulled_image "${remote}" "${local_name}" "${LOCAL_RELEASE_TAG}"
  operoz_tag_legacy_image_aliases "${OPEROZ_APP_PATH}" "${image_name}"
done

legacy_hub="$(operoz_compose_image_hub "${OPEROZ_APP_PATH}")"
if [[ "${legacy_hub}" == "myoperis" ]]; then
  echo "==> Compose legado usa ${legacy_hub}/plane-* (aliases criados)"
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERRO: operoz.env ou operis.env não encontrado em ${OPEROZ_APP_PATH}"
  exit 1
fi

operoz_sync_web_url_env "${ENV_FILE}"

operoz_sync_legacy_minio_host_env "${OPEROZ_APP_PATH}"

echo "==> Migrações Django (nova imagem plane-backend)"
cd "${OPEROZ_APP_PATH}"
if operoz_dc "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}" config --services 2>/dev/null | grep -qx migrator; then
  operoz_dc "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}" run --rm --no-deps migrator
else
  echo "WARN: serviço migrator não encontrado — aplique migrações manualmente se necessário."
fi

echo "==> Recriar stack completa (todas as imagens novas, inclui space/proxy/api)"
operoz_dc "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}" up -d --pull never --force-recreate

if operoz_should_use_assistant_overlay "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}"; then
  echo "==> Subir workers do assistente (overlay)"
  operoz_dc "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}" up -d --pull never \
    assistant-worker api-chat assistant-chat-worker
else
  echo "==> Workers assistente no compose base (sem overlay operoz-*)"
fi

operoz_dc "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}" ps

PREV_SHA="$(git -C "${OPEROZ_REPO_PATH}" rev-parse HEAD 2>/dev/null || true)"

if ! operoz_health_check "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}"; then
  echo "::error::Health check falhou após deploy full. Stack pode estar quebrada." >&2
  if [[ -n "${PREV_SHA}" ]]; then
    echo "::notice::Para reverter: re-deploy com a imagem :${PREV_SHA} (tag já existe no GHCR)." >&2
  fi
  exit 1
fi

echo "==> Deploy full concluído"
