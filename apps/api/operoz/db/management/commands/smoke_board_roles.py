"""Smoke test 5.4b — funções e permissões do board (execução local)."""

from django.core.management.base import BaseCommand
from django.test import RequestFactory
from django.utils import timezone
from rest_framework.test import force_authenticate

from operoz.app.views.issue.base import IssueViewSet
from operoz.app.permissions import ROLE
from operoz.db.models import (
    Board,
    BoardMemberRole,
    BoardRole,
    Project,
    ProjectMember,
    User,
    Workspace,
    WorkspaceMember,
)
from operoz.utils.board_permission_enforcement import (
    deny_board_permission,
    get_effective_board_permission_keys,
    permission_granted,
)
from operoz.utils.board_roles import seed_board_roles


class Command(BaseCommand):
    help = "Executa smoke test das permissões de board (5.4b-v1)"

    def handle(self, *args, **options):
        results = []
        failed = 0

        def ok(name, cond, detail=""):
            results.append((name, cond, detail))
            if not cond:
                nonlocal failed
                failed += 1

        ws = Workspace.objects.filter(slug="tech4humans", deleted_at__isnull=True).first()
        if not ws:
            ws = Workspace.objects.filter(deleted_at__isnull=True).first()
        board = Board.objects.filter(workspace=ws, slug="teste", deleted_at__isnull=True).first()
        if not board:
            board = Board.objects.filter(workspace=ws, deleted_at__isnull=True).first()

        if not ws or not board:
            self.stderr.write("Sem workspace/board para testar.")
            return

        seed_board_roles(board, None)
        project = Project.objects.filter(board=board, deleted_at__isnull=True).first()
        if not project:
            project = Project.objects.filter(workspace=ws, deleted_at__isnull=True).first()
            if project:
                project.board = board
                project.save(update_fields=["board"])

        if not project:
            self.stderr.write("Sem projeto no board.")
            return

        member_user = User.objects.filter(email="anderson_silveira17@outlook.com").first()
        admin_user = User.objects.filter(email="andersonsilver18@gmail.com").first()
        if not member_user or not admin_user:
            member_user = User.objects.filter(is_active=True).exclude(email=admin_user.email if admin_user else "").first()
            admin_user = User.objects.filter(is_active=True).first()

        observer_role = BoardRole.objects.get(board=board, slug="observer", deleted_at__isnull=True)
        member_role = BoardRole.objects.get(board=board, slug="member", deleted_at__isnull=True)
        admin_role = BoardRole.objects.get(board=board, slug="administrator", deleted_at__isnull=True)

        BoardMemberRole.objects.filter(board=board, user=member_user, deleted_at__isnull=True).update(
            deleted_at=timezone.now()
        )

        def assign_role(user, role):
            BoardMemberRole.objects.filter(board=board, user=user, deleted_at__isnull=True).update(
                deleted_at=timezone.now()
            )
            BoardMemberRole.objects.create(
                board=board,
                workspace_id=board.workspace_id,
                user=user,
                role=role,
                created_by=admin_user,
            )

        def ensure_project_member(user, role=ROLE.MEMBER):
            pm, created = ProjectMember.objects.get_or_create(
                project=project,
                member=user,
                defaults={
                    "workspace_id": project.workspace_id,
                    "role": role.value,
                    "is_active": True,
                    "created_by": admin_user,
                },
            )
            if not created and (not pm.is_active or pm.role != role.value):
                pm.is_active = True
                pm.role = role.value
                pm.save(update_fields=["is_active", "role"])
            return pm

        ensure_project_member(member_user)

        # --- Observador ---
        assign_role(member_user, observer_role)
        keys = get_effective_board_permission_keys(board.id, member_user.id)
        ok("Observador tem funções explícitas", keys is not None and "items.create" not in keys, str(keys))
        ok("Observador bloqueado items.create", deny_board_permission(member_user, project, "items.create") is not None)
        ok("Observador permitido comments.add", deny_board_permission(member_user, project, "items.comments.add") is None)

        factory = RequestFactory()
        req = factory.post(
            f"/api/workspaces/{ws.slug}/projects/{project.id}/issues/",
            {"name": "Smoke test card"},
            format="json",
        )
        force_authenticate(req, user=member_user)
        resp = IssueViewSet.as_view({"post": "create"})(req, slug=ws.slug, project_id=str(project.id))
        ok(
            "Observador API create issue 403 (board)",
            resp.status_code == 403
            and isinstance(getattr(resp, "data", None), dict)
            and resp.data.get("error") == "BOARD_PERMISSION_DENIED",
            f"status={resp.status_code} body={getattr(resp, 'data', None)}",
        )

        # --- Membro ---
        assign_role(member_user, member_role)
        keys = get_effective_board_permission_keys(board.id, member_user.id)
        ok("Membro tem items.create", keys and "items.create" in keys)
        ok("Membro bloqueado items.delete", deny_board_permission(member_user, project, "items.delete") is not None)

        req2 = factory.post(
            f"/api/workspaces/{ws.slug}/projects/{project.id}/issues/",
            {"name": "Smoke test card membro"},
            format="json",
        )
        force_authenticate(req2, user=member_user)
        resp2 = IssueViewSet.as_view({"post": "create"})(req2, slug=ws.slug, project_id=str(project.id))
        ok(
            "Membro API create issue OK",
            resp2.status_code in (200, 201),
            f"status={resp2.status_code} body={getattr(resp2, 'data', None)}",
        )

        # --- Sem função no board (legado) ---
        BoardMemberRole.objects.filter(board=board, user=member_user, deleted_at__isnull=True).update(
            deleted_at=timezone.now()
        )
        ok("Sem board roles → keys None", get_effective_board_permission_keys(board.id, member_user.id) is None)
        ok("Sem board roles → create não bloqueado por board", deny_board_permission(member_user, project, "items.create") is None)

        # --- board.administer em settings ---
        assign_role(member_user, admin_role)
        admin_keys = get_effective_board_permission_keys(board.id, member_user.id)
        ok(
            "Membro com Administrador board pode settings",
            admin_keys is not None and permission_granted(admin_keys, "board.administer"),
        )
        BoardMemberRole.objects.filter(board=board, user=member_user, deleted_at__isnull=True).update(
            deleted_at=timezone.now()
        )
        assign_role(member_user, observer_role)
        obs_keys = get_effective_board_permission_keys(board.id, member_user.id)
        ok(
            "Observador não board.administer",
            obs_keys is None or not permission_granted(obs_keys, "board.administer"),
        )
        ok(
            "Admin WS sempre pode settings",
            bool(
                admin_user
                and WorkspaceMember.objects.filter(
                    member=admin_user,
                    workspace=ws,
                    role=ROLE.ADMIN.value,
                    is_active=True,
                ).exists()
            ),
        )

        self.stdout.write(self.style.MIGRATE_HEADING(f"\nBoard: {board.slug} | Projeto: {project.name}\n"))
        for name, passed, detail in results:
            mark = self.style.SUCCESS("PASS") if passed else self.style.ERROR("FAIL")
            extra = f" — {detail}" if detail and not passed else ""
            self.stdout.write(f"  [{mark}] {name}{extra}")

        self.stdout.write("")
        if failed:
            self.stdout.write(self.style.ERROR(f"{failed} teste(s) falharam."))
        else:
            self.stdout.write(self.style.SUCCESS("Todos os testes passaram."))
