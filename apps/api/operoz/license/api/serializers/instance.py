# Module imports
from operoz.license.models import Instance
from operoz.app.serializers import BaseSerializer
from operoz.app.serializers import UserAdminLiteSerializer


class InstanceSerializer(BaseSerializer):
    primary_owner_details = UserAdminLiteSerializer(source="primary_owner", read_only=True)

    class Meta:
        model = Instance
        fields = "__all__"
        read_only_fields = ["id", "email", "last_checked_at", "is_setup_done"]
