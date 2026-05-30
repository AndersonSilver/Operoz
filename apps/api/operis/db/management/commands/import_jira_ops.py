
"""Importa board Jira OPS para Operis (projeto=cliente, modulo=epico, card=issue)."""



from __future__ import annotations



import json

from pathlib import Path

from typing import Any



from django.core.management.base import BaseCommand, CommandError



from operis.db.models import User, Workspace

from operis.utils.jira_ops import run_jira_ops_import





class Command(BaseCommand):

    help = "Import Jira OPS board into Operis (client=project, epic=module)"



    def add_arguments(self, parser):

        parser.add_argument("--epics", type=str, required=True)

        parser.add_argument("--issues", type=str, default="")

        parser.add_argument("--workspace", type=str, default="tech4humans")

        parser.add_argument("--board-slug", type=str, default="squad-as-a-services")

        parser.add_argument("--actor-email", type=str, default="andersonsilver18@gmail.com")

        parser.add_argument("--projects-only", action="store_true")

        parser.add_argument("--dry-run", action="store_true")



    def handle(self, *args: Any, **options: Any) -> None:

        epics_path = Path(options["epics"])

        if not epics_path.is_file():

            raise CommandError(f"Epics file not found: {epics_path}")



        epics = json.loads(epics_path.read_text(encoding="utf-8")).get("issues", [])

        issues_list: list[dict] = []

        if options["issues"]:

            ip = Path(options["issues"])

            if ip.is_file():

                issues_list = json.loads(ip.read_text(encoding="utf-8")).get("issues", [])



        if options["dry_run"]:

            self.stdout.write("[dry-run] Use a API / jira-ops-sync para importação interativa.")

            return



        workspace = Workspace.objects.get(slug=options["workspace"])

        actor = User.objects.get(email=options["actor_email"])



        result = run_jira_ops_import(

            workspace_slug=workspace.slug,

            board_slug=options["board_slug"],

            actor=actor,

            epics=epics,

            issues_list=issues_list,

            projects_only=options["projects_only"],

        )



        self.stdout.write(

            f"Clientes: {result.clients}, modulos: {result.modules}, skip epics: {result.skipped_epics}"

        )

        if not options["projects_only"]:

            self.stdout.write(

                self.style.SUCCESS(

                    f"Cards criados: {result.created_cards}, atualizados: {result.updated_cards}, "

                    f"vinculos: {result.linked_cards}, "

                    f"subtarefas criadas: {result.created_subtasks}, "

                    f"subtarefas atualizadas: {result.updated_subtasks}, "

                    f"subtarefas re-vinculadas: {result.linked_subtasks}"

                )

            )

