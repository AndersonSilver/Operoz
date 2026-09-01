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

# O `source` acima leu a cópia do clone da VPS, que ainda está na release
# anterior. Sem reler depois do sync, toda função adicionada nesta release some:
# dentro de um `if`, uma função inexistente vira 127 e o ramo é simplesmente
# falso — sem erro, sem log, sob `set -euo pipefail`. Foi assim que o deploy
# AIO-aware voltaria ao caminho antigo e repetiria a queda da v1.2.0.
source "${SCRIPT_DIR}/vps-compose-utils.sh"

# O compose do HML e versionado no repo (deployments/hml/) e copiado a cada
# deploy, em vez de ser editado a mao na VPS. Desde a migracao para all-in-one o
# arquivo de referencia e o docker-compose-aio.yaml: mesma topologia de producao,
# um container fazendo api, workers, beat, migrator, admin, space, live e proxy.
COMPOSE_SOURCE="${OPEROZ_REPO_PATH}/deployments/hml/docker-compose-aio.yaml"
if [[ ! -f "${COMPOSE_SOURCE}" ]]; then
  echo "ERRO: ${COMPOSE_SOURCE} nao encontrado no clone da VPS." >&2
  exit 1
fi

echo "==> Sincronizar compose (all-in-one) a partir do repositorio"
cp "${HML_APP_PATH}/docker-compose.yaml" \
   "${HML_APP_PATH}/docker-compose.yaml.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true
cp "${COMPOSE_SOURCE}" "${HML_APP_PATH}/docker-compose.yaml"

# No all-in-one so o front ainda consome imagem separada; o resto vive dentro do
# container unico.
SERVICES=(
  "plane-frontend:myoperoz/plane-frontend"
)

for entry in "${SERVICES[@]}"; do
  ghcr_name="${entry%%:*}"
  local_name="${entry##*:}"
  remote="${HML_IMAGE_PREFIX}/${ghcr_name}:${IMAGE_TAG}"
  echo "==> Pull ${remote}"
  operoz_docker_pull "${remote}"
  operoz_tag_pulled_image "${remote}" "${local_name}" "${LOCAL_RELEASE_TAG}"
done

AIO_IMAGE="${HML_IMAGE_PREFIX}/operoz-aio-api:${IMAGE_TAG}"
echo "==> Pull ${AIO_IMAGE}"
operoz_docker_pull "${AIO_IMAGE}"
export AIO_IMAGE

echo "==> Sincronizar WEB_URL no hml.env"
if [[ -n "${HML_WEB_URL:-}" ]]; then
  if grep -qE '^WEB_URL=' "${HML_ENV_FILE}"; then
    sed -i "s|^WEB_URL=.*|WEB_URL=${HML_WEB_URL}|" "${HML_ENV_FILE}"
  else
    echo "WEB_URL=${HML_WEB_URL}" >> "${HML_ENV_FILE}"
  fi
fi

cd "${HML_APP_PATH}"

# As migracoes rodam dentro do container (programa migrator do supervisord), sem
# passo `run --rm migrator`. --remove-orphans faz o cutover: derruba os 10
# servicos que o all-in-one substituiu. Os volumes nomeados (hml_pgdata,
# hml_redisdata, hml_uploads) nao sao tocados — os dados de homologacao ficam.
echo "==> Recriar stack HML (all-in-one)"
docker compose --env-file hml.env -p operoz-hml up -d \
  --pull never --force-recreate --remove-orphans

echo "==> Estado HML"
docker compose --env-file hml.env -p operoz-hml ps

echo "==> Health check HML (via Caddy interno do all-in-one)"
HML_PORT=$(grep -E '^LISTEN_HTTP_PORT=' "${HML_ENV_FILE}" | cut -d= -f2 | tr -d '"' || echo "8081")
HML_HOST_HEADER=$(grep -E '^ALLOWED_HOSTS=' "${HML_ENV_FILE}" | tail -1 | cut -d= -f2- | cut -d, -f1)
HML_HOST_HEADER="${HML_HOST_HEADER:-localhost}"

# O container sobe 7 processos sob supervisord; o gunicorn e o ultimo a
# responder. 90 tentativas x 4s = 6 min, folga sobre os ~2 min observados.
for attempt in $(seq 1 90); do
  if curl -sf -H "Host: ${HML_HOST_HEADER}" \
      "http://127.0.0.1:${HML_PORT}/api/instances/" -o /dev/null 2>/dev/null; then
    echo "==> Health check HML OK (tentativa ${attempt})"
    break
  fi
  if [[ "${attempt}" -eq 90 ]]; then
    echo "::error::Health check HML falhou apos 6 min" >&2
    docker compose --env-file hml.env -p operoz-hml logs --tail=60 hml-api 2>/dev/null || true
    exit 1
  fi
  sleep 4
done

echo "==> Deploy HML concluido"
