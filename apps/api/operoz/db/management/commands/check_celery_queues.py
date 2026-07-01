from __future__ import annotations

import sys
from typing import Any

from django.core.management.base import BaseCommand

from operoz.devops.celery_queue_monitor import (
    default_alert_threshold,
    default_monitored_queues,
    get_queue_depths,
    queues_exceeding_threshold,
)


class Command(BaseCommand):
    help = "Reporta profundidade das filas Celery (RabbitMQ) e opcionalmente falha se acima do limiar"

    def add_arguments(self, parser):
        parser.add_argument(
            "--alert-threshold",
            type=int,
            default=None,
            help="Limiar de mensagens para alerta (default: CELERY_QUEUE_ALERT_THRESHOLD ou 500)",
        )
        parser.add_argument(
            "--fail-on-alert",
            action="store_true",
            help="Exit code 1 se alguma fila >= limiar",
        )
        parser.add_argument(
            "--queue",
            action="append",
            dest="queues",
            help="Fila específica (repetível); default: automation, automation_email, assistant, celery",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        queue_names = options["queues"] or default_monitored_queues()
        threshold = options["alert_threshold"] if options["alert_threshold"] is not None else default_alert_threshold()

        depths = get_queue_depths(queue_names)
        for name in queue_names:
            depth = depths.get(name)
            if depth is None:
                self.stdout.write(f"{name}: (fila inexistente ou inacessível)")
            else:
                self.stdout.write(f"{name}: {depth} mensagens")

        alerts = queues_exceeding_threshold(depths, threshold)
        if alerts:
            self.stderr.write(self.style.WARNING(f"\nAlertas (limiares por fila; global default={threshold}):"))
            for alert in alerts:
                self.stderr.write(
                    self.style.ERROR(f"  {alert['queue']}: {alert['depth']} >= {alert['threshold']}")
                )
            if options["fail_on_alert"]:
                sys.exit(1)
        elif options["fail_on_alert"]:
            self.stdout.write(self.style.SUCCESS(f"\nTodas as filas abaixo de {threshold}"))
