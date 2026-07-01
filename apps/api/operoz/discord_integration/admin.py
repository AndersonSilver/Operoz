from django.contrib import admin

from operoz.discord_integration.models import CustomSlashCommand


@admin.register(CustomSlashCommand)
class CustomSlashCommandAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "workspace",
        "guild_id",
        "is_enabled",
        "registration_status",
        "updated_at",
    )
    list_filter = ("registration_status", "is_enabled", "workspace")
    search_fields = ("name", "description", "workspace__name")
    readonly_fields = (
        "discord_command_id",
        "registration_status",
        "registration_error",
        "created_at",
        "updated_at",
    )
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "workspace",
                    "name",
                    "description",
                    "prompt_instructions",
                    "guild_id",
                    "board_slug",
                    "default_project",
                    "is_enabled",
                ),
            },
        ),
        (
            "Sincronização Discord",
            {
                "fields": (
                    "discord_command_id",
                    "registration_status",
                    "registration_error",
                    "created_at",
                    "updated_at",
                ),
            },
        ),
    )
