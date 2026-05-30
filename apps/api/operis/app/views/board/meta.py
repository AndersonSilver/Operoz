from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from operis.app.permissions import ROLE, allow_permission
from operis.app.views.base import BaseViewSet
from operis.db.models import Board, Issue, IssueActivity, Project

CLOSED_STATE_GROUPS = ("completed", "cancelled")


def _project_permission_filters(user) -> Q:
    """Mesmo critério de WorkspaceViewIssuesViewSet._get_project_permission_filters."""
    return Q(
        Q(
            project__project_projectmember__role=5,
            project__guest_view_all_features=True,
        )
        | Q(
            project__project_projectmember__role=5,
            project__guest_view_all_features=False,
            created_by=user,
        )
        | Q(project__project_projectmember__role__gt=5),
        project__project_projectmember__member=user,
        project__project_projectmember__is_active=True,
    )


class BoardMetaViewSet(BaseViewSet):
    """Contagens agregadas do board para o Resumo (M2-9)."""

    use_read_replica = True

    def _get_board(self, slug: str, board_slug: str):
        return (
            Board.objects.filter(
                workspace__slug=slug,
                slug=board_slug,
                archived_at__isnull=True,
                deleted_at__isnull=True,
            )
            .first()
        )

    def _board_issues_queryset(self, slug: str, board_id: str):
        return (
            Issue.issue_objects.filter(
                workspace__slug=slug,
                project__board_id=board_id,
            )
            .filter(_project_permission_filters(self.request.user))
            .distinct()
        )

    def _accessible_board_projects_count(self, slug: str, board_id: str) -> int:
        return (
            Project.objects.filter(
                workspace__slug=slug,
                board_id=board_id,
                archived_at__isnull=True,
                project_projectmember__member=self.request.user,
                project_projectmember__is_active=True,
            )
            .distinct()
            .count()
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def retrieve(self, request, slug, board_slug):
        board = self._get_board(slug, board_slug)
        if not board:
            return Response({"error": "Board not found"}, status=status.HTTP_404_NOT_FOUND)

        issue_queryset = self._board_issues_queryset(slug, str(board.id))
        projects_count = self._accessible_board_projects_count(slug, str(board.id))

        total_issues = issue_queryset.count()

        pending_queryset = issue_queryset.filter(~Q(state__group__in=CLOSED_STATE_GROUPS))
        pending_issues = pending_queryset.count()

        completed_issues = issue_queryset.filter(state__group="completed").count()

        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)

        overdue_issues = pending_queryset.filter(
            target_date__lt=today,
            target_date__isnull=False,
        ).count()

        due_this_week = pending_queryset.filter(
            target_date__gte=today,
            target_date__lte=week_end,
        ).count()

        without_target_date = pending_queryset.filter(target_date__isnull=True).count()

        due_soon_end = today + timedelta(days=7)
        due_soon = pending_queryset.filter(
            target_date__gte=today,
            target_date__lte=due_soon_end,
        ).count()

        seven_days_ago = timezone.now() - timedelta(days=7)
        activity_last_7_days = {
            "completed": issue_queryset.filter(completed_at__gte=seven_days_ago).count(),
            "updated": issue_queryset.filter(updated_at__gte=seven_days_ago).count(),
            "created": issue_queryset.filter(created_at__gte=seven_days_ago).count(),
        }

        state_distribution = [
            {
                "state_id": str(row["state__id"]) if row["state__id"] else None,
                "state_name": row["state__name"] or "Sem estado",
                "state_color": row["state__color"] or "#858585",
                "state_group": row["state__group"] or "unstarted",
                "count": row["count"],
            }
            for row in issue_queryset.values(
                "state__id", "state__name", "state__color", "state__group"
            )
            .annotate(count=Count("pk", distinct=True))
            .order_by("-count")
        ]

        priority_distribution = [
            {"priority": row["priority"], "count": row["count"]}
            for row in issue_queryset.values("priority")
            .annotate(count=Count("pk", distinct=True))
            .order_by("-count")
        ]

        type_distribution = [
            {
                "type_id": str(row["type__id"]) if row["type__id"] else None,
                "type_name": row["type__name"] or "Sem tipo",
                "count": row["count"],
            }
            for row in issue_queryset.values("type__id", "type__name")
            .annotate(count=Count("pk", distinct=True))
            .order_by("-count")
        ]

        issue_ids = issue_queryset.values_list("id", flat=True)
        recent_activity_qs = (
            IssueActivity.objects.filter(issue_id__in=issue_ids)
            .select_related("actor", "issue", "issue__project")
            .order_by("-created_at")[:20]
        )
        recent_activity = []
        for activity in recent_activity_qs:
            actor_payload = None
            if activity.actor_id and activity.actor:
                actor_payload = {
                    "id": str(activity.actor_id),
                    "display_name": activity.actor.display_name,
                    "avatar_url": activity.actor.avatar_url,
                }
            issue_payload = None
            if activity.issue_id and activity.issue:
                project = activity.issue.project
                issue_payload = {
                    "id": str(activity.issue_id),
                    "name": activity.issue.name,
                    "sequence_id": activity.issue.sequence_id,
                    "project_id": str(activity.issue.project_id),
                    "project_identifier": project.identifier if project else "",
                }
            recent_activity.append(
                {
                    "id": str(activity.id),
                    "verb": activity.verb,
                    "field": activity.field,
                    "created_at": activity.created_at.isoformat(),
                    "actor": actor_payload,
                    "issue": issue_payload,
                }
            )

        return Response(
            {
                "projects_count": projects_count,
                "total_issues": total_issues,
                "pending_issues": pending_issues,
                "completed_issues": completed_issues,
                "overdue_issues": overdue_issues,
                "due_this_week": due_this_week,
                "without_target_date": without_target_date,
                "due_soon": due_soon,
                "activity_last_7_days": activity_last_7_days,
                "state_distribution": state_distribution,
                "priority_distribution": priority_distribution,
                "type_distribution": type_distribution,
                "recent_activity": recent_activity,
            },
            status=status.HTTP_200_OK,
        )
