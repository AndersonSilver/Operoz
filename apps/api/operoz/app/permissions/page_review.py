"""RBAC for PRD Review workspace endpoints.

| Action | Admin | Member | Guest |
|--------|-------|--------|-------|
| List/read sessions & inbox | yes | yes | yes (project member) |
| Create session / invites | yes | yes | no |
| Sync feedback → issue | yes | yes | no |
| Guest token endpoints | n/a | n/a | token only |

Guest users never receive workspace API access outside their invited project scope.
"""

from operoz.app.permissions import ROLE
from operoz.app.permissions.page import ProjectPagePermission
from operoz.db.models import ProjectMember


class PageReviewPermission(ProjectPagePermission):
    """Project page permission with explicit deny for guest mutations."""

    def _check_project_action_access(self, request, role):
        if request.method in ["POST", "PUT", "PATCH", "DELETE"] and role == ROLE.GUEST.value:
            return False
        return super()._check_project_action_access(request, role)


def user_is_review_writer(user, slug: str, project_id) -> bool:
    return ProjectMember.objects.filter(
        member=user,
        workspace__slug=slug,
        project_id=project_id,
        is_active=True,
        role__gte=ROLE.MEMBER.value,
    ).exists()
