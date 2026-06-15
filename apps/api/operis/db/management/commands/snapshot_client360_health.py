from __future__ import annotations

import json

from django.core.management.base import BaseCommand
from django.utils.dateparse import parse_date

from operis.utils.client_360 import WeekPeriod, parse_week_period
from operis.utils.client_360_health_snapshot_job import (
    run_weekly_health_snapshots,
    snapshot_period_for_job,
)


class Command(BaseCommand):
    help = "Gera snapshots semanais de health score Cliente 360 (upsert por projecto/semana)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--period-start",
            dest="period_start",
            help="Início da semana ISO (YYYY-MM-DD). Default: semana alvo do job.",
        )
        parser.add_argument(
            "--period-end",
            dest="period_end",
            help="Fim da semana ISO (YYYY-MM-DD). Obrigatório se --period-start for usado.",
        )
        parser.add_argument(
            "--project-id",
            dest="project_ids",
            action="append",
            default=[],
            help="Limitar a um ou mais project IDs (retry parcial).",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=100,
            help="Tamanho do lote de projectos (default 100).",
        )
        parser.add_argument(
            "--json",
            action="store_true",
            help="Imprime resultado em JSON.",
        )

    def handle(self, *args, **options):
        period = self._parse_period(options.get("period_start"), options.get("period_end"))
        project_ids = options["project_ids"] or None

        result = run_weekly_health_snapshots(
            period=period,
            project_ids=project_ids,
            batch_size=max(1, int(options["batch_size"])),
        )
        payload = result.as_dict()

        if options["json"]:
            self.stdout.write(json.dumps(payload, indent=2))
        else:
            self.stdout.write(
                f"Period {payload['period_start']} → {payload['period_end']}: "
                f"{payload['succeeded']}/{payload['total']} snapshots OK"
            )
            if payload["failed"]:
                self.stdout.write(
                    self.style.WARNING(
                        f"Failed: {payload['failed']} project(s): {', '.join(payload['failed_project_ids'][:10])}"
                    )
                )

        if payload["failed"]:
            raise SystemExit(1)

    def _parse_period(self, period_start: str | None, period_end: str | None) -> WeekPeriod | None:
        if not period_start and not period_end:
            return None

        start = parse_date(period_start or "")
        end = parse_date(period_end or "")
        if not start or not end:
            raise SystemExit("Both --period-start and --period-end are required when specifying a period.")
        try:
            return parse_week_period(start, end)
        except ValueError as exc:
            raise SystemExit(str(exc)) from exc
