"""Atualiza status de módulos com base nos work items ligados (100% Done → Concluído)."""

from __future__ import annotations

from typing import Any

from django.core.management.base import BaseCommand, CommandError

from operoz.db.models import Workspace
from operoz.utils.jira_ops.import_service import _sync_module_statuses_from_work_items
from operoz.utils.jira_ops.workspace_config import get_board_for_jira_ops


class Command(BaseCommand):
    help = "Sincroniza status de módulos a partir dos cards Done ligados (sem fetch Jira)."

    def add_arguments(self, parser):
        parser.add_argument("--workspace", type=str, required=True)
        parser.add_argument("--board-slug", type=str, default="squad-as-a-service")

    def handle(self, *args: Any, **options: Any) -> None:
        try:
            workspace = Workspace.objects.get(slug=options["workspace"])
        except Workspace.DoesNotExist as exc:
            raise CommandError(f"Workspace não encontrado: {options['workspace']}") from exc

        board = get_board_for_jira_ops(workspace, options["board_slug"])
        updated = _sync_module_statuses_from_work_items(board)
        self.stdout.write(self.style.SUCCESS(f"Módulos atualizados: {updated}"))
