from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from django.db import transaction

from operis.assistant.embeddings import content_hash, embed_texts
from operis.assistant.index_status import compute_page_fingerprint, persist_index_outcome
from operis.assistant.page_content import build_page_indexable_text
from operis.db.models import BoardPlaybook, Client360HealthSnapshot, Issue, IssueComment, Page, Project, ProjectPage, SearchEmbedding


@dataclass
class IndexChunk:
    content: str
    metadata: dict[str, Any]


def chunk_text(text: str, *, chunk_size: int = 1200, overlap: int = 150) -> list[str]:
    normalized = (text or "").strip()
    if not normalized:
        return []
    if len(normalized) <= chunk_size:
        return [normalized]

    chunks: list[str] = []
    start = 0
    while start < len(normalized):
        end = min(len(normalized), start + chunk_size)
        piece = normalized[start:end].strip()
        if piece:
            chunks.append(piece)
        if end >= len(normalized):
            break
        start = max(0, end - overlap)
    return chunks


def build_issue_chunks(issue: Issue) -> list[IndexChunk]:
    header = f"{issue.project.identifier}-{issue.sequence_id} {issue.name}"
    body = issue.description_stripped or ""
    text = f"{header}\n\n{body}".strip()
    metadata = {
        "project_id": str(issue.project_id),
        "issue_id": str(issue.id),
        "work_item": f"{issue.project.identifier}-{issue.sequence_id}",
    }
    if issue.project.board_id:
        metadata["board_id"] = str(issue.project.board_id)
    return [IndexChunk(content=chunk, metadata=metadata) for chunk in chunk_text(text)]


def build_page_chunks(page: Page) -> list[IndexChunk]:
    text = build_page_indexable_text(page)
    project_links = ProjectPage.objects.filter(page_id=page.id).select_related("project")
    project_ids = [str(pp.project_id) for pp in project_links]
    board_ids = list({str(pp.project.board_id) for pp in project_links if pp.project.board_id})

    metadata: dict[str, Any] = {
        "page_id": str(page.id),
        "page_name": page.name,
        "project_ids": project_ids,
        "untrusted_content": True,
    }
    if len(project_ids) == 1:
        metadata["project_id"] = project_ids[0]
    if board_ids:
        metadata["board_ids"] = board_ids
        if len(board_ids) == 1:
            metadata["board_id"] = board_ids[0]

    return [IndexChunk(content=chunk, metadata=metadata) for chunk in chunk_text(text)]


def split_markdown_sections(markdown: str) -> list[tuple[str, str]]:
    """Divide markdown em seções por cabeçalhos ## (estilo SKILL.md)."""
    normalized = (markdown or "").strip()
    if not normalized:
        return []

    sections: list[tuple[str, str]] = []
    current_title = ""
    current_lines: list[str] = []

    for line in normalized.splitlines():
        if line.startswith("## "):
            if current_lines:
                sections.append((current_title, "\n".join(current_lines).strip()))
            current_title = line[3:].strip()
            current_lines = []
        else:
            current_lines.append(line)

    if current_lines:
        sections.append((current_title, "\n".join(current_lines).strip()))

    if not sections:
        return [("", normalized)]
    return sections


def build_playbook_chunks(playbook: BoardPlaybook) -> list[IndexChunk]:
    text = (playbook.published_markdown or "").strip()
    if not text:
        return []

    chunks: list[IndexChunk] = []
    base_metadata: dict[str, Any] = {
        "board_id": str(playbook.board_id),
        "playbook_id": str(playbook.id),
        "playbook_title": playbook.title,
        "playbook_slug": playbook.slug,
    }

    for section_title, section_body in split_markdown_sections(text):
        if not section_body:
            continue
        section_metadata = {**base_metadata, "section": section_title or "intro"}
        prefix = f"{section_title}\n\n" if section_title else ""
        for piece in chunk_text(section_body):
            chunks.append(IndexChunk(content=f"{prefix}{piece}".strip(), metadata=section_metadata))
    return chunks


def build_comment_chunks(comment: IssueComment) -> list[IndexChunk]:
    issue = comment.issue
    text = (comment.comment_stripped or "").strip()
    if not text:
        return []
    header = f"Comentário em {issue.project.identifier}-{issue.sequence_id} {issue.name}"
    metadata = {
        "project_id": str(issue.project_id),
        "issue_id": str(issue.id),
        "comment_id": str(comment.id),
        "untrusted_content": True,
    }
    return [IndexChunk(content=f"{header}\n\n{chunk}", metadata=metadata) for chunk in chunk_text(text)]


