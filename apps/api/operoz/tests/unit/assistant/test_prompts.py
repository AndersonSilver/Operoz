import pytest

from operoz.assistant.prompts import build_system_prompt
from operoz.assistant.types import AssistantActorContext
from operoz.db.models import Project


@pytest.mark.unit
@pytest.mark.django_db
class TestAssistantPrompts:
    def test_build_system_prompt_uses_display_names_not_uuids(self, create_user, workspace, workspace_board):
        project = Project.objects.create(
            name="TRADICAO",
            identifier="TRAD",
            workspace=workspace,
            board=workspace_board,
        )
        ctx = AssistantActorContext(
            user=create_user,
            workspace=workspace,
            board_slug=workspace_board.slug,
            project_id=str(project.id),
        )

        prompt = build_system_prompt(ctx)

        assert f"Board: {workspace_board.name}" in prompt
        assert "Projeto em foco: TRADICAO (chave TRAD)" in prompt
        assert f"project_id={project.id}" in prompt
        assert f"board_slug={workspace_board.slug}" in prompt
        assert "Contexto interno da sessão" in prompt
        assert "não mencionar ao usuário" in prompt
        assert "Contexto silencioso" in prompt
        assert "Personalidade e tom de voz" in prompt
        assert "Nunca exponha UUIDs" in prompt
        assert str(project.id) not in prompt.split("Referência técnica")[0]
