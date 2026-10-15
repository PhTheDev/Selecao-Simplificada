# administrator/admin.py
from django.contrib import admin # type: ignore
from django.contrib.auth.admin import UserAdmin # type: ignore
from django.contrib.auth.models import User # type: ignore
from .models import AdministratorProfile, AdministratorRole

class AdministratorProfileInline(admin.StackedInline):
    model = AdministratorProfile
    can_delete = False
    verbose_name_plural = 'Perfil de Administrador'

class CustomUserAdmin(UserAdmin):
    inlines = (AdministratorProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_role')
    list_filter = ('administrator_profile__role', 'is_staff', 'is_superuser', 'is_active')

    def get_role(self, obj):
        try:
            return obj.administrator_profile.get_role_display()
        except AdministratorProfile.DoesNotExist:
            return "N/A"
    get_role.short_description = 'Cargo'

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

@admin.register(AdministratorProfile)
class AdministratorProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'department', 'is_active', 'created_at')
    list_filter = ('role', 'is_active', 'created_at')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('created_at', 'updated_at')
    
    def formfield_for_choice_field(self, db_field, request, **kwargs):
        if db_field.name == "role":
            kwargs["choices"] = AdministratorRole.choices
        return super().formfield_for_choice_field(db_field, request, **kwargs)