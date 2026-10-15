from django.contrib import admin
from django.utils.html import format_html

from integration.models import IntegrationActivity, IntegrationToken


@admin.register(IntegrationToken)
class IntegrationTokenAdmin(admin.ModelAdmin):
    list_display = ("name", "token_preview", "is_active", "updated_at", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "token")
    readonly_fields = ("created_at", "updated_at", "token_help")
    fields = ("name", "token", "is_active", "token_help", "created_at", "updated_at")

    @admin.display(description="Token")
    def token_preview(self, obj):
        value = obj.token or ""
        if len(value) <= 12:
            return value
        return f"{value[:8]}…{value[-4:]}"

    @admin.display(description="Como usar")
    def token_help(self, obj):
        return format_html(
            "<p>No sistema externo, configure o mesmo valor no campo de token da conexão dinâmica.</p>"
            "<p>Header esperado: <code>Authorization: Bearer &lt;token&gt;</code></p>"
            "<p>Endpoint: <code>GET /api/integration/activities/</code></p>"
        )


@admin.register(IntegrationActivity)
class IntegrationActivityAdmin(admin.ModelAdmin):
    list_display = ("activity", "activity_type", "selection_process", "created_at")
    filter_horizontal = ("users",)
    readonly_fields = ("created_at",)
