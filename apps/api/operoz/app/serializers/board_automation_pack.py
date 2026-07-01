from rest_framework import serializers

from operoz.db.models import BoardAutomationPackInstall


class BoardAutomationPackInstallSerializer(serializers.ModelSerializer):
    installed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = BoardAutomationPackInstall
        fields = [
            "id",
            "board",
            "workspace",
            "pack_name",
            "pack_version",
            "config",
            "hook_ids",
            "rule_ids",
            "installed_at",
            "installed_by",
            "installed_by_name",
            "created_at",
        ]
        read_only_fields = fields

    def get_installed_by_name(self, obj: BoardAutomationPackInstall) -> str:
        if not obj.installed_by_id:
            return ""
        return obj.installed_by.display_name or obj.installed_by.email or str(obj.installed_by_id)
