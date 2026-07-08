#!/usr/bin/env bash
# Deploy Operoz HML — atualiza imagens :hml e recria containers da stack de homologação.
# Disparado apenas por push na branch main (ver deploy-hml.yml).
set -euo pipefail

: "${GHCR_TOKEN:?GHCR_TOKEN is required}"
: "${HML_IMAGE_PREFIX:?HML_IMAGE_PREFIX is required}"
: "${HML_APP_PATH:?HML_APP_PATH is required}"
: "${GITHUB_ACTOR:?GITHUB_ACTOR is required}"
: "${GIT_REF:=main}"
: "${IMAGE_TAG:=hml}"
: "${LOCAL_RELEASE_TAG:=hml}"

HML_ENV_FILE="${HML_APP_PATH}/hml.env"
OPEROZ_REPO_PATH="${OPEROZ_REPO_PATH:-/root/operis-selfhost/Operis}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=vps-compose-utils.sh
source "${SCRIPT_DIR}/vps-compose-utils.sh"

if [[ ! -f "${HML_ENV_FILE}" ]]; then
  echo "ERRO: ${HML_ENV_FILE} não encontrado. Execute o setup inicial primeiro." >&2
  exit 1
fi

echo "==> Login GHCR"
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GITHUB_ACTOR}" --password-stdin

echo "==> Atualizar código (${GIT_REF}) em ${OPEROZ_REPO_PATH}"
operoz_sync_git_ref "${OPEROZ_REPO_PATH}" "${GIT_REF}"

SERVICES=(
  "plane-frontend:myoperoz/plane-frontend"
  "plane-backend:myoperoz/plane-backend"
  "plane-proxy:myoperoz/plane-proxy"
  "plane-admin:myoperoz/plane-admin"
)

for entry in "${SERVICES[@]}"; do
  ghcr_name="${entry%%:*}"
  local_name="${entry##*:}"
  remote="${HML_IMAGE_PREFIX}/${ghcr_name}:${IMAGE_TAG}"
  echo "==> Pull ${remote}"
  docker pull "${remote}"
  operoz_tag_pulled_image "${remote}" "${local_name}" "${LOCAL_RELEASE_TAG}"
done

echo "==> Sincronizar WEB_URL no hml.env"
if [[ -n "${HML_WEB_URL:-}" ]]; then
  if grep -qE '^WEB_URL=' "${HML_ENV_FILE}"; then
    sed -i "s|^WEB_URL=.*|WEB_URL=${HML_WEB_URL}|" "${HML_ENV_FILE}"
  else
    echo "WEB_URL=${HML_WEB_URL}" >> "${HML_ENV_FILE}"
  fi
fi

echo "==> Rodar migrações HML"
cd "${HML_APP_PATH}"
docker compose --env-file hml.env -p plane-app-hml run --rm hml-migrator

echo "==> Recriar stack HML (sem infra — DB/Redis/MQ/MinIO permanecem)"
docker compose --env-file hml.env -p plane-app-hml up -d \
  --no-deps --pull never --force-recreate \
  web hml-api hml-worker hml-beat-worker hml-admin hml-proxy

echo "==> Estado HML"
docker compose --env-file hml.env -p plane-app-hml ps

echo "==> Health check HML"
HML_PORT=$(grep -E '^LISTEN_HTTP_PORT=' "${HML_ENV_FILE}" | cut -d= -f2 | tr -d '"' || echo "8081")
for attempt in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${HML_PORT}/api/instances/" -o /dev/null 2>/dev/null; then
    echo "==> Health check HML OK"
    break
  fi
  if [[ "${attempt}" -eq 30 ]]; then
    echo "::error::Health check HML falhou após 60s" >&2
    docker compose --env-file hml.env -p plane-app-hml logs --tail=40 hml-proxy 2>/dev/null || true
    exit 1
  fi
  sleep 2
done

echo "==> Deploy HML concluído"
