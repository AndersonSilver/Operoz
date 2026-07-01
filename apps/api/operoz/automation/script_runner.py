from __future__ import annotations

import json
import logging
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

SCRIPT_TIMEOUT_SECONDS = 10
MAX_SCRIPT_OUTPUT_BYTES = 32_000
RESULT_ENV_KEY = "OPEROZ_SCRIPT_RESULT"


def _parse_stdout_payload(stdout: str) -> dict[str, Any] | None:
    text = (stdout or "").strip()
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    for line in reversed(text.splitlines()):
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            return json.loads(line)
        except json.JSONDecodeError:
            continue
    return None


def run_javascript(
    source_code: str,
    context: dict[str, Any],
    *,
    dry_run: bool = False,
    timeout_seconds: int | None = None,
    max_memory_mb: int | None = None,
) -> dict[str, Any]:
    if not source_code.strip():
        return {"ok": False, "message": "Script vazio"}

    node_bin = shutil.which("node")
    if not node_bin:
        return {"ok": False, "message": "Node.js não disponível no servidor para executar scripts"}

    result_path: Path | None = None
    tmp_path: Path | None = None
    timeout = timeout_seconds or SCRIPT_TIMEOUT_SECONDS

    wrapper = f"""
import {{ writeFileSync }} from "node:fs";

(async () => {{
const ctx = {json.dumps(context, default=str)};
const __logs = [];
const __origLog = console.log;
console.log = (...args) => {{
  __logs.push(args.map((v) => String(v)).join(" "));
}};

async function __userScript(context) {{
{source_code}
}}

let __result;
try {{
  const __out = await __userScript(ctx);
  __result = {{ ok: true, result: __out, logs: __logs }};
}} catch (err) {{
  __result = {{
    ok: false,
    error: String(err && err.message ? err.message : err),
    logs: __logs,
  }};
}}

const __serialized = JSON.stringify(__result);
const __resultFile = process.env.{RESULT_ENV_KEY};
if (__resultFile) {{
  writeFileSync(__resultFile, __serialized, "utf8");
}} else {{
  process.stdout.write(__serialized);
}}
}})();
"""

    try:
        with tempfile.NamedTemporaryFile("w", suffix=".mjs", delete=False, encoding="utf-8") as tmp:
            tmp.write(wrapper)
            tmp_path = Path(tmp.name)

        result_path = tmp_path.with_suffix(".result.json")
        env = {**os.environ, RESULT_ENV_KEY: str(result_path)}
        if max_memory_mb:
            env["NODE_OPTIONS"] = f"--max-old-space-size={max_memory_mb}"

        proc = subprocess.run(
            [node_bin, str(tmp_path)],
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
            env=env,
        )

        payload: dict[str, Any] | None = None
        if result_path.exists():
            raw_file = result_path.read_text(encoding="utf-8")[:MAX_SCRIPT_OUTPUT_BYTES]
            try:
                payload = json.loads(raw_file)
            except json.JSONDecodeError:
                return {"ok": False, "message": "Saída inválida do script", "raw": raw_file[:500]}

        if payload is None:
            stdout = (proc.stdout or "")[:MAX_SCRIPT_OUTPUT_BYTES]
            if proc.returncode != 0:
                stderr = (proc.stderr or "")[:2000]
                return {"ok": False, "message": stderr or f"Script falhou com código {proc.returncode}"}
            payload = _parse_stdout_payload(stdout)
            if payload is None:
                return {
                    "ok": False,
                    "message": "Saída inválida do script",
                    "raw": stdout[:500],
                    "hint": "Use return para devolver valores; evite console.log ou use só para depuração.",
                }

        logs = payload.pop("logs", None)
        if not payload.get("ok"):
            message = payload.get("error") or "Erro no script"
            result = {"ok": False, "message": message, "dry_run": dry_run}
            if logs:
                result["logs"] = logs
            return result

        result = {
            "ok": True,
            "message": "Script executado" if not dry_run else "[simulação] Script executado",
            "result": payload.get("result"),
            "dry_run": dry_run,
        }
        if logs:
            result["logs"] = logs
        return result
    except subprocess.TimeoutExpired:
        return {"ok": False, "message": f"Script excedeu {timeout_seconds or SCRIPT_TIMEOUT_SECONDS}s"}
    except Exception as exc:
        logger.exception("automation script run failed")
        return {"ok": False, "message": str(exc)}
    finally:
        if tmp_path:
            tmp_path.unlink(missing_ok=True)
        if result_path:
            result_path.unlink(missing_ok=True)
