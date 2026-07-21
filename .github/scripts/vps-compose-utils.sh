#!/usr/bin/env bash
# Funções partilhadas pelos scripts de deploy no VPS (plane-app + overlay assistente).

# Resolve operoz.env ou fallback legado operis.env (VPS pré-rebrand).
operoz_app_env_file() {
  local app_path="${1:?app_path required}"
  if [[ -f "${app_path}/operoz.env" ]]; then
    echo "${app_path}/operoz.env"
  elif [[ -f "${app_path}/operis.env" ]]; then
    echo "${app_path}/operis.env"
  else
    echo "ERRO: operoz.env ou operis.env não encontrado em ${app_path}" >&2
    return 1
  fi
}

operoz_compose_base() {
  local app_path="${1:?app_path required}"
  if [[ -f "${app_path}/docker-compose.yaml" ]]; then
    echo "${app_path}/docker-compose.yaml"
  elif [[ -f "${app_path}/docker-compose.yml" ]]; then
    echo "${app_path}/docker-compose.yml"
  else
    echo "ERRO: docker-compose não encontrado em ${app_path}" >&2
    return 1
  fi
}

# VPS instalada antes do rebrand: serviços operis-db, imagens myoperis/plane-*.
operoz_compose_uses_legacy_operis_names() {
  local app_path="${1:?app_path required}"
  local base
  base="$(operoz_compose_base "${app_path}")"
  grep -qE '^  operis-db:' "${base}" 2>/dev/null
}

operoz_compose_has_assistant_in_base() {
  local app_path="${1:?app_path required}"
  local base
  base="$(operoz_compose_base "${app_path}")"
  grep -qE '^  assistant-worker:' "${base}" 2>/dev/null
}

# Overlay referencia operoz-db/mq — incompatível com compose legado operis-*.
operoz_should_use_assistant_overlay() {
  local app_path="${1:?app_path required}"
  local repo_path="${2:?repo_path required}"
  local overlay="${repo_path}/deployments/cli/community/docker-compose.assistant.yml"

  [[ -f "${overlay}" ]] || return 1
  operoz_compose_uses_legacy_operis_names "${app_path}" && return 1
  operoz_compose_has_assistant_in_base "${app_path}" && return 1
  return 0
}

operoz_assistant_overlay() {
  local repo_path="${1:?repo_path required}"
  echo "${repo_path}/deployments/cli/community/docker-compose.assistant.yml"
}

# Hub de imagem no docker-compose base (myoperis legado vs myoperoz).
operoz_compose_image_hub() {
  local app_path="${1:?app_path required}"
  local base
  base="$(operoz_compose_base "${app_path}")"
  if grep -q 'myoperis/plane-' "${base}" 2>/dev/null; then
    echo "myoperis"
  else
    echo "myoperoz"
  fi
}

operoz_legacy_operis_overlay() {
  local repo_path="${1:?repo_path required}"
  echo "${repo_path}/deployments/cli/community/docker-compose.legacy-operis.yml"
}

# Sincroniza repo no VPS por branch (origin/ref) ou tag anotada.
operoz_sync_git_ref() {
  local repo_path="${1:?repo_path required}"
  local git_ref="${2:?git_ref required}"

  if [[ ! -d "${repo_path}/.git" ]]; then
    echo "WARN: repo não encontrado em ${repo_path}; apenas imagens serão atualizadas."
    return 0
  fi

  cd "${repo_path}"
  git fetch origin --tags

  if git rev-parse "refs/tags/${git_ref}" >/dev/null 2>&1; then
    echo "==> Checkout tag ${git_ref}"
    git checkout -f "refs/tags/${git_ref}"
    return 0
  fi

  echo "==> Checkout branch ${git_ref}"
  git fetch origin "${git_ref}"
  git reset --hard "origin/${git_ref}"
}

# Aplica tags locais usadas pelo docker compose após pull do GHCR.
operoz_tag_pulled_image() {
  local source_image="${1:?source_image required}"
  local local_name="${2:?local_name required}" # ex. myoperoz/plane-frontend
  local primary_tag="${3:?primary_tag required}" # ex. stable ou hml

  docker tag "${source_image}" "${local_name}:${primary_tag}"

  case "${primary_tag}" in
    stable)
      docker tag "${source_image}" "${local_name}:preview"
      docker tag "${source_image}" "${local_name}:local"
      ;;
    preview)
      docker tag "${source_image}" "${local_name}:local"
      ;;
  esac
}

# Duplica tags myoperoz/* → myoperis/* quando o plane-app ainda referencia myoperis.
operoz_tag_legacy_image_aliases() {
  local app_path="${1:?app_path required}"
  local image_name="${2:?image_name required}" # ex. plane-frontend

  local legacy_hub
  legacy_hub="$(operoz_compose_image_hub "${app_path}")"
  if [[ "${legacy_hub}" == "myoperoz" ]]; then
    return 0
  fi

  local tag
  for tag in preview stable local; do
    docker tag "myoperoz/${image_name}:${tag}" "${legacy_hub}/${image_name}:${tag}"
  done
}

