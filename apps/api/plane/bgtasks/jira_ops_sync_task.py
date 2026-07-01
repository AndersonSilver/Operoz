# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

from __future__ import annotations

import logging
from datetime import datetime, timezone

from celery import shared_task
from django.core.cache import cache

from plane.db.models import User, Workspace
from plane.utils.exception_logger import log_exception
from plane.utils.jira_ops import JiraOpsClient, run_jira_ops_import
from plane.utils.jira_ops.workspace_config import get_workspace_credentials, mark_sync_completed

logger = logging.getLogger(__name__)

CACHE_TTL = 60 * 60 * 6


def _cache_key(workspace_slug: str) -> str:
    return f"jira_ops_sync:{workspace_slug}"


def get_sync_status(workspace_slug: str) -> dict:
    return cache.get(_cache_key(workspace_slug)) or {"status": "idle"}


def set_sync_status(workspace_slug: str, payload: dict) -> None:
    cache.set(_cache_key(workspace_slug), payload, timeout=CACHE_TTL)


@shared_task
def jira_ops_sync_task(workspace_slug: str, board_slug: str, user_id: str) -> None:
    started_at = datetime.now(timezone.utc).isoformat()

    def update(phase: str, status: str = "running", **extra):
        set_sync_status(
            workspace_slug,
            {
                "status": status,
                "phase": phase,
                "board_slug": board_slug,
                "started_at": started_at,
                "finished_at": None,
                **extra,
            },
        )

    try:
        workspace = Workspace.objects.get(slug=workspace_slug)
        credentials = get_workspace_credentials(workspace)
        if not credentials:
            set_sync_status(
                workspace_slug,
                {
                    "status": "failed",
                    "phase": None,
                    "error": "Credenciais Jira OPS não configuradas para este workspace.",
                    "started_at": started_at,
                    "finished_at": datetime.now(timezone.utc).isoformat(),
                },
            )
            return

        board_slug = board_slug or credentials.board_slug
        actor = User.objects.get(pk=user_id)
        client = JiraOpsClient(credentials)

        update("fetching_epics")
        epics = client.fetch_epics()

        update("fetching_issues", epics_count=len(epics))
        issues = client.fetch_issues()

        update("importing", epics_count=len(epics), issues_count=len(issues))
        result = run_jira_ops_import(
            workspace_slug=workspace_slug,
            board_slug=board_slug,
            actor=actor,
            epics=epics,
            issues_list=issues,
        )

        mark_sync_completed(workspace)

        set_sync_status(
            workspace_slug,
            {
                "status": "completed",
                "phase": None,
                "board_slug": board_slug,
                "started_at": started_at,
                "finished_at": datetime.now(timezone.utc).isoformat(),
                "result": result.to_dict(),
            },
        )
    except Exception as exc:
        log_exception(exc)
        logger.exception("jira_ops_sync_task failed")
        set_sync_status(
            workspace_slug,
            {
                "status": "failed",
                "phase": None,
                "board_slug": board_slug,
                "error": str(exc),
                "started_at": started_at,
                "finished_at": datetime.now(timezone.utc).isoformat(),
            },
        )


def start_jira_ops_sync(workspace_slug: str, board_slug: str, user_id: str) -> dict:
    current = get_sync_status(workspace_slug)
    if current.get("status") == "running":
        return current

    set_sync_status(
        workspace_slug,
        {
            "status": "running",
            "phase": "queued",
            "board_slug": board_slug,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "finished_at": None,
        },
    )
    jira_ops_sync_task.delay(workspace_slug, board_slug, user_id)
    return get_sync_status(workspace_slug)
