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

SCRIPT_DIR="${OPEROZ_REPO_PATH}/.github/scripts"
# shellcheck source=vps-compose-utils.sh
source "${SCRIPT_DIR}/vps-compose-utils.sh"

# Formato: <nome no GHCR>:<nome local>. O nome local precisa continuar
# myoperoz/plane-*: e o que os compose antigos (nao-AIO) declaram, e
# operoz_tag_legacy_image_aliases ainda deriva dele os aliases myoperis/*.
# So o lado do GHCR foi renomeado.
SERVICES=(
  "plane-frontend:myoperoz/plane-frontend"
  "operoz-backend:myoperoz/plane-backend"
  "operoz-space:myoperoz/plane-space"
  "operoz-admin:myoperoz/plane-admin"
  "operoz-live:myoperoz/plane-live"
  "operoz-proxy:myoperoz/plane-proxy"
)

ENV_FILE="$(operoz_app_env_file "${OPEROZ_APP_PATH}")"

echo "==> Login GHCR"
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GITHUB_ACTOR}" --password-stdin

PREV_SHA="$(git -C "${OPEROZ_REPO_PATH}" rev-parse HEAD 2>/dev/null || true)"

echo "==> Atualizar código"
operoz_sync_git_ref "${OPEROZ_REPO_PATH}" "${GIT_REF}"

# O `source` acima leu a cópia do clone da VPS, que ainda está na release
# anterior. Sem reler depois do sync, toda função adicionada nesta release some:
# dentro de um `if`, uma função inexistente vira 127 e o ramo é simplesmente
# falso — sem erro, sem log, sob `set -euo pipefail`. Foi assim que o deploy
# AIO-aware voltaria ao caminho antigo e repetiria a queda da v1.2.0.
source "${SCRIPT_DIR}/vps-compose-utils.sh"

# No AIO o único serviço que ainda consome imagem do stack antigo é o web; o
# resto vive dentro do container all-in-one.
if operoz_compose_is_aio "${OPEROZ_APP_PATH}"; then
  echo "==> Topologia all-in-one detectada"
  SERVICES=("plane-frontend:myoperoz/plane-frontend")
fi

for entry in "${SERVICES[@]}"; do
  ghcr_name="${entry%%:*}"
  local_name="${entry##*:}"
  image_name="${local_name#myoperoz/}"
  remote="${IMAGE_PREFIX}/${ghcr_name}:${IMAGE_TAG}"
  echo "==> Pull ${remote}"
  operoz_docker_pull "${remote}"
  operoz_tag_pulled_image "${remote}" "${local_name}" "${LOCAL_RELEASE_TAG}"
  operoz_tag_legacy_image_aliases "${OPEROZ_APP_PATH}" "${image_name}"
done

if operoz_compose_is_aio "${OPEROZ_APP_PATH}"; then
  AIO_REMOTE="${IMAGE_PREFIX}/operoz-aio-api:${IMAGE_TAG}"
  echo "==> Pull ${AIO_REMOTE}"
  operoz_docker_pull "${AIO_REMOTE}"
  operoz_set_aio_image "${OPEROZ_APP_PATH}" "${AIO_REMOTE}"
fi

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

cd "${OPEROZ_APP_PATH}"
if operoz_compose_is_aio "${OPEROZ_APP_PATH}"; then
  echo "==> Migrações rodam dentro do container AIO (programa migrator do supervisord)"
elif operoz_dc "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}" config --services 2>/dev/null | grep -qx migrator; then
  echo "==> Migrações Django (nova imagem operoz-backend)"
  operoz_dc "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}" run --rm --no-deps migrator
else
  echo "WARN: serviço migrator não encontrado — aplique migrações manualmente se necessário."
fi

echo "==> Recriar stack completa (todas as imagens novas, inclui space/proxy/api)"
# --remove-orphans: sem isto, container de servico removido do compose
# (ex. api-chat) sobrevive ao deploy consumindo recurso e rodando codigo
# que nao existe mais. operoz_dc ja inclui o overlay, entao assistant-worker
# e servico declarado e nao e tratado como orfao.
operoz_dc "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}" up -d --pull never --force-recreate --remove-orphans

if operoz_should_use_assistant_overlay "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}"; then
  echo "==> Subir worker de indexação RAG (overlay)"
  operoz_dc "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}" up -d --pull never assistant-worker
else
  echo "==> Worker de indexação no compose base (sem overlay operoz-*)"
fi

operoz_dc "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}" ps

if ! operoz_health_check "${OPEROZ_APP_PATH}" "${OPEROZ_REPO_PATH}"; then
  echo "::error::Health check falhou após deploy full. Stack pode estar quebrada." >&2
  if [[ -n "${PREV_SHA}" ]]; then
    echo "::notice::Para reverter: re-deploy com a imagem :${PREV_SHA} (tag já existe no GHCR)." >&2
  fi
  exit 1
fi

echo "==> Deploy full concluído"
