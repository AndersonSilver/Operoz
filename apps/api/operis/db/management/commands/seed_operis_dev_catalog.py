"""Cria o projeto [ OPERIS ] - DESENVOLVIMENTO PRODUTO com módulos e cards por fase do MVP."""

from __future__ import annotations

from typing import Any

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from operis.app.permissions import ROLE
from operis.app.serializers import IssueCreateSerializer, ProjectSerializer
from operis.db.models import Board, DEFAULT_STATES, Module, ModuleIssue, Project, ProjectMember, State, User, Workspace
from operis.utils.board_roles import seed_board_roles
from operis.db.models.module import ModuleStatus
from operis.utils.board_custom_fields import sync_board_custom_fields_to_project
from operis.utils.board_issue_types import sync_board_issue_types_to_project

PROJECT_NAME = "[ OPERIS ] - DESENVOLVIMENTO PRODUTO"
PROJECT_IDENTIFIER = "OPERISDEV"

# Módulo → lista de (título do card, descrição HTML)
CATALOG: list[tuple[str, list[tuple[str, str]]]] = [
    (
        "MVP-1 — Boards (estrutura Workspace → Board → Projeto)",
        [
            (
                "Etapas 0–10 — fundação Boards",
                """<p><strong>Entrega:</strong> hierarquia <em>Workspace → Board → Projeto</em>, sidebar com boards, projetos por board, secção «Sem board», CRUD de boards, ligar projeto ao board na criação/edição, analytics por board.</p>
<p><strong>Docs:</strong> <code>docs/tech4humans-boards-etapas.md</code>, <code>tech4humans-boards-implementacao.md</code></p>
<p><strong>Principais ficheiros:</strong> modelo <code>Board</code>, <code>project.board_id</code>, rotas <code>/boards/{slug}</code>, sidebar <code>boards-list</code>, flag <code>VITE_ENABLE_BOARDS</code>.</p>""",
            ),
            (
                "Decisões D1–D10 aplicadas",
                """<p>Projeto novo exige board; não permitir <code>board_id: null</code> após atribuído; todos os membros do workspace veem boards; só admin cria board; mover projeto entre boards; slug único por workspace; legado sem board na secção dedicada.</p>""",
            ),
        ],
    ),
    (
        "MVP-2 — Hub do Board (visões agregadas)",
        [
            (
                "M2-1 — API issues agregados",
                """<p><code>GET /api/workspaces/{slug}/boards/{board_slug}/issues/</code> — cards de vários projetos do mesmo board com filtros de permissão por projeto.</p>""",
            ),
            (
                "M2-2 — Filtros no nível do board",
                """<p>Filtro por projeto, estado, responsável e busca; persistência em localStorage via <code>BoardLevelWorkItemFiltersHOC</code>.</p>""",
            ),
            (
                "M2-3 a M2-5 — Backlog, Lista e Quadro",
                """<p>Tabs no header do board com backlog, lista e Kanban multi-projeto; URLs <code>/backlog</code>, <code>/list</code>, <code>/views</code>.</p>""",
            ),
            (
                "M2-6 e M2-7 — Cronograma e escala",
                """<p>Timeline com hierarquia projeto → cards; zoom Semana / Mês / Trimestre; preferência guardada por scope.</p>""",
            ),
            (
                "M2-8 — Calendário",
                """<p>Rota <code>/calendar</code> com issues agregados por <code>target_date</code> e mesmos filtros do board.</p>""",
            ),
            (
                "M2-9 — Resumo (KPIs)",
                """<p>Tab Resumo com KPIs, atalhos às outras vistas e endpoint <code>GET …/boards/{slug}/meta/</code>.</p>""",
            ),
            (
                "M2-11 — Módulos no Gantt",
                """<p><code>GET …/boards/{slug}/modules/</code> — barras de módulos na timeline (projeto → módulo → cards).</p>""",
            ),
            (
                "M2-12 — Polish transversal",
                """<p>Power K, DnD de boards, limpeza de stubs <code>team*</code>, breadcrumbs e navegação validados com produto.</p>""",
            ),
        ],
    ),
    (
        "MVP-3 Fase 1 — Configurações do board (shell + Informações)",
        [
            (
                "Menu ⋯ e rotas de settings",
                """<p>Entrada «Configurações do board» no hub; árvore <code>/{ws}/settings/boards/{slug}/</code> com sidebar Jira-like (informações, acesso, campos, tipos, funções, etc.).</p>""",
            ),
            (
                "Página Informações",
                """<p>Formulário para nome, slug, ícone (<code>logo_props</code>) e descrição do board; placeholders nas secções futuras.</p>""",
            ),
        ],
    ),
    (
        "MVP-3 Fase 2 — Tipos de card no board",
        [
            (
                "Catálogo de tipos por board",
                """<p>CRUD de tipos (Kickoff, Deploy, Sustentação, …); sync para <code>ProjectIssueType</code> ao criar projeto no board; seleção ao criar card.</p>""",
            ),
            (
                "API e UI de issue types",
                """<p>Endpoints <code>…/boards/{slug}/issue-types/</code>; settings em <code>…/tipos</code>; ícones via <code>logo_props</code>.</p>""",
            ),
        ],
    ),
    (
        "MVP-3 Fase 3 — Campos custom no board",
        [
            (
                "Campos standard e custom",
                """<p>Definição de campos ao nível do board; propagação para projetos filhos; seeds em migrações <code>board_standard_field</code>.</p>""",
            ),
        ],
    ),
    (
        "MVP-3 Fase 4 — Schema do Projeto (épico)",
        [
            (
                "Layout de campos do tipo Projeto",
                """<p>Configuração do layout do card/projeto no board; migração <code>board_project_field_layout</code>; UI em settings <code>…/tipos/projeto</code>.</p>""",
            ),
        ],
    ),
    (
        "MVP-3 Fase 5 — Acesso e funções (board roles)",
        [
            (
                "Papéis e permissões por board",
                """<p>Modelo de funções do board (<code>board_roles.py</code>); árvore de permissões; UI em settings <code>…/acesso</code> e <code>…/funcoes</code>.</p>""",
            ),
            (
                "Permissões Status Report no board",
                """<p>Chaves <code>status_reports.manage</code> e <code>status_reports.delete</code>; enforcement na API e hooks no frontend.</p>""",
            ),
            (
                "Smoke test board roles",
                """<p>Documentação e comando <code>smoke_board_roles</code> para validar papéis.</p>""",
            ),
        ],
    ),
    (
        "MVP-3 Fase 10 — Status Report",
        [
            (
                "API de relatórios por projeto/módulo",
                """<p>CRUD de status reports; rascunho/publicado; período e métricas; permissões via board roles.</p>""",
            ),
            (
                "UI detalhe e lista de reports",
                """<p>Página <code>status-report</code> no projeto; composer de observações; preview; export HTML/MD/impressão.</p>""",
            ),
            (
                "Toolbar e exclusão",
                """<p>Barra de ícones (guardar, publicar, exportar, excluir); modal de confirmação; remoção de duplicados na UI.</p>""",
            ),
            (
                "Resumo executivo com IA",
                """<p>Geração automática de resumo ao guardar relatório (integração ai-assistant).</p>""",
            ),
        ],
    ),
    (
        "Visão executiva",
        [
            (
                "API client-360",
                """<p><code>GET …/boards/{slug}/client-360/</code> e detalhe por <code>project_id</code>; KPIs, semáforo de saúde, status report por módulo.</p>""",
            ),
            (
                "UI Clientes no hub",
                """<p>Tab <code>/clientes</code>; tabela/cards com filtros; detalhe com gráficos, briefing IA e «Requer atenção».</p>""",
            ),
        ],
    ),
    (
        "Home do workspace — widgets configuráveis",
        [
            (
                "Widgets da página inicial",
                """<p>Novos widgets: atalhos, resumo do dia, meu trabalho, favoritos, notificações, rascunhos, ciclos ativos, novidades, tutorial; grelha 2 colunas e «Gerenciar widgets».</p>""",
            ),
            (
                "Widget Favoritos (projetos e módulos)",
                """<p>Lista projetos, módulos, ciclos, views e páginas favoritos; links alinhados à sidebar; correção para incluir <code>entity_type: module</code>.</p>""",
            ),
            (
                "Favoritar projetos na UI",
                """<p>Estrela na sidebar, na visão do board e nos cards de projetos; menu «Adicionar aos favoritos» reativado.</p>""",
            ),
        ],
    ),
    (
        "Documentação e planeamento (referência)",
        [
            (
                "Pacote docs/tech4humans-* e operis-*",
                """<p>Planos MVP-2, MVP-3 (board config), roadmap MV3–MV6, automação Operis, Cliente 360, comparativo Jira vs Plane, arquitetura Azure.</p>""",
            ),
            (
                "Import Jira OPS",
                """<p>Comando <code>import_jira_ops</code> — cliente=projeto, épico=módulo, card=issue para migração Squad as a Service.</p>""",
            ),
            (
                "Fases MVP-3 pendentes (planeadas)",
                """<p>Notificações (Fase 6), Automação nativa (Fase 7), Config Quadro (8), Config Cronograma (9), modelos dinâmicos de report (10b+), Rebranding Kortex (Fase 11).</p>""",
            ),
        ],
    ),
]


class Command(BaseCommand):
    help = "Seed projeto OPERIS desenvolvimento produto com módulos/cards do catálogo MVP"

    def add_arguments(self, parser):
        parser.add_argument("--workspace", type=str, default="tech4humans")
        parser.add_argument("--actor-email", type=str, default="andersonsilver18@gmail.com")
        parser.add_argument(
            "--board-slug",
            type=str,
            default="operis-produto",
            help="Board do projeto (criado automaticamente se não existir)",
        )
        parser.add_argument("--reset", action="store_true", help="Apagar projeto existente OPERISDEV e recriar")
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
                "name": "Operis — Produto",
                "description": "Board interno: catálogo de desenvolvimento do produto Operis.",
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
                    "<p>Catálogo interno das entregas do fork Operis/Tech4Humans — "
                    "um módulo por fase do MVP; cards descrevem o que foi implementado.</p>"
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
                        description=f"Entregas documentadas em docs/ — {module_name}",
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
                f"Abra /{options['workspace']}/projects/{project.id}/modules"
            )
        )
