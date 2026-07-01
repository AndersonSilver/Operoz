#!/usr/bin/env bash
# Instala GitHub Actions self-hosted runner no VPS (uma vez).
# Depois disso o workflow usa o runner local — sem SSH do GitHub para a porta 22.
#
# 1) GitHub → Repo Operoz → Settings → Actions → Runners → New self-hosted runner → Linux
# 2) Copie o token (válido ~1h) e execute no VPS:
#    OPEROZ_RUNNER_TOKEN="XXXX" bash install-operoz-runner.sh
#
set -euo pipefail

: "${OPEROZ_RUNNER_TOKEN:?Defina OPEROZ_RUNNER_TOKEN (token do GitHub New runner)}"

RUNNER_DIR="${OPEROZ_RUNNER_DIR:-/root/actions-runner-operoz}"
REPO="https://github.com/AndersonSilver/Operoz"
RUNNER_NAME="${OPEROZ_RUNNER_NAME:-operoz-vps}"

mkdir -p "${RUNNER_DIR}"
cd "${RUNNER_DIR}"

if [[ ! -f ./config.sh ]]; then
  echo "==> Download runner"
  ARCH="x64"
  VER="$(curl -fsSL https://api.github.com/repos/actions/runner/releases/latest | grep -Po '"tag_name": "\K[^"]+')"
  curl -fsSL -o actions-runner.tar.gz \
    "https://github.com/actions/runner/releases/download/${VER}/actions-runner-linux-${ARCH}-${VER#v}.tar.gz"
  tar xzf actions-runner.tar.gz
  rm -f actions-runner.tar.gz
fi

echo "==> Configurar runner (${RUNNER_NAME})"
./config.sh \
  --url "${REPO}" \
  --token "${OPEROZ_RUNNER_TOKEN}" \
  --name "${RUNNER_NAME}" \
  --labels "operoz-vps" \
  --unattended \
  --replace

echo "==> Instalar serviço systemd"
./svc.sh install
./svc.sh start
./svc.sh status

echo ""
echo "OK. No GitHub → Settings → Variables → Actions, crie:"
echo "  OPEROZ_SELF_HOSTED_RUNNER = true"
echo "Depois dispare Deploy Operoz → full (skip_build se as imagens já existirem)."
