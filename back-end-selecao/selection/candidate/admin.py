# candidate/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Candidate, EmailVerification, SMSVerification

@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = (
        'id', 
        'name', 
        'email', 
        'email_verified', 
        'phone', 
        'college',
        'applications_count',
        'user_linked'
    )
    list_filter = ('email_verified', 'gender', 'period', 'uf')
    search_fields = ('name', 'email', 'cpf', 'phone', 'college')
    readonly_fields = (
        'created_at',
        'updated_at',
        'user_linked_display',
    )
    
    fieldsets = (
        ('Informações Pessoais', {
            'fields': (
                'name', 
                'email',
                'email_verified',
                'cpf',
                'gender',
                'phone',
            )
        }),
        ('Informações Acadêmicas', {
            'fields': (
                'college',
                'period',
                'semester',
            )
        }),
        ('Endereço', {
            'fields': (
                'cep',
                'address',
                'city',
                'uf',
            )
        }),
        ('Conta de Usuário', {
            'fields': (
                'user',
                'user_linked_display',
            )
        }),
        ('Imagem de Perfil', {
            'fields': ('profile_image',)
        }),
        ('Datas do Sistema', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',)
        }),
    )
    
    def applications_count(self, obj):
        count = obj.enrollments.count()
        if count > 0:
            url = reverse('admin:application_application_changelist') + f'?candidate__id__exact={obj.id}'
            return format_html('<a href="{}">{}</a>', url, count)
        return count
    applications_count.short_description = 'Inscrições'
    
    def user_linked(self, obj):
        if obj.user:
            url = reverse('admin:auth_user_change', args=[obj.user.id])
            return format_html('<a href="{}">✅ Sim</a>', url)
        return '❌ Não'
    user_linked.short_description = 'Usuário Vinculado'
    
    def user_linked_display(self, obj):
        return self.user_linked(obj)
    user_linked_display.short_description = 'Usuário Vinculado'

@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'email', 'verified', 'created_at', 'expires_at')
    list_filter = ('verified', 'created_at')
    search_fields = ('candidate__name', 'email')
    readonly_fields = ('token', 'created_at', 'updated_at')


@admin.register(SMSVerification)
class SMSVerificationAdmin(admin.ModelAdmin):
    list_display = (
        'verification_id',
        'ddd',
        'status',
        'attempts',
        'sms_ctr',
        'requested_at',
        'sent_at',
        'verified_at',
    )
    list_filter = ('status', 'requested_at')
    search_fields = ('verification_id', 'sms_ctr')
    readonly_fields = (
        'verification_id',
        'phone_hash',
        'ddd',
        'status',
        'attempts',
        'sms_ctr',
        'error_code',
        'error_message',
        'requested_at',
        'sent_at',
        'verified_at',
        'expires_at',
        'created_at',
        'updated_at',
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False