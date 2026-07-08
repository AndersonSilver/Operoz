from __future__ import annotations

import json
import logging

from django.db.models import QuerySet
from django.test.utils import override_settings

from operoz.app.permissions import ROLE
from operoz.app.views.external.base import get_llm_response
from operoz.assistant.llm.config import get_llm_config
from operoz.assistant.security.access import (
    filter_accessible_issues,
    get_board,
    require_workspace_role_at_least,
)
from operoz.assistant.service import AssistantServiceError, _actor_from_session, run_chat
from operoz.assistant.types import AssistantActorContext
from operoz.db.models import AssistantSession, Issue, Project, WorkspaceMember
from operoz.discord_integration.models import CustomSlashCommand
from operoz.discord_integration.services.discord_formatting import (
    DiscordReply,
    build_error_reply,
    build_focus_reply,
    build_overview_reply,
    build_text_embed,
)
from operoz.discord_integration.services.discord_project_stats import enrich_discord_project_stats
from operoz.discord_integration.services.text_utils import build_command_prompt

logger = logging.getLogger(__name__)

DISCORD_OPEN_SCOPE_INSTRUCTIONS = """## Modo Discord (escopo flexível)
- O usuário está no Discord: **não** peça para selecionar board ou projeto no painel do Operoz.
- **Pergunta genérica** (status geral, todos os clientes): use os dados de «Dados Operoz» ou `get_project_stats` \
sem `project_id`.
- **Pergunta sobre um cliente específico** (ex.: MAGALU, SICREDI): identifique o projeto pelo **nome** ou \
**identifier** e aprofunde só nesse projeto.
- Consulte ferramentas **antes** de complementar; não invente números.
- Resposta **curta** (máx. ~1200 caracteres), em português do Brasil, markdown Discord.
- **Formato:** uma frase inicial com números-chave; depois bullets com **negrito** nos títulos.
- **Omita** secções vazias («Sem registro no Operoz») — só inclua o que tiver dado real.
- Proibido cumprimentar ou perguntar «como posso ajudar»."""

DISCORD_EXECUTE_TRIGGER = (
    "Execute agora o relatório conforme as instruções do slash command. "
    "Use os dados em «Dados Operoz» quando existirem. "
    "Proibido cumprimentar, perguntar «como posso ajudar» ou descrever o que vai fazer — entregue o relatório direto."
)


