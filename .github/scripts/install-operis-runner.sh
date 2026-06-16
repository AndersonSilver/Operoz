#!/usr/bin/env bash
# Instala GitHub Actions self-hosted runner no VPS (uma vez).
# Depois disso o workflow usa o runner local — sem SSH do GitHub para a porta 22.
#
# 1) GitHub → Repo Operis → Settings → Actions → Runners → New self-hosted runner → Linux
# 2) Copie o token (válido ~1h) e execute no VPS:
#    OPERIS_RUNNER_TOKEN="XXXX" bash install-operis-runner.sh
#
set -euo pipefail

: "${OPERIS_RUNNER_TOKEN:?Defina OPERIS_RUNNER_TOKEN (token do GitHub New runner)}"

# VPS Hostinger costuma usar root; GitHub runner exige esta flag nesse caso.
export RUNNER_ALLOW_RUNASROOT="${RUNNER_ALLOW_RUNASROOT:-1}"

RUNNER_DIR="${OPERIS_RUNNER_DIR:-/root/actions-runner-operis}"
REPO="https://github.com/AndersonSilver/Operis"
RUNNER_NAME="${OPERIS_RUNNER_NAME:-operis-vps}"

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
  --token "${OPERIS_RUNNER_TOKEN}" \
  --name "${RUNNER_NAME}" \
  --labels "operis-vps" \
  --unattended \
  --replace

echo "==> Instalar serviço systemd"
./svc.sh install
./svc.sh start
./svc.sh status

echo ""
echo "OK. No GitHub → Settings → Variables → Actions, crie:"
echo "  OPERIS_SELF_HOSTED_RUNNER = true"
echo "Depois dispare Deploy Operis → full (skip_build se as imagens já existirem)."
