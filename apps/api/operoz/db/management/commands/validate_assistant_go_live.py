from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from typing import Any

from django.conf import settings
from django.contrib.sessions.backends.db import SessionStore
from django.core.management.base import BaseCommand, CommandError
from django.test import Client
from django.utils import timezone

from operoz.app.permissions import ROLE
from operoz.db.models import AssistantSession, User, Workspace, WorkspaceMember
from operoz.license.models import Instance


class Command(BaseCommand):
    help = "Gate go-live staging do assistente: env, serviços HTTP, validate --deep, smoke SSE, opcional LLM real e k6"

    def add_arguments(self, parser):
        parser.add_argument(
            "--api-url",
            default=os.environ.get("GO_LIVE_API_URL", "http://api:8000"),
            help="URL da API principal (default: http://api:8000 no Docker)",
        )
        parser.add_argument(
            "--chat-api-url",
            default=os.environ.get("GO_LIVE_CHAT_API_URL", "http://api-chat:8001"),
            help="URL do api-chat (default: http://api-chat:8001 no Docker)",
        )
        parser.add_argument(
            "--workspace-slug",
            default=os.environ.get("GO_LIVE_WORKSPACE_SLUG", "operoz"),
            help="Workspace para smoke SSE",
        )
        parser.add_argument(
            "--skip-deep",
            action="store_true",
            help="Não executar validate_assistant_scaling --deep",
        )
        parser.add_argument(
            "--with-llm",
            action="store_true",
            help="Smoke com 1 mensagem real ao provider LLM (custo)",
        )
        parser.add_argument(
            "--run-k6",
            action="store_true",
            help="Executar k6 smoke (5 VUs) se k6 estiver no PATH",
        )
        parser.add_argument(
            "--k6-script",
            default="tests/load/assistant-chat-go-live-smoke.k6.js",
            help="Script k6 (default: smoke 5 VUs)",
        )
        parser.add_argument(
            "--export-k6-env",
            action="store_true",
            help="Imprime exports shell SESSION_* para k6 no host e termina",
        )
        parser.add_argument(
            "--json",
            action="store_true",
            help="Resumo final em JSON",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        if options["export_k6_env"]:
            creds = self._bootstrap_k6_credentials(options["workspace_slug"])
            if not creds:
                raise CommandError(f"workspace '{options['workspace_slug']}' indisponível para k6")
            for key, value in creds.items():
                self.stdout.write(f'export {key}="{value}"')
            return

        failures: list[str] = []
        warnings: list[str] = []
        results: dict[str, Any] = {"checks": {}}

        require_llm = bool(options["with_llm"] or options["run_k6"])

        self.stdout.write(self.style.MIGRATE_HEADING("\n=== Go-live Staging — Assistente Operoz ===\n"))

        env_ok, env_detail = self._check_environment(require_llm=require_llm)
        results["checks"]["environment"] = env_detail
        self._report_block("1/7 Variáveis críticas", env_ok, env_detail, failures, warnings)

        http_ok, http_detail = self._check_http_services(
            options["api_url"],
            options["chat_api_url"],
        )
        results["checks"]["http_services"] = http_detail
        self._report_block("2/7 Serviços HTTP (api + api-chat)", http_ok, http_detail, failures, warnings)

        ops_ok, ops_detail = self._check_operational_gates()
        results["checks"]["operational"] = ops_detail
        self._report_block("3/7 Filas, alertas e stale jobs", ops_ok, ops_detail, failures, warnings)

        if not options["skip_deep"]:
            deep_ok, deep_detail = self._run_deep_validation()
            results["checks"]["deep_validation"] = deep_detail
            self._report_block("4/7 validate_assistant_scaling --deep", deep_ok, deep_detail, failures, warnings)
        else:
            self.stdout.write("4/7 validate_assistant_scaling --deep — SKIP")
            results["checks"]["deep_validation"] = {"skipped": True}

        smoke_ok, smoke_detail = self._run_sse_smoke(options["workspace_slug"])
        results["checks"]["sse_smoke"] = smoke_detail
        self._report_block("5/7 Smoke SSE (sync + async in-process)", smoke_ok, smoke_detail, failures, warnings)

        if options["with_llm"]:
            llm_ok, llm_detail = self._run_llm_smoke(options["workspace_slug"])
            results["checks"]["llm_smoke"] = llm_detail
            self._report_block("6/7 Smoke LLM real (1 mensagem)", llm_ok, llm_detail, failures, warnings)
        else:
            self.stdout.write("6/7 Smoke LLM real — SKIP (use --with-llm)")
            results["checks"]["llm_smoke"] = {"skipped": True}

        if options["run_k6"]:
            k6_ok, k6_detail = self._run_k6_smoke(
                options,
                workspace_slug=options["workspace_slug"],
            )
            results["checks"]["k6_smoke"] = k6_detail
            self._report_block("7/7 k6 smoke", k6_ok, k6_detail, failures, warnings)
        else:
            self.stdout.write("7/7 k6 smoke — SKIP (use --run-k6 ou RUN_K6=1 no script shell)")
            results["checks"]["k6_smoke"] = {"skipped": True}

        results["failures"] = failures
        results["warnings"] = warnings
        results["passed"] = len(failures) == 0

        self.stdout.write("")
        if options["json"]:
            self.stdout.write(json.dumps(results, indent=2, default=str))

        if failures:
            self.stderr.write(self.style.ERROR("Falhas go-live:"))
            for item in failures:
                self.stderr.write(self.style.ERROR(f"  - {item}"))
            raise CommandError(f"Go-live falhou ({len(failures)} gate(s))")

        if warnings:
            self.stdout.write(self.style.WARNING("Avisos:"))
            for item in warnings:
                self.stdout.write(self.style.WARNING(f"  - {item}"))

        self.stdout.write(self.style.SUCCESS("\n✓ Go-live staging — todos os gates passaram.\n"))

    def _report_block(
        self,
        title: str,
        ok: bool,
        detail: dict[str, Any],
        failures: list[str],
        warnings: list[str],
    ) -> None:
        self.stdout.write(title)
        for key, value in detail.items():
            if key in ("ok", "skipped"):
                continue
            status = "OK" if value is True or value == "ok" else value
            self.stdout.write(f"   {key}: {status}")
        if ok:
            self.stdout.write(self.style.SUCCESS("   OK"))
        else:
            msg = detail.get("error") or title
            failures.append(str(msg))

    def _check_environment(self, *, require_llm: bool = False) -> tuple[bool, dict[str, Any]]:
        detail: dict[str, Any] = {}
        llm = (os.environ.get("LLM_API_KEY") or os.environ.get("LLM_API_KEYS") or "").strip()
        if llm:
            detail["LLM_API_KEY"] = "ok"
        elif require_llm:
            detail["LLM_API_KEY"] = "MISSING (obrigatório com --with-llm ou --run-k6)"
        else:
            detail["LLM_API_KEY"] = "MISSING (opcional sem LLM/k6)"
        detail["ASSISTANT_METRICS_TOKEN"] = (
            "ok" if getattr(settings, "ASSISTANT_METRICS_TOKEN", "") else "MISSING (recomendado)"
        )
        detail["ASSISTANT_MAX_CONCURRENT_LLM"] = getattr(settings, "ASSISTANT_MAX_CONCURRENT_LLM", "?")
        detail["ASSISTANT_CHAT_STREAM_IDLE_SECONDS"] = getattr(settings, "ASSISTANT_CHAT_STREAM_IDLE_SECONDS", 90)
        detail["ASSISTANT_CHAT_JOB_STALE_SECONDS"] = getattr(settings, "ASSISTANT_CHAT_JOB_STALE_SECONDS", 900)
        ok = bool(llm) if require_llm else True
        return ok, detail

    def _http_get_status(self, url: str, timeout: float = 8.0) -> tuple[int | None, str]:
        try:
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return response.status, url
        except urllib.error.HTTPError as exc:
            return exc.code, url
        except Exception as exc:
            return None, str(exc)

    def _check_http_services(self, api_url: str, chat_api_url: str) -> tuple[bool, dict[str, Any]]:
        detail: dict[str, Any] = {}
        api_status, api_info = self._http_get_status(f"{api_url.rstrip('/')}/api/instances/")
        chat_status, chat_info = self._http_get_status(f"{chat_api_url.rstrip('/')}/api/instances/")
        detail["api_instances"] = api_status if api_status else api_info
        detail["api_chat_instances"] = chat_status if chat_status else chat_info
        ok = api_status == 200 and chat_status == 200
        if not ok:
            detail["error"] = "api ou api-chat inacessível"
        return ok, detail

    def _check_operational_gates(self) -> tuple[bool, dict[str, Any]]:
        detail: dict[str, Any] = {}

        queue_result = subprocess.run(
            [sys.executable, "manage.py", "check_celery_queues", "--fail-on-alert"],
            capture_output=True,
            text=True,
        )
        detail["celery_queues"] = "ok" if queue_result.returncode == 0 else queue_result.stderr.strip()[:200]
        if queue_result.returncode != 0:
            detail["error"] = "filas Celery acima do limiar"
            return False, detail

        alerts_result = subprocess.run(
            [sys.executable, "manage.py", "check_assistant_alerts", "--fail-on-alert"],
            capture_output=True,
            text=True,
        )
        detail["assistant_alerts"] = "ok" if alerts_result.returncode == 0 else alerts_result.stderr.strip()[:200]
        if alerts_result.returncode != 0:
            detail["error"] = "alertas operacionais activos"
            return False, detail

        from operoz.assistant.chat_jobs import reclaim_stale_assistant_jobs

        stale = reclaim_stale_assistant_jobs(dry_run=True)
        detail["stale_jobs"] = stale["reclaimed"]
        if stale["reclaimed"] > 0:
            detail["error"] = f"{stale['reclaimed']} job(s) stale — correr check_stale_assistant_jobs"
            return False, detail

        return True, detail

    def _run_deep_validation(self) -> tuple[bool, dict[str, Any]]:
        cmd = [
            sys.executable,
            "manage.py",
            "validate_assistant_scaling",
            "--deep",
            "--skip-frontend",
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        detail = {
            "returncode": result.returncode,
            "tail": (result.stdout + result.stderr).strip().splitlines()[-3:],
        }
        return result.returncode == 0, detail

    def _ensure_instance(self) -> None:
        if Instance.objects.filter(is_setup_done=True).exists():
            return
        existing = Instance.objects.first()
        if existing:
            existing.is_setup_done = True
            existing.save(update_fields=["is_setup_done"])
            return
        Instance.objects.create(
            instance_name="Go-live Instance",
            instance_id="go-live",
            current_version="1.0.0",
            latest_version="1.0.0",
            domain="http://localhost:8000",
            last_checked_at=timezone.now(),
            is_setup_done=True,
        )

    def _resolve_smoke_user(self, workspace_slug: str) -> tuple[Workspace, User] | None:
        workspace = Workspace.objects.filter(slug=workspace_slug).first()
        if not workspace:
            workspace = Workspace.objects.order_by("created_at").first()
        if not workspace:
            return None
        member = (
            WorkspaceMember.objects.filter(workspace=workspace, role=ROLE.ADMIN.value).select_related("member").first()
        )
        if member:
            return workspace, member.member
        member = WorkspaceMember.objects.filter(workspace=workspace).select_related("member").first()
        if member:
            return workspace, member.member
        return None

    def _run_sse_smoke(self, workspace_slug: str) -> tuple[bool, dict[str, Any]]:
        from unittest.mock import patch

        self._ensure_instance()
        resolved = self._resolve_smoke_user(workspace_slug)
        if not resolved:
            return False, {"error": f"workspace '{workspace_slug}' ou membro não encontrado"}

        workspace, user = resolved
        client = Client()
        client.force_login(user)

        create = client.post(
            f"/api/workspaces/{workspace.slug}/assistant/sessions/",
            data=json.dumps({}),
            content_type="application/json",
        )
        if create.status_code != 201:
            return False, {"error": f"criar sessão falhou: {create.status_code}"}

        session_id = create.json()["id"]
        detail: dict[str, Any] = {"session_id": session_id}

        def _mock_events(_session, _message, **kwargs):
            yield {"type": "token", "content": "ok"}
            yield {
                "type": "done",
                "message": {"role": "assistant", "content": "ok"},
                "session": {"id": str(_session.id)},
            }

        with patch("operoz.app.views.assistant.sessions.iter_chat_events", side_effect=_mock_events):
            sync = client.post(
                f"/api/workspaces/{workspace.slug}/assistant/sessions/{session_id}/chat/",
                data=json.dumps({"message": "smoke sync", "stream": True}),
                content_type="application/json",
                HTTP_ACCEPT="text/event-stream",
            )
        detail["sync_sse_status"] = sync.status_code
        if sync.status_code != 200:
            return False, {**detail, "error": "sync SSE falhou"}

        body = b"".join(sync.streaming_content).decode()
        detail["sync_has_token"] = "token" in body
        detail["sync_has_done"] = "done" in body

        with patch("operoz.app.views.assistant.sessions.enqueue_chat_job_safe") as mock_enqueue:
            from operoz.db.models import AssistantChatJob

            session = AssistantSession.objects.get(pk=session_id)
            job = AssistantChatJob.objects.create(
                session=session,
                user=user,
                message="smoke async",
                client_message_id="go-live-smoke-async",
                status=AssistantChatJob.STATUS_QUEUED,
            )
            mock_enqueue.return_value = job
            async_res = client.post(
                f"/api/workspaces/{workspace.slug}/assistant/sessions/{session_id}/chat/",
                data=json.dumps(
                    {
                        "message": "smoke async",
                        "stream": True,
                        "async_mode": True,
                        "client_message_id": "go-live-smoke-async",
                    }
                ),
                content_type="application/json",
                HTTP_ACCEPT="application/json",
            )
        detail["async_status"] = async_res.status_code
        detail["async_job_id"] = async_res.json().get("job_id") if async_res.status_code == 202 else None

        ok = (
            sync.status_code == 200
            and detail["sync_has_token"]
            and detail["sync_has_done"]
            and async_res.status_code == 202
        )
        if not ok:
            detail["error"] = "smoke SSE incompleto"
        return ok, detail

    def _run_llm_smoke(self, workspace_slug: str) -> tuple[bool, dict[str, Any]]:
        self._ensure_instance()
        resolved = self._resolve_smoke_user(workspace_slug)
        if not resolved:
            return False, {"error": f"workspace '{workspace_slug}' não encontrado"}

        workspace, user = resolved
        client = Client()
        client.force_login(user)

        create = client.post(
            f"/api/workspaces/{workspace.slug}/assistant/sessions/",
            data=json.dumps({}),
            content_type="application/json",
        )
        session_id = create.json()["id"]

        response = client.post(
            f"/api/workspaces/{workspace.slug}/assistant/sessions/{session_id}/chat/",
            data=json.dumps({"message": "Responda apenas: pong", "stream": True}),
            content_type="application/json",
            HTTP_ACCEPT="text/event-stream",
        )
        detail = {"status": response.status_code}
        if response.status_code != 200:
            return False, {**detail, "error": f"LLM smoke HTTP {response.status_code}"}

        body = b"".join(response.streaming_content).decode()
        detail["has_done"] = '"type": "done"' in body or '"type":"done"' in body
        detail["has_error"] = '"type": "error"' in body or '"type":"error"' in body
        if detail["has_error"]:
            return False, {**detail, "error": "LLM smoke retornou erro no stream"}
        if not detail["has_done"]:
            return False, {**detail, "error": "LLM smoke sem evento done"}
        return True, detail

    def _bootstrap_k6_credentials(self, workspace_slug: str) -> dict[str, str] | None:
        resolved = self._resolve_smoke_user(workspace_slug)
        if not resolved:
            return None
        workspace, user = resolved

        session_row = AssistantSession.objects.create(
            workspace=workspace,
            user=user,
            title="Go-live k6",
            context={},
        )

        store = SessionStore()
        store["_auth_user_id"] = str(user.pk)
        store["_auth_user_backend"] = "django.contrib.auth.backends.ModelBackend"
        store["_auth_user_hash"] = user.get_session_auth_hash()
        store.save()

        return {
            "SESSION_ID": str(session_row.id),
            "SESSION_COOKIE": f"sessionid={store.session_key}",
            "WORKSPACE_SLUG": workspace.slug,
        }

    def _run_k6_smoke(self, options: dict[str, Any], *, workspace_slug: str) -> tuple[bool, dict[str, Any]]:
        k6_bin = subprocess.run(["which", "k6"], capture_output=True, text=True)
        if k6_bin.returncode != 0:
            return False, {"error": "k6 não instalado no PATH"}

        creds = self._bootstrap_k6_credentials(workspace_slug)
        if not creds:
            return False, {"error": f"credenciais k6 — workspace '{workspace_slug}' indisponível"}

        repo = self._find_monorepo_root()
        script = options["k6_script"]
        script_path = script if os.path.isabs(script) else os.path.join(repo or ".", script)
        if not os.path.isfile(script_path):
            return False, {"error": f"script k6 não encontrado: {script_path}"}

        env = {
            **os.environ,
            "BASE_URL": os.environ.get("GO_LIVE_K6_BASE_URL", "http://localhost:8000"),
            "CHAT_API_URL": os.environ.get("GO_LIVE_K6_CHAT_URL", "http://localhost:8001"),
            "ASYNC_MODE": "1",
            **creds,
        }
        result = subprocess.run(
            [k6_bin.stdout.strip(), "run", script_path],
            capture_output=True,
            text=True,
            env=env,
            cwd=repo or None,
        )
        detail = {
            "returncode": result.returncode,
            "script": script_path,
            "session_id": creds["SESSION_ID"],
            "tail": (result.stdout + result.stderr).strip().splitlines()[-5:],
        }
        return result.returncode == 0, detail

    def _find_monorepo_root(self) -> str | None:
        if os.path.isfile("/docs/assistant-scaling.md"):
            return "/"
        here = os.path.dirname(os.path.abspath(__file__))
        for _ in range(10):
            here = os.path.dirname(here)
            if os.path.isfile(os.path.join(here, "tests/load/assistant-chat-go-live-smoke.k6.js")):
                return here
        return None
