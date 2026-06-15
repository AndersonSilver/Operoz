from __future__ import annotations

import sys
from typing import Any

from django.core.management.base import BaseCommand

from operis.assistant.observability import collect_assistant_metrics, default_alert_thresholds, evaluate_assistant_alerts


class Command(BaseCommand):
    help = "Verifica alertas operacionais do assistente (P95, taxa de erro, fila assistant-chat)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--fail-on-alert",
            action="store_true",
            help="Exit code 1 se algum alerta estiver activo",
        )
        parser.add_argument(
            "--json",
            action="store_true",
            help="Imprime métricas e alertas em JSON (stdout)",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        metrics = collect_assistant_metrics()
        thresholds = default_alert_thresholds()
        alerts = evaluate_assistant_alerts()

        if options["json"]:
            import json

            self.stdout.write(
                json.dumps({"metrics": metrics, "thresholds": thresholds, "alerts": alerts}, indent=2)
            )
            if options["fail_on_alert"] and alerts:
                sys.exit(1)
            return

        self.stdout.write("Métricas do assistente:")
        for key, value in metrics.items():
            if key == "collected_at":
                continue
            self.stdout.write(f"  {key}: {value}")

        self.stdout.write("\nLimiares:")
        for key, value in thresholds.items():
            self.stdout.write(f"  {key}: {value}")

        if alerts:
            self.stderr.write(self.style.WARNING("\nAlertas activos:"))
            for alert in alerts:
                self.stderr.write(self.style.ERROR(f"  [{alert['code']}] {alert['message']}"))
            if options["fail_on_alert"]:
                sys.exit(1)
        elif options["fail_on_alert"]:
            self.stdout.write(self.style.SUCCESS("\nNenhum alerta activo"))
