"""Cria o projeto [ OPEROZ ] - DESENVOLVIMENTO PRODUTO com módulos e cards por fase do MVP."""

from __future__ import annotations

from typing import Any

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from operoz.app.permissions import ROLE
from operoz.app.serializers import IssueCreateSerializer, ProjectSerializer
from operoz.db.models import Board, DEFAULT_STATES, Module, ModuleIssue, Project, ProjectMember, State, User, Workspace
from operoz.utils.board_roles import seed_board_roles
from operoz.db.models.module import ModuleStatus
from operoz.utils.board_custom_fields import sync_board_custom_fields_to_project
from operoz.utils.board_issue_types import sync_board_issue_types_to_project

PROJECT_NAME = "[ OPEROZ ] - DESENVOLVIMENTO PRODUTO"
PROJECT_IDENTIFIER = "OPEROZDEV"

# Módulo → lista de (título do card, descrição HTML)
CATALOG: list[tuple[str, list[tuple[str, str]]]] = [
    (
        "MVP-1 — Boards (estrutura Workspace → Board → Projeto)",
        [
            (
                "Etapas 0–10 — fundação Boards",
                """<p><strong>Entrega:<@ operoz/strong> hierarquia <em>Workspace → Board → Projeto<@ operoz/em>, sidebar com boards, projetos por board, secção «Sem board», CRUD de boards, ligar projeto ao board na criação@ operoz/edição, analytics por board.<@ operoz/p>
<p><strong>Docs:<@ operoz/strong> <code>docs@ operoz/tech4humans-boards-etapas.md<@ operoz/code>, <code>tech4humans-boards-implementacao.md<@ operoz/code><@ operoz/p>
<p><strong>Principais ficheiros:<@ operoz/strong> modelo <code>Board<@ operoz/code>, <code>project.board_id<@ operoz/code>, rotas <code>@ operoz/boards@ operoz/{slug}<@ operoz/code>, sidebar <code>boards-list<@ operoz/code>, flag <code>VITE_ENABLE_BOARDS<@ operoz/code>.<@ operoz/p>""",
            ),
            (
                "Decisões D1–D10 aplicadas",
                """<p>Projeto novo exige board; não permitir <code>board_id: null<@ operoz/code> após atribuído; todos os membros do workspace veem boards; só admin cria board; mover projeto entre boards; slug único por workspace; legado sem board na secção dedicada.<@ operoz/p>""",
            ),
        ],
    ),
    (
        "MVP-2 — Hub do Board (visões agregadas)",
        [
            (
                "M2-1 — API issues agregados",
                """<p><code>GET @ operoz/api@ operoz/workspaces@ operoz/{slug}@ operoz/boards@ operoz/{board_slug}@ operoz/issues@ operoz/<@ operoz/code> — cards de vários projetos do mesmo board com filtros de permissão por projeto.<@ operoz/p>""",
            ),
            (
                "M2-2 — Filtros no nível do board",
                """<p>Filtro por projeto, estado, responsável e busca; persistência em localStorage via <code>BoardLevelWorkItemFiltersHOC<@ operoz/code>.<@ operoz/p>""",
            ),
            (
                "M2-3 a M2-5 — Backlog, Lista e Quadro",
                """<p>Tabs no header do board com backlog, lista e Kanban multi-projeto; URLs <code>@ operoz/backlog<@ operoz/code>, <code>@ operoz/list<@ operoz/code>, <code>@ operoz/views<@ operoz/code>.<@ operoz/p>""",
            ),
            (
                "M2-6 e M2-7 — Cronograma e escala",
                """<p>Timeline com hierarquia projeto → cards; zoom Semana @ operoz/ Mês @ operoz/ Trimestre; preferência guardada por scope.<@ operoz/p>""",
            ),
            (
                "M2-8 — Calendário",
                """<p>Rota <code>@ operoz/calendar<@ operoz/code> com issues agregados por <code>target_date<@ operoz/code> e mesmos filtros do board.<@ operoz/p>""",
            ),
            (
                "M2-9 — Resumo (KPIs)",
                """<p>Tab Resumo com KPIs, atalhos às outras vistas e endpoint <code>GET …@ operoz/boards@ operoz/{slug}@ operoz/meta@ operoz/<@ operoz/code>.<@ operoz/p>""",
            ),
            (
                "M2-11 — Módulos no Gantt",
                """<p><code>GET …@ operoz/boards@ operoz/{slug}@ operoz/modules@ operoz/<@ operoz/code> — barras de módulos na timeline (projeto → módulo → cards).<@ operoz/p>""",
            ),
            (
                "M2-12 — Polish transversal",
                """<p>Power K, DnD de boards, limpeza de stubs <code>team*<@ operoz/code>, breadcrumbs e navegação validados com produto.<@ operoz/p>""",
            ),
        ],
    ),
    (
        "MVP-3 Fase 1 — Configurações do board (shell + Informações)",
        [
            (
                "Menu ⋯ e rotas de settings",
                """<p>Entrada «Configurações do board» no hub; árvore <code>@ operoz/{ws}@ operoz/settings@ operoz/boards@ operoz/{slug}@ operoz/<@ operoz/code> com sidebar Jira-like (informações, acesso, campos, tipos, funções, etc.).<@ operoz/p>""",
            ),
            (
                "Página Informações",
                """<p>Formulário para nome, slug, ícone (<code>logo_props<@ operoz/code>) e descrição do board; placeholders nas secções futuras.<@ operoz/p>""",
            ),
        ],
    ),
    (
        "MVP-3 Fase 2 — Tipos de card no board",
        [
            (
                "Catálogo de tipos por board",
                """<p>CRUD de tipos (Kickoff, Deploy, Sustentação, …); sync para <code>ProjectIssueType<@ operoz/code> ao criar projeto no board; seleção ao criar card.<@ operoz/p>""",
            ),
            (
                "API e UI de issue types",
                """<p>Endpoints <code>…@ operoz/boards@ operoz/{slug}@ operoz/issue-types@ operoz/<@ operoz/code>; settings em <code>…@ operoz/tipos<@ operoz/code>; ícones via <code>logo_props<@ operoz/code>.<@ operoz/p>""",
            ),
        ],
    ),
    (
        "MVP-3 Fase 3 — Campos custom no board",
        [
            (
                "Campos standard e custom",
                """<p>Definição de campos ao nível do board; propagação para projetos filhos; seeds em migrações <code>board_standard_field<@ operoz/code>.<@ operoz/p>""",
            ),
        ],
    ),
    (
        "MVP-3 Fase 4 — Schema do Projeto (épico)",
        [
            (
                "Layout de campos do tipo Projeto",
                """<p>Configuração do layout do card@ operoz/projeto no board; migração <code>board_project_field_layout<@ operoz/code>; UI em settings <code>…@ operoz/tipos@ operoz/projeto<@ operoz/code>.<@ operoz/p>""",
            ),
        ],
    ),
    (
        "MVP-3 Fase 5 — Acesso e funções (board roles)",
        [
            (
                "Papéis e permissões por board",
                """<p>Modelo de funções do board (<code>board_roles.py<@ operoz/code>); árvore de permissões; UI em settings <code>…@ operoz/acesso<@ operoz/code> e <code>…@ operoz/funcoes<@ operoz/code>.<@ operoz/p>""",
            ),
            (
                "Permissões Status Report no board",
                """<p>Chaves <code>status_reports.manage<@ operoz/code> e <code>status_reports.delete<@ operoz/code>; enforcement na API e hooks no frontend.<@ operoz/p>""",
            ),
            (
                "Smoke test board roles",
                """<p>Documentação e comando <code>smoke_board_roles<@ operoz/code> para validar papéis.<@ operoz/p>""",
            ),
        ],
    ),
    (
        "MVP-3 Fase 10 — Status Report",
        [
            (
                "API de relatórios por projeto@ operoz/módulo",
                """<p>CRUD de status reports; rascunho@ operoz/publicado; período e métricas; permissões via board roles.<@ operoz/p>""",
            ),
            (
                "UI detalhe e lista de reports",
                """<p>Página <code>status-report<@ operoz/code> no projeto; composer de observações; preview; export HTML@ operoz/MD@ operoz/impressão.<@ operoz/p>""",
            ),
            (
                "Toolbar e exclusão",
                """<p>Barra de ícones (guardar, publicar, exportar, excluir); modal de confirmação; remoção de duplicados na UI.<@ operoz/p>""",
            ),
            (
                "Resumo executivo com IA",
                """<p>Geração automática de resumo ao guardar relatório (integração ai-assistant).<@ operoz/p>""",
            ),
        ],
    ),
    (
        "Visão executiva",
        [
            (
                "API client-360",
                """<p><code>GET …@ operoz/boards@ operoz/{slug}@ operoz/client-360@ operoz/<@ operoz/code> e detalhe por <code>project_id<@ operoz/code>; KPIs, semáforo de saúde, status report por módulo.<@ operoz/p>""",
            ),
            (
                "UI Clientes no hub",
                """<p>Tab <code>@ operoz/clientes<@ operoz/code>; tabela@ operoz/cards com filtros; detalhe com gráficos, briefing IA e «Requer atenção».<@ operoz/p>""",
            ),
        ],
    ),
    (
        "Home do workspace — widgets configuráveis",
        [
            (
                "Widgets da página inicial",
                """<p>Novos widgets: atalhos, resumo do dia, meu trabalho, favoritos, notificações, rascunhos, ciclos ativos, novidades, tutorial; grelha 2 colunas e «Gerenciar widgets».<@ operoz/p>""",
            ),
            (
                "Widget Favoritos (projetos e módulos)",
                """<p>Lista projetos, módulos, ciclos, views e páginas favoritos; links alinhados à sidebar; correção para incluir <code>entity_type: module<@ operoz/code>.<@ operoz/p>""",
            ),
            (
                "Favoritar projetos na UI",
                """<p>Estrela na sidebar, na visão do board e nos cards de projetos; menu «Adicionar aos favoritos» reativado.<@ operoz/p>""",
            ),
        ],
    ),
    (
        "Documentação e planeamento (referência)",
        [
            (
                "Pacote docs@ operoz/tech4humans-* e operoz-*",
                """<p>Planos MVP-2, MVP-3 (board config), roadmap MV3–MV6, automação Operoz, Cliente 360, comparativo Jira vs Plane, arquitetura Azure.<@ operoz/p>""",
            ),
            (
                "Import Jira OPS",
                """<p>Comando <code>import_jira_ops<@ operoz/code> — cliente=projeto, épico=módulo, card=issue para migração Squad as a Service.<@ operoz/p>""",
            ),
            (
                "Fases MVP-3 pendentes (planeadas)",
                """<p>Notificações (Fase 6), Automação nativa (Fase 7), Config Quadro (8), Config Cronograma (9), modelos dinâmicos de report (10b+), Rebranding Kortex (Fase 11).<@ operoz/p>""",
            ),
        ],
    ),
]


