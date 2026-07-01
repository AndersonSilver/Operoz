from rest_framework import serializers

from operoz.db.models import Workspace


class WorkspaceIssueNotificationFlagsSerializer(serializers.ModelSerializer):
    """Writable subset for God Mode — per-workspace issue email behaviour."""

    class Meta:
        model = Workspace
        fields = (
            "issue_notify_assignees_always_email",
            "issue_notify_email_include_extended_activities",
            "issue_notify_email_include_description_changes",
            "issue_notify_email_dispatch_immediately",
        )
