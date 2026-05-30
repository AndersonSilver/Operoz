# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Module imports
from ..base import BaseAPIView
from plane.db.models.workspace import WorkspaceHomePreference
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import Workspace
from plane.app.serializers.workspace import WorkspaceHomePreferenceSerializer

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Widgets disabled by default for new users
DEFAULT_DISABLED_WIDGET_KEYS = frozenset({"new_at_plane", "quick_tutorial"})


class WorkspaceHomePreferenceViewSet(BaseAPIView):
    model = WorkspaceHomePreference

    def get_serializer_class(self):
        return WorkspaceHomePreferenceSerializer

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)

        get_preference = WorkspaceHomePreference.objects.filter(user=request.user, workspace_id=workspace.id)
        existing_keys = set(get_preference.values_list("key", flat=True))

        keys = [key for key, _ in WorkspaceHomePreference.HomeWidgetKeys.choices]
        missing_keys = [key for key in keys if key not in existing_keys]

        if missing_keys:
            preferences_to_create = [
                WorkspaceHomePreference(
                    key=key,
                    user=request.user,
                    workspace=workspace,
                    sort_order=1000 - index,
                    is_enabled=key not in DEFAULT_DISABLED_WIDGET_KEYS,
                )
                for index, key in enumerate(missing_keys, start=1)
            ]
            WorkspaceHomePreference.objects.bulk_create(
                preferences_to_create,
                batch_size=10,
                ignore_conflicts=True,
            )

        preference = WorkspaceHomePreference.objects.filter(user=request.user, workspace_id=workspace.id)

        return Response(
            preference.values("key", "is_enabled", "config", "sort_order"),
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def patch(self, request, slug, key):
        preference = WorkspaceHomePreference.objects.filter(key=key, workspace__slug=slug, user=request.user).first()

        if preference:
            serializer = WorkspaceHomePreferenceSerializer(preference, data=request.data, partial=True)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Preference not found"}, status=status.HTTP_404_NOT_FOUND)
