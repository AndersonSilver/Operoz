from __future__ import annotations

from django.db.models.signals import post_save
from django.dispatch import receiver

from operis.assistant.indexing_scheduler import schedule_entity_index
from operis.db.models import Issue, IssueComment, Page, ProjectPage, SearchEmbedding, FileAsset


@receiver(post_save, sender=Issue)
def schedule_issue_index(sender, instance: Issue, **kwargs) -> None:
    if kwargs.get("raw"):
        return
    schedule_entity_index(SearchEmbedding.ENTITY_ISSUE, str(instance.id), str(instance.workspace_id))


@receiver(post_save, sender=Page)
def schedule_page_index(sender, instance: Page, **kwargs) -> None:
    if kwargs.get("raw"):
        return
    schedule_entity_index(SearchEmbedding.ENTITY_PAGE, str(instance.id), str(instance.workspace_id))


@receiver(post_save, sender=IssueComment)
def schedule_comment_index(sender, instance: IssueComment, **kwargs) -> None:
    if kwargs.get("raw"):
        return
    schedule_entity_index(SearchEmbedding.ENTITY_COMMENT, str(instance.id), str(instance.workspace_id))


@receiver(post_save, sender=ProjectPage)
def schedule_project_page_index(sender, instance: ProjectPage, **kwargs) -> None:
    if kwargs.get("raw"):
        return
    schedule_entity_index(
        SearchEmbedding.ENTITY_PAGE,
        str(instance.page_id),
        str(instance.workspace_id),
    )


@receiver(post_save, sender=FileAsset)
def schedule_page_index_on_html_asset(sender, instance: FileAsset, **kwargs) -> None:
    if kwargs.get("raw") or not instance.page_id or not instance.workspace_id:
        return
    if instance.entity_type != FileAsset.EntityTypeContext.PAGE_DESCRIPTION:
        return
    schedule_entity_index(
        SearchEmbedding.ENTITY_PAGE,
        str(instance.page_id),
        str(instance.workspace_id),
    )
