from __future__ import annotations

import subprocess
import sys
from pathlib import Path
from typing import Any

from django.core.management.base import BaseCommand, CommandError
from django.test import Client
from django.test.utils import override_settings

from operoz.assistant.observability import (
    collect_assistant_metrics,
    evaluate_assistant_alerts,
    render_prometheus_metrics,
)
from operoz.devops.celery_queue_monitor import (
    default_monitored_queues,
    get_queue_depths,
    queues_exceeding_threshold,
    default_alert_threshold,
)

PHASE_LABELS = {
    1: "Fase 1 — Streaming e caminho quente",
    2: "Fase 2 — Infraestrutura (api-chat, PgBouncer, proxy)",
    3: "Fase 3 — Fila assíncrona Celery + Redis Stream",
    4: "Fase 4 — RAG cache, resumo e banco",
    5: "Fase 5 — Concorrência, fair queue e proteção LLM",
    6: "Fase 6 — Frontend resiliente (contrato API)",
    7: "Fase 7 — Observabilidade, alertas e métricas",
    8: "Fase 8 — Governança (ADR, baseline, runbook)",
}


class Command(BaseCommand):
    help = (
        "Validação automatizada da escala do assistente — testes por fase (1–8), "
        "filas, alertas, métricas e carga 150 VUs"
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--skip-pytest",
            action="store_true",
            help="Não executar pytest (apenas checks operacionais)",
        )
        parser.add_argument(
            "--vus",
            type=int,
            default=150,
            help="Utilizadores virtuais no teste de carga integrado (default 150)",
        )
        parser.add_argument(
            "--deep",
            action="store_true",
            help="Inclui suíte profunda por fase (test_scaling_phases_e2e) e check:types web",
        )
        parser.add_argument(
            "--skip-frontend",
            action="store_true",
            help="Não executar pnpm check:types (Fase 6 FE)",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        failures: list[str] = []
        deep = bool(options["deep"])

        self.stdout.write(self.style.MIGRATE_HEADING("\n=== Validação Escala do Chat Operoz ===\n"))
        if deep:
            self.stdout.write("Modo profundo: fases 1–8 + carga 150 VUs\n")

        if not options["skip_pytest"]:
            failures.extend(self._run_pytest_suite(deep=deep))
            if deep:
                failures.extend(self._run_phase_e2e_suite())

        if deep and not options["skip_frontend"]:
            failures.extend(self._run_frontend_types())

        failures.extend(self._check_stale_jobs())
        failures.extend(self._check_queues())
        failures.extend(self._check_alerts())
        failures.extend(self._check_metrics_endpoint())
        failures.extend(self._run_load_validation(int(options["vus"])))

        self.stdout.write("")
        if failures:
            self.stderr.write(self.style.ERROR("Falhas:"))
            for item in failures:
                self.stderr.write(self.style.ERROR(f"  - {item}"))
            raise CommandError(f"Validação falhou ({len(failures)} gate(s))")

        self.stdout.write(self.style.SUCCESS("\n✓ Validação completa — todos os gates passaram.\n"))

    def _pytest_env(self) -> dict[str, str]:
        return {
            **dict(__import__("os").environ),
            "DJANGO_SETTINGS_MODULE": "operoz.settings.test",
        }

    def _run_subprocess_pytest(self, args: list[str], label: str) -> list[str]:
        result = subprocess.run(
            [sys.executable, "-m", "pytest", *args],
            capture_output=True,
            text=True,
            env=self._pytest_env(),
        )
        if result.returncode != 0:
            self.stderr.write(result.stdout)
            self.stderr.write(result.stderr)
            return [label]
        self.stdout.write(self.style.SUCCESS(f"   OK — {self._pytest_pass_line(result.stdout)}"))
        return []

    def _run_pytest_suite(self, *, deep: bool) -> list[str]:
        self.stdout.write("1/N pytest (assistant + contract + devops)...")
        targets = [
            "operoz/tests/unit/assistant",
            "operoz/tests/unit/devops/test_celery_queue_monitor.py",
            "operoz/tests/contract/app/test_assistant_app.py",
        ]
        if deep:
            targets.append("operoz/tests/unit/docs/test_assistant_documentation.py")
        return self._run_subprocess_pytest([*targets, "-q"], "pytest assistant suite")

    def _run_phase_e2e_suite(self) -> list[str]:
        self.stdout.write("\n--- Validação profunda por fase (1–8) ---")
        phase_classes = [
            ("1", "TestPhase1Streaming"),
            ("2", "TestPhase2Infrastructure"),
            ("3", "TestPhase3AsyncQueue"),
            ("4", "TestPhase4RagOptimization"),
            ("5", "TestPhase5ConcurrencyProtection"),
            ("6", "TestPhase6FrontendContract"),
            ("7", "TestPhase7Observability"),
            ("8", "TestPhase8Governance"),
        ]
        failures: list[str] = []
        for phase_num, class_name in phase_classes:
            label = PHASE_LABELS[int(phase_num)]
            self.stdout.write(f"  Fase {phase_num}: {label}")
            path = f"operoz/tests/unit/assistant/test_scaling_phases_e2e.py::{class_name}"
            phase_failures = self._run_subprocess_pytest([path, "-q"], f"Fase {phase_num}")
            failures.extend(phase_failures)
        return failures

    def _run_frontend_types(self) -> list[str]:
        self.stdout.write("\nFase 6 — check:types (apps/web)...")
        repo = self._monorepo_root()
        if repo is None:
            self.stdout.write(
                self.style.WARNING(
                    "   SKIP — monorepo web não montado no container api; "
                    "executar localmente: cd Operoz/apps/web && pnpm check:types"
                )
            )
            return []
        web_dir = repo / "apps" / "web"
        if not (web_dir / "package.json").is_file():
            self.stdout.write(self.style.WARNING("   SKIP — apps/web não encontrado"))
            return []
        result = subprocess.run(
            ["pnpm", "check:types"],
            capture_output=True,
            text=True,
            cwd=web_dir,
        )
        if result.returncode != 0:
            self.stderr.write(result.stdout)
            self.stderr.write(result.stderr)
            return ["pnpm check:types (apps/web)"]
        self.stdout.write(self.style.SUCCESS("   OK — pnpm check:types"))
        return []

    def _monorepo_root(self) -> Path | None:
        here = Path(__file__).resolve()
        for parent in here.parents:
            if (parent / "docker-compose-local.yml").is_file():
                return parent
            if (parent / "apps" / "web" / "package.json").is_file() and (parent / "apps" / "api").is_dir():
                return parent
        return None

    def _pytest_pass_line(self, stdout: str) -> str:
        for line in reversed(stdout.strip().splitlines()):
            if "passed" in line:
                return line.strip()
        return "passed"

    def _check_stale_jobs(self) -> list[str]:
        self.stdout.write("Jobs stale (dry-run)...")
        from operoz.assistant.chat_jobs import reclaim_stale_assistant_jobs

        result = reclaim_stale_assistant_jobs(dry_run=True)
        reclaimed = int(result["reclaimed"])
        self.stdout.write(f"   stale detectados: {reclaimed} (limiar {result['threshold_seconds']}s)")
        if reclaimed > 0:
            return [f"{reclaimed} job(s) stale — executar: python manage.py check_stale_assistant_jobs"]
        self.stdout.write(self.style.SUCCESS("   OK — nenhum job stale"))
        return []

    def _check_queues(self) -> list[str]:
        self.stdout.write("\nFilas Celery...")
        depths = get_queue_depths(default_monitored_queues())
        threshold = default_alert_threshold()
        for name, depth in depths.items():
            label = depth if depth is not None else "N/A"
            self.stdout.write(f"   {name}: {label}")
        alerts = queues_exceeding_threshold(depths, threshold)
        if alerts:
            for alert in alerts:
                self.stderr.write(
                    self.style.WARNING(f"   ALERTA {alert['queue']}: {alert['depth']} >= {alert['threshold']}")
                )
            return [f"fila {a['queue']} acima do limiar" for a in alerts]
        self.stdout.write(self.style.SUCCESS("   OK — filas dentro dos limiares"))
        return []

    def _check_alerts(self) -> list[str]:
        self.stdout.write("Alertas operacionais...")
        metrics = collect_assistant_metrics()
        alerts = evaluate_assistant_alerts()
        for key, value in metrics.items():
            if key == "collected_at":
                continue
            self.stdout.write(f"   {key}: {value}")
        if alerts:
            for alert in alerts:
                self.stderr.write(self.style.WARNING(f"   ALERTA [{alert['code']}] {alert['message']}"))
            return [a["code"] for a in alerts]
        self.stdout.write(self.style.SUCCESS("   OK — nenhum alerta activo"))
        return []

    def _check_metrics_endpoint(self) -> list[str]:
        self.stdout.write("Endpoint Prometheus...")
        token = "validate-assistant-scaling-token"
        with override_settings(ASSISTANT_METRICS_TOKEN=token):
            client = Client()
            unauthorized = client.get("/api/assistant/ops/metrics/")
            if unauthorized.status_code != 401:
                return [f"métricas deveriam exigir auth (got {unauthorized.status_code})"]

            response = client.get(
                "/api/assistant/ops/metrics/",
                HTTP_AUTHORIZATION=f"Bearer {token}",
            )
            if response.status_code != 200:
                return [f"métricas retornaram {response.status_code}"]

            body = render_prometheus_metrics()
            if "assistant_chat_active" not in body:
                return ["formato Prometheus inválido"]

        self.stdout.write(self.style.SUCCESS("   OK — /api/assistant/ops/metrics/"))
        return []

    def _run_load_validation(self, vus: int) -> list[str]:
        self.stdout.write(f"Carga simulada ({vus} VUs, LLM mockado)...")
        env = {
            **self._pytest_env(),
            "ASSISTANT_LOAD_VUS": str(vus),
        }
        result = subprocess.run(
            [
                sys.executable,
                "-m",
                "pytest",
                "operoz/tests/unit/assistant/test_scaling_validation.py::TestScalingValidation::test_concurrent_chat_load",
                "-q",
                "-s",
            ],
            capture_output=True,
            text=True,
            env=env,
        )
        if result.returncode != 0:
            self.stderr.write(result.stdout)
            self.stderr.write(result.stderr)
            return [f"carga {vus} VUs"]
        for line in result.stdout.splitlines():
            if line.startswith("LOAD_SUMMARY"):
                self.stdout.write(f"   {line.strip()}")
        self.stdout.write(self.style.SUCCESS("   OK — carga simulada passou SLAs"))
        return []
