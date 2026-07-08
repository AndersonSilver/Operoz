from __future__ import annotations

from typing import Any

from django.core.management.base import BaseCommand, CommandError

from operoz.assistant.indexing import index_entity
from operoz.bgtasks.assistant_index_task import index_entity_task
from operoz.db.models import Issue, Page, Project, SearchEmbedding, Workspace


class Command(BaseCommand):
    help = "Reindexa conteúdo do assistente (issues, pages) para RAG"

    def add_arguments(self, parser):
        parser.add_argument("--workspace", type=str, required=True, help="Slug do workspace")
        parser.add_argument(
            "--entity-type",
            type=str,
            choices=[
                SearchEmbedding.ENTITY_ISSUE,
                SearchEmbedding.ENTITY_PAGE,
                SearchEmbedding.ENTITY_COMMENT,
            ],
            help="Limitar a um tipo de entidade",
        )
        parser.add_argument("--project-id", type=str, help="UUID do projeto (filtra issues/pages)")
        parser.add_argument("--async", action="store_true", dest="use_async", help="Enfileirar via Celery")
        parser.add_argument("--dry-run", action="store_true", help="Apenas contar entidades")

    def handle(self, *args: Any, **options: Any) -> None:
        try:
            workspace = Workspace.objects.get(slug=options["workspace"])
        except Workspace.DoesNotExist as exc:
            raise CommandError(f"Workspace '{options['workspace']}' não encontrado") from exc

        entity_types = (
            [options["entity_type"]]
            if options.get("entity_type")
            else [SearchEmbedding.ENTITY_ISSUE, SearchEmbedding.ENTITY_PAGE]
        )

        project_id = options.get("project_id")
        if project_id:
            if not Project.objects.filter(id=project_id, workspace=workspace).exists():
                raise CommandError(f"Projeto {project_id} não encontrado no workspace")

        total = 0
        indexed = 0
        errors = 0

        for entity_type in entity_types:
            ids = self._entity_ids(workspace, entity_type, project_id)
            total += len(ids)
            self.stdout.write(f"{entity_type}: {len(ids)} entidades")

            if options["dry_run"]:
                continue

            for entity_id in ids:
                if options["use_async"]:
                    index_entity_task.delay(entity_type, str(entity_id), str(workspace.id))
                    indexed += 1
                    continue

                result = index_entity(entity_type, str(entity_id), workspace_id=str(workspace.id))
                if result.get("ok"):
                    indexed += result.get("indexed", 0)
                else:
                    errors += 1
                    self.stdout.write(self.style.WARNING(f"  falha {entity_type}:{entity_id} → {result.get('error')}"))

        if options["dry_run"]:
            self.stdout.write(self.style.SUCCESS(f"Dry-run: {total} entidades seriam processadas"))
            return

        self.stdout.write(self.style.SUCCESS(f"Concluído: {total} entidades, {indexed} chunks/tasks, {errors} erros"))

    def _entity_ids(self, workspace: Workspace, entity_type: str, project_id: str | None) -> list[str]:
        if entity_type == SearchEmbedding.ENTITY_ISSUE:
            qs = Issue.issue_objects.filter(workspace=workspace)
            if project_id:
                qs = qs.filter(project_id=project_id)
            return [str(pk) for pk in qs.values_list("id", flat=True)]

        if entity_type == SearchEmbedding.ENTITY_PAGE:
            qs = Page.objects.filter(workspace=workspace)
            if project_id:
                qs = qs.filter(project_pages__project_id=project_id).distinct()
            return [str(pk) for pk in qs.values_list("id", flat=True)]

        if entity_type == SearchEmbedding.ENTITY_COMMENT:
            from operoz.db.models import IssueComment

            qs = IssueComment.objects.filter(workspace=workspace)
            if project_id:
                qs = qs.filter(issue__project_id=project_id)
            return [str(pk) for pk in qs.values_list("id", flat=True)]

        return []
