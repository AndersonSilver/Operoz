from __future__ import annotations

import json
import sys
from typing import Any

from django.core.management.base import BaseCommand

from operoz.assistant.chat_jobs import reclaim_stale_assistant_jobs


class Command(BaseCommand):
    help = "Reclaim assistant chat jobs queued/running além do limiar de stale"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Apenas contar jobs stale sem alterar estado",
        )
        parser.add_argument(
            "--json",
            action="store_true",
            help="Imprime resultado em JSON",
        )
        parser.add_argument(
            "--fail-on-stale",
            action="store_true",
            help="Exit code 1 se existirem jobs stale (útil em cron/CI dry-run)",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        dry_run = bool(options["dry_run"]) or bool(options["fail_on_stale"])
        result = reclaim_stale_assistant_jobs(dry_run=dry_run)

        if options["json"]:
            self.stdout.write(json.dumps(result, indent=2))
        else:
            mode = "dry-run" if dry_run else "reclaim"
            self.stdout.write(
                f"[{mode}] stale jobs: {result['reclaimed']} "
                f"(threshold={result['threshold_seconds']}s, cutoff={result['cutoff']})"
            )
            if result["reclaimed"] and not dry_run:
                self.stdout.write(self.style.WARNING(f"Reclaimed {result['reclaimed']} job(s)"))

        if options["fail_on_stale"] and result["reclaimed"] > 0:
            sys.exit(1)
