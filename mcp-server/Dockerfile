# Operoz MCP — HTTP (Streamable HTTP) para Cursor em equipa
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production \
  MCP_HTTP_HOST=0.0.0.0 \
  MCP_HTTP_PORT=3100 \
  MCP_OAUTH_STORE_PATH=/data/oauth-store.json

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && chown -R node:node /app

COPY --from=builder /app/dist ./dist

# /data guarda o store OAuth (clientes DCR, grants, tokens). Precisa existir na
# imagem E pertencer ao uid 1000 (node) ANTES do `USER node`: um volume nomeado
# herda o dono do diretório da imagem no mountpoint. Se o diretório não existir,
# o Docker cria o mountpoint como root:root e toda escrita falha com EACCES.
RUN mkdir -p /data && chown node:node /data && chmod 700 /data

USER node

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3100/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/http.js"]
