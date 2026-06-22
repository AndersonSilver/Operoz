from __future__ import annotations

import logging

from django.test.utils import override_settings

from operis.app.views.external.base import get_llm_response
from operis.assistant.llm.config import get_llm_config
from operis.assistant.service import AssistantServiceError, run_chat
from operis.db.models import AssistantSession, WorkspaceMember
from operis.discord_integration.models import CustomSlashCommand
from operis.discord_integration.services.text_utils import (
    build_command_prompt,
    truncate_for_discord,
)

logger = logging.getLogger(__name__)


def _resolve_actor_user(command: CustomSlashCommand):
    if command.created_by_id and command.created_by:
        return command.created_by

    admin_membership = (
        WorkspaceMember.objects.filter(
            workspace=command.workspace,
            role=20,
            deleted_at__isnull=True,
            member__is_active=True,
        )
        .select_related("member")
        .first()
    )
    if admin_membership:
        return admin_membership.member
    return None


def _build_session_context(command: CustomSlashCommand) -> dict[str, str]:
    context: dict[str, str] = {}
    if command.board_slug:
        context["board_slug"] = command.board_slug.strip()
    if command.default_project_id:
        context["project_id"] = str(command.default_project_id)
    return context


def _build_user_message(command: CustomSlashCommand, user_input: str) -> str:
    sections: list[str] = []
    if user_input.strip():
        sections.append(user_input.strip())
    sections.append(f"## Instruções do slash command /{command.name}\n{command.prompt_instructions.strip()}")
    return "\n\n".join(sections)


def execute_simple_llm(command: CustomSlashCommand, user_input: str = "") -> str:
    """Fallback sem ferramentas — LLM direta com prompt personalizado."""
    api_key, model, provider, degraded = get_llm_config()
    if degraded or not api_key or not model or not provider:
        return "O assistente Operoz não está configurado nesta instância. Contacte o administrador."

    task = (
        "Você responde a um slash command do Discord integrado ao Operoz. "
        "Seja conciso, em português do Brasil, e use markdown compatível com Discord."
    )
    prompt = build_command_prompt(command, user_input)
    text, error = get_llm_response(task, prompt, api_key, model, provider)
    if error or not text:
        return "Não foi possível gerar uma resposta agora. Tente novamente em instantes."
    return truncate_for_discord(text.strip())


def run_discord_assistant(command: CustomSlashCommand, user_input: str = "") -> str:
    """
    Executa o comando via assistente Operoz completo (RAG + ferramentas).

    Usa board_slug e default_project do comando como escopo da sessão.
    """
    actor = _resolve_actor_user(command)
    if not actor:
        logger.warning("discord assistant fallback: no actor user", extra={"command_id": str(command.pk)})
        return execute_simple_llm(command, user_input)

    session = AssistantSession.objects.create(
        workspace=command.workspace,
        user=actor,
        title=f"discord:{command.name}",
        context=_build_session_context(command),
    )
    user_message = _build_user_message(command, user_input)

    scope_relaxed = not (command.board_slug and command.default_project_id)
    settings_patch = {"ASSISTANT_REQUIRE_SESSION_SCOPE": "0"} if scope_relaxed else {}

    try:
        if settings_patch:
            with override_settings(**settings_patch):
                assistant_message = run_chat(session, user_message)
        else:
            assistant_message = run_chat(session, user_message)
        content = (assistant_message.content or "").strip()
        if not content:
            return "Sem resposta do assistente."
        return truncate_for_discord(content)
    except AssistantServiceError as exc:
        logger.warning(
            "discord assistant service error",
            extra={"command_id": str(command.pk), "code": exc.code},
        )
        return truncate_for_discord(exc.message)
    except Exception:
        logger.exception("discord assistant unexpected error", extra={"command_id": str(command.pk)})
        return execute_simple_llm(command, user_input)