# MINIO_HOST no operis.env — usado pelo proxy CE após rebuild com Caddyfile parametrizado.
operoz_sync_legacy_minio_host_env() {
  local app_path="${1:?app_path required}"
  local env_file

  operoz_compose_uses_legacy_operis_names "${app_path}" || return 0

  env_file="$(operoz_app_env_file "${app_path}")"
  if grep -qE '^MINIO_HOST=' "${env_file}"; then
    sed -i 's|^MINIO_HOST=.*|MINIO_HOST=operis-minio|' "${env_file}"
  else
    echo "MINIO_HOST=operis-minio" >> "${env_file}"
  fi
  echo "==> MINIO_HOST=operis-minio (${env_file})"
}

# Executa docker compose com base + overlay assistente (se existir).
operoz_dc() {
  local app_path="${1:?app_path required}"
  local repo_path="${2:?repo_path required}"
  shift 2

  local base overlay legacy env_file
  base="$(operoz_compose_base "${app_path}")"
  overlay="$(operoz_assistant_overlay "${repo_path}")"
  legacy="$(operoz_legacy_operis_overlay "${repo_path}")"
  env_file="$(operoz_app_env_file "${app_path}")"

  local -a args=(-f "${base}")
  if operoz_compose_uses_legacy_operis_names "${app_path}" && [[ -f "${legacy}" ]]; then
    args+=(-f "${legacy}")
  fi
  if operoz_should_use_assistant_overlay "${app_path}" "${repo_path}"; then
    args+=(-f "${overlay}")
  fi
  args+=(--env-file "${env_file}")

  docker compose "${args[@]}" "$@"
}

# Sincroniza WEB_URL, APP_DOMAIN e CORS a partir de OPEROZ_WEB_URL (GitHub Variable).
operoz_sync_web_url_env() {
  local env_file="${1:?env_file required}"
  local web_url="${OPEROZ_WEB_URL:-}"

  if [[ -z "${web_url}" ]]; then
    return 0
  fi
  if [[ ! -f "${env_file}" ]]; then
    echo "WARN: operoz.env não encontrado em ${env_file}" >&2
    return 0
  fi

  local domain="${web_url#https://}"
  domain="${domain#http://}"
  domain="${domain%%/*}"

  local cors
  if [[ "${domain}" == www.* ]]; then
    cors="https://${domain},https://${domain#www.}"
  else
    cors="https://${domain},https://www.${domain}"
  fi

  echo "==> Sincronizar operoz.env (WEB_URL=${web_url})"

  if grep -qE '^WEB_URL=' "${env_file}"; then
    sed -i "s|^WEB_URL=.*|WEB_URL=${web_url}|" "${env_file}"
  else
    echo "WEB_URL=${web_url}" >> "${env_file}"
  fi

  if grep -qE '^APP_DOMAIN=' "${env_file}"; then
    sed -i "s|^APP_DOMAIN=.*|APP_DOMAIN=${domain}|" "${env_file}"
  else
    echo "APP_DOMAIN=${domain}" >> "${env_file}"
  fi

  if grep -qE '^CORS_ALLOWED_ORIGINS=' "${env_file}"; then
    sed -i "s|^CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=${cors}|" "${env_file}"
  else
    echo "CORS_ALLOWED_ORIGINS=${cors}" >> "${env_file}"
  fi
}

operoz_listen_http_port() {
  local env_file="${1:?env_file required}"
  local port="8080"
  if [[ -f "${env_file}" ]]; then
    local line
    line="$(grep -E '^LISTEN_HTTP_PORT=' "${env_file}" 2>/dev/null | tail -1 || true)"
    if [[ -n "${line}" ]]; then
      port="${line#LISTEN_HTTP_PORT=}"
    fi
  fi
  echo "${port}"
}

# Aguarda proxy/API responder (evita falso positivo após recreate).
operoz_health_check() {
  local app_path="${1:?app_path required}"
  local repo_path="${2:?repo_path required}"
  local env_file port
  env_file="$(operoz_app_env_file "${app_path}")"
  port="$(operoz_listen_http_port "${env_file}")"

  echo "==> Health check (http://127.0.0.1:${port}/api/instances/)"
  local attempt
  # Up to 4 best-effort startup steps in docker-entrypoint-api.sh can each
  # take up to ~30s (20s timeout + 10s kill-after) before giving up, so the
  # window here must comfortably exceed that worst case.
  for attempt in $(seq 1 75); do
    if curl -sf "http://127.0.0.1:${port}/api/instances/" -o /dev/null 2>/dev/null; then
      echo "==> Health check OK"
      return 0
    fi
    sleep 2
  done

  echo "WARN: health check falhou após 150s — status dos containers:" >&2
  operoz_dc "${app_path}" "${repo_path}" ps 2>/dev/null || true

  echo "WARN: logs do container api:" >&2
  operoz_dc "${app_path}" "${repo_path}" logs --tail=150 api 2>/dev/null || true

  echo "WARN: logs do container migrator:" >&2
  operoz_dc "${app_path}" "${repo_path}" logs --tail=80 migrator 2>/dev/null || true

  echo "WARN: logs do container proxy:" >&2
  operoz_dc "${app_path}" "${repo_path}" logs --tail=40 proxy 2>/dev/null || true
  return 1
}
