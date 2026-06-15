#!/bin/bash
# Garante pacotes críticos quando o código é montado por volume sem rebuild da imagem.

_ensure_import() {
  local spec="$1"
  local module="$2"
  if ! python -c "import ${module}" 2>/dev/null; then
    echo "[ensure-python-deps] ${module} ausente — instalando ${spec}..."
    pip install "${spec}" --disable-pip-version-check --no-cache-dir --root-user-action=ignore -q
  fi
}

_requirement_spec() {
  local pattern="$1"
  local fallback="$2"
  if [ -f requirements/base.txt ]; then
    local line
    line=$(grep -E "^${pattern}" requirements/base.txt | head -n1)
    if [ -n "$line" ]; then
      echo "$line"
      return
    fi
  fi
  echo "$fallback"
}

ensure_python_deps() {
  _ensure_import "$(_requirement_spec 'croniter==' 'croniter==2.0.5')" croniter
  _ensure_import "$(_requirement_spec 'pgvector==' 'pgvector==0.3.6')" pgvector
}

ensure_python_deps