def _load_entity_chunks(entity_type: str, entity_id: str) -> tuple[str | None, list[IndexChunk]]:
    if entity_type == SearchEmbedding.ENTITY_ISSUE:
        issue = (
            Issue.issue_objects.filter(pk=entity_id)
            .select_related("project", "state")
            .first()
        )
        if not issue:
            return None, []
        return str(issue.workspace_id), build_issue_chunks(issue)

    if entity_type == SearchEmbedding.ENTITY_PAGE:
        page = Page.objects.filter(pk=entity_id).first()
        if not page:
            return None, []
        return str(page.workspace_id), build_page_chunks(page)

    if entity_type == SearchEmbedding.ENTITY_COMMENT:
        comment = (
            IssueComment.objects.filter(pk=entity_id)
            .select_related("issue", "issue__project")
            .first()
        )
        if not comment:
            return None, []
        return str(comment.workspace_id), build_comment_chunks(comment)

    if entity_type == SearchEmbedding.ENTITY_PLAYBOOK:
        playbook = BoardPlaybook.objects.filter(pk=entity_id).first()
        if not playbook:
            return None, []
        return str(playbook.workspace_id), build_playbook_chunks(playbook)

    if entity_type == SearchEmbedding.ENTITY_CLIENT360_SNAPSHOT:
        from operis.utils.client_360_intelligence_rag import build_health_snapshot_chunks

        snapshot = Client360HealthSnapshot.objects.filter(pk=entity_id).select_related("project").first()
        if not snapshot:
            return None, []
        return str(snapshot.workspace_id), build_health_snapshot_chunks(snapshot)

    return None, []


def index_playbook(playbook_id: str) -> dict[str, Any]:
    return index_entity(SearchEmbedding.ENTITY_PLAYBOOK, playbook_id)


def _entity_index_fingerprint(entity_type: str, entity_id: str) -> str | None:
    if entity_type != SearchEmbedding.ENTITY_PAGE:
        return None
    page = Page.objects.filter(pk=entity_id).first()
    if not page:
        return None
    return compute_page_fingerprint(page)


@transaction.atomic
def index_entity(entity_type: str, entity_id: str, *, workspace_id: str | None = None) -> dict[str, Any]:
    fingerprint = _entity_index_fingerprint(entity_type, entity_id)
    resolved_workspace_id, chunks = _load_entity_chunks(entity_type, entity_id)
    if not resolved_workspace_id:
        result = {"ok": False, "error": "entity_not_found", "indexed": 0}
        persist_index_outcome(entity_type, entity_id, result, fingerprint=fingerprint)
        return result

    if workspace_id and workspace_id != resolved_workspace_id:
        result = {"ok": False, "error": "workspace_mismatch", "indexed": 0}
        persist_index_outcome(entity_type, entity_id, result, fingerprint=fingerprint)
        return result

    SearchEmbedding.objects.filter(entity_type=entity_type, entity_id=entity_id).delete(soft=False)

    if not chunks:
        result = {"ok": True, "indexed": 0, "entity_type": entity_type, "entity_id": entity_id}
        persist_index_outcome(entity_type, entity_id, result, fingerprint=fingerprint)
        return result

    texts = [chunk.content for chunk in chunks]
    vectors = embed_texts(texts)
    if vectors is None:
        result = {"ok": False, "error": "embedding_failed", "indexed": 0}
        persist_index_outcome(entity_type, entity_id, result, fingerprint=fingerprint)
        return result

    rows: list[SearchEmbedding] = []
    for idx, (chunk, vector) in enumerate(zip(chunks, vectors, strict=True)):
        if not vector:
            continue
        rows.append(
            SearchEmbedding(
                workspace_id=resolved_workspace_id,
                entity_type=entity_type,
                entity_id=entity_id,
                chunk_index=idx,
                content=chunk.content,
                content_hash=content_hash(chunk.content),
                embedding=vector,
                metadata=chunk.metadata,
            )
        )

    SearchEmbedding.objects.bulk_create(rows, batch_size=100)
    result = {
        "ok": True,
        "indexed": len(rows),
        "entity_type": entity_type,
        "entity_id": entity_id,
        "workspace_id": resolved_workspace_id,
    }
    persist_index_outcome(entity_type, entity_id, result, fingerprint=fingerprint)
    return result