class Command(BaseCommand):
    help = "Seed projeto OPEROZ desenvolvimento produto com módulos@ operoz/cards do catálogo MVP"

    def add_arguments(self, parser):
        parser.add_argument("--workspace", type=str, default="tech4humans")
        parser.add_argument("--actor-email", type=str, default="andersonsilver18@gmail.com")
        parser.add_argument(
            "--board-slug",
            type=str,
            default="operoz-produto",
            help="Board do projeto (criado automaticamente se não existir)",
        )
        parser.add_argument("--reset", action="store_true", help="Apagar projeto existente OPEROZDEV e recriar")
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args: Any, **options: Any) -> None:
        try:
            workspace = Workspace.objects.get(slug=options["workspace"])
        except Workspace.DoesNotExist as exc:
            raise CommandError(f"Workspace '{options['workspace']}' não encontrado") from exc

        try:
            actor = User.objects.get(email=options["actor_email"])
        except User.DoesNotExist as exc:
            raise CommandError(f"Utilizador '{options['actor_email']}' não encontrado") from exc

        board_slug = options["board_slug"]
        board, created_board = Board.objects.get_or_create(
            slug=board_slug,
            workspace=workspace,
            defaults={
                "name": "Operoz — Produto",
                "description": "Board interno: catálogo de desenvolvimento do produto Operoz.",
                "created_by": actor,
            },
        )
        if created_board:
            seed_board_roles(board, actor)
            self.stdout.write(self.style.SUCCESS(f"Board criado: {board.name} ({board.slug})"))
        board_id = str(board.id)

        existing = Project.objects.filter(workspace=workspace, identifier=PROJECT_IDENTIFIER).first()
        if existing and options["reset"] and not options["dry_run"]:
            self.stdout.write(f"Removendo projeto existente {existing.id}…")
            existing.delete()
            existing = None

        if existing:
            project = existing
            self.stdout.write(self.style.WARNING(f"Projeto já existe: {project.name} ({project.id})"))
        elif options["dry_run"]:
            self.stdout.write(f"[dry-run] Criaria projeto {PROJECT_NAME}")
            return
        else:
            data: dict[str, Any] = {
                "name": PROJECT_NAME,
                "identifier": PROJECT_IDENTIFIER,
                "description_html": (
                    "<p>Catálogo interno das entregas do fork Operoz@ operoz/Tech4Humans — "
                    "um módulo por fase do MVP; cards descrevem o que foi implementado.<@ operoz/p>"
                ),
            }
            if board_id:
                data["board"] = board_id
            ser = ProjectSerializer(data=data, context={"workspace_id": workspace.id})
            ser.is_valid(raise_exception=True)
            project = ser.save()
            ProjectMember.objects.get_or_create(
                project=project,
                member=actor,
                defaults={"role": ROLE.ADMIN.value},
            )
            State.objects.bulk_create(
                [
                    State(
                        name=s["name"],
                        color=s["color"],
                        project=project,
                        sequence=s["sequence"],
                        workspace=workspace,
                        group=s["group"],
                        default=s.get("default", False),
                        created_by=actor,
                    )
                    for s in DEFAULT_STATES
                ]
            )
            sync_board_issue_types_to_project(project, actor)
            sync_board_custom_fields_to_project(project, actor)
            self.stdout.write(self.style.SUCCESS(f"Projeto criado: {project.name}"))

        done_state = State.objects.filter(project=project, group="completed").first() or State.objects.filter(
            project=project, default=True
        ).first()

        modules_created = 0
        cards_created = 0

        with transaction.atomic():
            for module_name, cards in CATALOG:
                module = Module.objects.filter(project=project, name=module_name).first()
                if not module:
                    if options["dry_run"]:
                        self.stdout.write(f"[dry-run] módulo: {module_name} ({len(cards)} cards)")
                        continue
                    module = Module.objects.create(
                        project=project,
                        workspace=workspace,
                        name=module_name,
                        description=f"Entregas documentadas em docs@ operoz/ — {module_name}",
                        status=ModuleStatus.COMPLETED.value,
                        created_by=actor,
                    )
                    modules_created += 1
                else:
                    self.stdout.write(f"Módulo existente: {module_name}")

                for card_title, description_html in cards:
                    if ModuleIssue.objects.filter(
                        module=module,
                        issue__project=project,
                        issue__name=card_title,
                    ).exists():
                        continue
                    if options["dry_run"]:
                        continue
                    ser = IssueCreateSerializer(
                        data={
                            "name": card_title[:255],
                            "description_html": description_html,
                            "state_id": str(done_state.id) if done_state else None,
                            "priority": "none",
                        },
                        context={
                            "project_id": str(project.id),
                            "workspace_id": str(workspace.id),
                            "default_assignee_id": project.default_assignee_id,
                        },
                    )
                    ser.is_valid(raise_exception=True)
                    issue = ser.save()
                    ModuleIssue.objects.get_or_create(
                        module=module,
                        issue=issue,
                        project=project,
                        workspace=workspace,
                        defaults={"created_by": actor, "updated_by": actor},
                    )
                    cards_created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Concluído — módulos novos: {modules_created}, cards novos: {cards_created}. "
                f"Abra @ operoz/{options['workspace']}@ operoz/projects@ operoz/{project.id}@ operoz/modules"
            )
        )