def _resolve_actor_user(command: CustomSlashCommand):
    if command.created_by_id and command.created_by:
        return command.created_by

    admin_membership = (
        WorkspaceMember.objects.filter(
            workspace=command.workspace,
            role=ROLE.ADMIN.value,
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


def _discord_admin_read(ctx: AssistantActorContext) -> bool:
    return require_workspace_role_at_least(ctx, ROLE.ADMIN.value)


def _projects_for_discord(ctx: AssistantActorContext) -> QuerySet[Project]:
    qs = Project.objects.filter(workspace=ctx.workspace, archived_at__isnull=True)
    if ctx.board_slug:
        board = get_board(ctx, ctx.board_slug)
        if not board:
            return Project.objects.none()
        qs = qs.filter(board_id=board.id)
    if ctx.project_id:
        qs = qs.filter(pk=ctx.project_id)

    if _discord_admin_read(ctx):
        return qs.distinct()

    return qs.filter(
        project_projectmember__member=ctx.user,
        project_projectmember__is_active=True,
    ).distinct()


def _issues_for_discord(ctx: AssistantActorContext, project_id: str):
    if _discord_admin_read(ctx):
        return Issue.issue_objects.filter(workspace_id=ctx.workspace.id, project_id=project_id)
    return filter_accessible_issues(ctx, project_id)


def _prefetch_project_stats(session: AssistantSession) -> tuple[str, list[dict[str, object]]]:
    ctx = _actor_from_session(session)
    projects = list(_projects_for_discord(ctx)[:50])
    if not projects:
        block = (
            "## Dados Operoz\n"
            "Nenhum projeto encontrado para este workspace/escopo. "
            "Verifique se existem projetos ativos e se o utilizador do comando é membro ou admin do workspace."
        )
        return block, []

    stats: list[dict[str, object]] = []
    for project in projects:
        pid = str(project.id)
        issues_qs = _issues_for_discord(ctx, pid)
        total_issues = issues_qs.count()
        completed_issues = issues_qs.filter(state__group__in=["completed", "cancelled"]).count()
        stats.append(
            {
                "project_id": pid,
                "name": project.name,
                "identifier": project.identifier,
                "total_issues": total_issues,
                "completed_issues": completed_issues,
                "open_issues": max(0, total_issues - completed_issues),
            }
        )

    stats = enrich_discord_project_stats(stats, projects)

    payload = json.dumps({"projects": stats, "count": len(stats)}, ensure_ascii=False, indent=2)
    block = f"## Dados Operoz (consultados agora)\n```json\n{payload}\n```"
    return block, stats


def _build_user_message(
    command: CustomSlashCommand,
    user_input: str,
    *,
    scope_relaxed: bool,
    stats_block: str = "",
) -> str:
    sections: list[str] = []
    if user_input.strip():
        sections.append(user_input.strip())
    else:
        sections.append(DISCORD_EXECUTE_TRIGGER)
    if stats_block.strip():
        sections.append(stats_block.strip())
    sections.append(f"## Instruções do slash command /{command.name}\n{command.prompt_instructions.strip()}")
    if scope_relaxed:
        sections.append(DISCORD_OPEN_SCOPE_INSTRUCTIONS)
    return "\n\n".join(sections)


def execute_simple_llm(command: CustomSlashCommand, user_input: str = "") -> DiscordReply:
    """Fallback sem ferramentas — LLM direta com prompt personalizado."""
    api_key, model, provider, degraded = get_llm_config()
    if degraded or not api_key or not model or not provider:
        return build_error_reply("O assistente Operoz não está configurado nesta instância. Contacte o administrador.")

    task = (
        "Você responde a um slash command do Discord integrado ao Operoz. "
        "Seja conciso, em português do Brasil, e use markdown compatível com Discord. "
        "Nunca cumprimente — entregue o relatório pedido."
    )
    prompt = build_command_prompt(command, user_input or DISCORD_EXECUTE_TRIGGER)
    text, error = get_llm_response(task, prompt, api_key, model, provider)
    if error or not text:
        return build_error_reply("Não foi possível gerar uma resposta agora. Tente novamente em instantes.")
    focus = user_input.strip()
    title = f"Status · {focus}" if focus else "Status dos projetos"
    return build_text_embed(title=title, description=text.strip())


def run_discord_assistant(command: CustomSlashCommand, user_input: str = "") -> DiscordReply:
    """
    Executa o comando via assistente Operoz completo (RAG + ferramentas).

    Visão geral (sem foco): embed compacto a partir das métricas — sem LLM, sem corte.
    Com foco: assistente + embed formatado.
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
    scope_relaxed = not (command.board_slug and command.default_project_id)
    stats_block, stats_list = _prefetch_project_stats(session)

    if not user_input.strip():
        return build_overview_reply(stats_list)

    user_message = _build_user_message(
        command,
        user_input,
        scope_relaxed=scope_relaxed,
        stats_block=stats_block,
    )

    try:
        if scope_relaxed:
            with override_settings(ASSISTANT_REQUIRE_SESSION_SCOPE="0"):
                assistant_message = run_chat(session, user_message)
        else:
            assistant_message = run_chat(session, user_message)
        content = (assistant_message.content or "").strip()
        if not content:
            return build_error_reply("Sem resposta do assistente.")
        return build_focus_reply(focus=user_input, llm_text=content, stats=stats_list)
    except AssistantServiceError as exc:
        logger.warning(
            "discord assistant service error",
            extra={"command_id": str(command.pk), "code": exc.code},
        )
        return build_error_reply(exc.message)
    except Exception:
        logger.exception("discord assistant unexpected error", extra={"command_id": str(command.pk)})
        return execute_simple_llm(command, user_input)
