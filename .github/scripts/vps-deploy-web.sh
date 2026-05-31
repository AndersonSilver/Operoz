#!/usr/bin/env bash
set -euo pipefail

: "${GHCR_TOKEN:?GHCR_TOKEN is required}"
: "${WEB_IMAGE:?WEB_IMAGE is required}"
: "${OPERIS_REPO_PATH:?OPERIS_REPO_PATH is required}"
: "${OPERIS_APP_PATH:?OPERIS_APP_PATH is required}"
: "${GIT_BRANCH:=preview}"
: "${GITHUB_ACTOR:?GITHUB_ACTOR is required}"

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

echo "==> Recriar contentor web"
cd "${OPERIS_APP_PATH}"
if [[ ! -f operis.env ]]; then
  echo "ERRO: operis.env não encontrado em ${OPERIS_APP_PATH}"
  exit 1
fi

docker compose --env-file operis.env up -d --no-deps --pull never --force-recreate web

echo "==> Estado"
docker compose --env-file operis.env ps web

echo "==> Deploy web concluído"
