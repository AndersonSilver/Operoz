from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions import ROLE, allow_permission
from operoz.app.serializers.alert import UserExternalAccountSerializer, UserExternalAccountWriteSerializer
from operoz.app.views.base import BaseAPIView
from operoz.db.models import UserExternalAccount, Workspace


class UserExternalAccountView(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        accounts = UserExternalAccount.objects.filter(
            user=request.user,
            workspace=workspace,
            deleted_at__isnull=True,
        ).order_by("-created_at")
        return Response(UserExternalAccountSerializer(accounts, many=True).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = UserExternalAccountWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        provider = serializer.validated_data["provider"]
        external_id = serializer.validated_data["external_id"]
        account, created = UserExternalAccount.objects.get_or_create(
            user=request.user,
            workspace=workspace,
            provider=provider,
            defaults={"external_id": external_id, "is_active": True},
        )
        if not created:
            account.external_id = external_id
            account.is_active = True
            account.deleted_at = None
            account.save(update_fields=["external_id", "is_active", "deleted_at", "updated_at"])

        return Response(
            UserExternalAccountSerializer(account).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class UserExternalAccountDeleteView(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, provider):
        workspace = Workspace.objects.get(slug=slug)
        account = UserExternalAccount.objects.filter(
            user=request.user,
            workspace=workspace,
            provider=provider,
            deleted_at__isnull=True,
        ).first()
        if account is None:
            return Response({"error": "Account not found"}, status=status.HTTP_404_NOT_FOUND)
        account.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
