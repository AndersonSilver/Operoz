from __future__ import annotations

import pytest

from operis.discord_integration.models import CustomSlashCommand
from operis.discord_integration.services.assistant_bridge import (
    DISCORD_OPEN_SCOPE_INSTRUCTIONS,
    _build_user_message,
)


@pytest.mark.django_db
def test_build_user_message_includes_discord_scope_when_relaxed(workspace):
    command = CustomSlashCommand.objects.create(
        workspace=workspace,
        name="status-projeto",
        description="Status",
        prompt_instructions="Resuma entregas.",
        guild_id="123456789012345678",
    )
    message = _build_user_message(command, "visão geral", scope_relaxed=True)
    assert "visão geral" in message
    assert DISCORD_OPEN_SCOPE_INSTRUCTIONS in message


@pytest.mark.django_db
def test_build_user_message_omits_discord_scope_when_fixed(workspace, workspace_board, create_user):
    from operis.db.models import Project

    project = Project.objects.create(
        workspace=workspace,
        name="SICREDI",
        identifier="SIC",
        board=workspace_board,
    )
    command = CustomSlashCommand.objects.create(
        workspace=workspace,
        name="status-projeto",
        description="Status",
        prompt_instructions="Resuma entregas.",
        guild_id="123456789012345678",
        board_slug="clientes",
        default_project=project,
    )
    message = _build_user_message(command, "", scope_relaxed=False)
    assert DISCORD_OPEN_SCOPE_INSTRUCTIONS not in message
