#!/usr/bin/env bash
set -euo pipefail

: "${GHCR_TOKEN:?GHCR_TOKEN is required}"
: "${IMAGE_PREFIX:?IMAGE_PREFIX is required}"
: "${OPERIS_REPO_PATH:?OPERIS_REPO_PATH is required}"
: "${OPERIS_APP_PATH:?OPERIS_APP_PATH is required}"
: "${GIT_BRANCH:=preview}"
: "${GITHUB_ACTOR:?GITHUB_ACTOR is required}"

SERVICES=(
  "plane-frontend:myoperis/plane-frontend"
  "plane-backend:myoperis/plane-backend"
  "plane-space:myoperis/plane-space"
  "plane-admin:myoperis/plane-admin"
  "plane-live:myoperis/plane-live"
  "plane-proxy:myoperis/plane-proxy"
)

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

echo "==> Migrações Django (nova imagem plane-backend)"
cd "${OPERIS_APP_PATH}"
if docker compose --env-file operis.env config --services 2>/dev/null | grep -qx migrator; then
  docker compose --env-file operis.env run --rm --no-deps migrator
else
  echo "WARN: serviço migrator não encontrado no compose — aplique migrações manualmente."
fi

echo "==> Recriar stack"
docker compose --env-file operis.env up -d --pull never

echo "==> Deploy full concluído"
