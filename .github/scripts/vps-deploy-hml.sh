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

SCRIPT_DIR="${OPEROZ_REPO_PATH}/.github/scripts"
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

# The HML docker-compose.yaml is tracked in the repo (deployments/hml/) so it
# stays in sync with production's service list instead of drifting via ad-hoc
# manual edits on the VPS.
COMPOSE_SOURCE="${OPEROZ_REPO_PATH}/deployments/hml/docker-compose.yaml"
if [[ -f "${COMPOSE_SOURCE}" ]]; then
  echo "==> Sincronizar docker-compose.yaml a partir do repositório"
  cp "${HML_APP_PATH}/docker-compose.yaml" "${HML_APP_PATH}/docker-compose.yaml.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true
  cp "${COMPOSE_SOURCE}" "${HML_APP_PATH}/docker-compose.yaml"
else
  echo "WARN: ${COMPOSE_SOURCE} não encontrado, usando docker-compose.yaml já existente na VPS" >&2
fi

SERVICES=(
  "plane-frontend:myoperoz/plane-frontend"
  "plane-backend:myoperoz/plane-backend"
  "plane-proxy:myoperoz/plane-proxy"
  "plane-admin:myoperoz/plane-admin"
  "plane-space:myoperoz/plane-space"
  "plane-live:myoperoz/plane-live"
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

echo "==> Recriar API e workers HML"
docker compose --env-file hml.env -p plane-app-hml up -d \
  --no-deps --pull never --force-recreate \
  hml-api hml-api-chat hml-worker hml-beat-worker \
  hml-assistant-worker hml-assistant-chat-worker \
  hml-automation-worker hml-automation-email-worker

echo "==> Aguardar hml-api responder (collectstatic + gunicorn podem levar ~2 min)"
api_ready=false
for attempt in $(seq 1 90); do
  if docker compose --env-file hml.env -p plane-app-hml exec -T hml-api \
    wget -q -O /dev/null http://127.0.0.1:8000/api/instances/ 2>/dev/null; then
    echo "==> hml-api pronta (tentativa ${attempt})"
    api_ready=true
    break
  fi
  sleep 3
done
if [[ "${api_ready}" != "true" ]]; then
  echo "::error::hml-api não ficou pronta em 4,5 min" >&2
  docker compose --env-file hml.env -p plane-app-hml logs --tail=60 hml-api 2>/dev/null || true
  exit 1
fi

echo "==> Recriar web, admin, space, live e proxy HML"
docker compose --env-file hml.env -p plane-app-hml up -d \
  --no-deps --pull never --force-recreate \
  web hml-admin hml-space hml-live hml-proxy

echo "==> Estado HML"
docker compose --env-file hml.env -p plane-app-hml ps

echo "==> Health check HML (via proxy)"
HML_PORT=$(grep -E '^LISTEN_HTTP_PORT=' "${HML_ENV_FILE}" | cut -d= -f2 | tr -d '"' || echo "8081")
for attempt in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${HML_PORT}/api/instances/" -o /dev/null 2>/dev/null; then
    echo "==> Health check HML OK"
    break
  fi
  if [[ "${attempt}" -eq 30 ]]; then
    echo "::error::Health check HML falhou após 60s (proxy)" >&2
    docker compose --env-file hml.env -p plane-app-hml logs --tail=40 hml-proxy 2>/dev/null || true
    exit 1
  fi
  sleep 2
done

echo "==> Deploy HML concluído"
