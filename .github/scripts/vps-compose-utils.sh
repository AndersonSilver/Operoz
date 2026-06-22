#!/usr/bin/env bash
# Funções partilhadas pelos scripts de deploy no VPS (plane-app + overlay assistente).

operis_compose_base() {
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

operis_assistant_overlay() {
  local repo_path="${1:?repo_path required}"
  echo "${repo_path}/deployments/cli/community/docker-compose.assistant.yml"
}

# Executa docker compose com base + overlay assistente (se existir).
operis_dc() {
  local app_path="${1:?app_path required}"
  local repo_path="${2:?repo_path required}"
  shift 2

  local base overlay
  base="$(operis_compose_base "${app_path}")"
  overlay="$(operis_assistant_overlay "${repo_path}")"

  local -a args=(-f "${base}")
  if [[ -f "${overlay}" ]]; then
    args+=(-f "${overlay}")
  fi
  args+=(--env-file "${app_path}/operis.env")

  docker compose "${args[@]}" "$@"
}

# Sincroniza WEB_URL, APP_DOMAIN e CORS a partir de OPERIS_WEB_URL (GitHub Variable).
operis_sync_web_url_env() {
  local env_file="${1:?env_file required}"
  local web_url="${OPERIS_WEB_URL:-}"

  if [[ -z "${web_url}" ]]; then
    return 0
  fi
  if [[ ! -f "${env_file}" ]]; then
    echo "WARN: operis.env não encontrado em ${env_file}" >&2
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

  echo "==> Sincronizar operis.env (WEB_URL=${web_url})"

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

operis_listen_http_port() {
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
operis_health_check() {
  local app_path="${1:?app_path required}"
  local repo_path="${2:?repo_path required}"
  local env_file="${app_path}/operis.env"
  local port
  port="$(operis_listen_http_port "${env_file}")"

  echo "==> Health check (http://127.0.0.1:${port}/api/instances/)"
  local attempt
  for attempt in $(seq 1 30); do
    if curl -sf "http://127.0.0.1:${port}/api/instances/" -o /dev/null 2>/dev/null; then
      echo "==> Health check OK"
      return 0
    fi
    sleep 2
  done

  echo "WARN: health check falhou após 60s — logs do proxy:" >&2
  operis_dc "${app_path}" "${repo_path}" logs --tail=40 proxy 2>/dev/null || true
  return 1
}
