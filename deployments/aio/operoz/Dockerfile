# Operoz "backend-all-in-one": api + api-chat + worker (5 filas fundidas,
# ver apps/api/bin/docker-entrypoint-worker-general.sh) + beat + migrator +
# space + live + admin (estatico) + proxy interno, tudo num container so.
# `web` fica de fora de proposito — roda como container separado (imagem
# myoperoz/plane-frontend, sem mudanca), igual hoje.
#
# Local: build com as imagens ja construidas por docker-compose.yml (ARGs
# abaixo apontam pros tags locais operoz-full-*). CI/producao: sobrescrever
# os ARGs com ghcr.io/.../plane-*:${RELEASE_TAG}.
ARG BACKEND_IMAGE=operoz-full-api:latest
ARG SPACE_IMAGE=operoz-full-space:latest
ARG ADMIN_IMAGE=operoz-full-admin:latest
ARG LIVE_IMAGE=operoz-full-live:latest
ARG PROXY_IMAGE=operoz-full-proxy:latest

FROM node:22-alpine AS node

FROM ${BACKEND_IMAGE} AS backend-img
FROM ${SPACE_IMAGE} AS space-img
FROM ${ADMIN_IMAGE} AS admin-img
FROM ${LIVE_IMAGE} AS live-img
FROM ${PROXY_IMAGE} AS proxy-img

# Mesma base do backend real (apps/api/Dockerfile.api) — site-packages
# copiados abaixo sao binarios compilados p/ musl (Alpine); glibc quebraria import.
FROM python:3.12.10-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libpq libxslt xmlsec curl bash

# Node runtime (space + live sao processos Node)
COPY --from=node /usr/lib /usr/lib
COPY --from=node /usr/local/lib /usr/local/lib
COPY --from=node /usr/local/include /usr/local/include
COPY --from=node /usr/local/bin /usr/local/bin

# admin: build estatico, servido pelo Caddy via file_server (sem processo)
COPY --from=admin-img /usr/share/nginx/html/god-mode /app/admin

# space + live: processos Node completos (com node_modules)
COPY --from=space-img /app /app/space
COPY --from=live-img /app /app/live

# proxy: so o binario + Caddyfile proprio (nao o do proxy-img, que espera
# containers separados por hostname)
COPY --from=proxy-img /usr/bin/caddy /usr/bin/caddy
COPY Caddyfile /app/proxy/Caddyfile

# backend: api/api-chat/worker/beat/migrator == mesma imagem, comandos diferentes
COPY --from=backend-img /code /app/backend
COPY --from=backend-img /usr/local/lib/python3.12/site-packages/ /usr/local/lib/python3.12/site-packages/
COPY --from=backend-img /usr/local/bin/ /usr/local/bin/

RUN pip install --no-cache-dir supervisor \
    && mkdir -p /etc/supervisor/conf.d /app/logs/access /app/logs/error

COPY supervisor.conf /etc/supervisor/conf.d/supervisor.conf

EXPOSE 8080

CMD ["/usr/local/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisor.conf"]
