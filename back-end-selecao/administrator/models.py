# administrator/models.py
from django.db import models # type: ignore
from django.contrib.auth.models import User # type: ignore
from django.core.validators import RegexValidator # type: ignore
from django.utils.translation import gettext_lazy as _ # type: ignore

from .choices import AdministratorRole

MATRICULA_VALIDATOR = RegexValidator(
    regex=r"^\d{4,10}$",
    message=_("Matrícula deve conter apenas números (4 a 10 dígitos)."),
)

class AdministratorProfile(models.Model):
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='administrator_profile'
    )
    role = models.CharField(
        _("Cargo"),
        max_length=20,
        choices=AdministratorRole.choices,
        default=AdministratorRole.SUPER_ADMIN
    )
    matricula = models.CharField(
        _("Matrícula"),
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        validators=[MATRICULA_VALIDATOR],
    )
    department = models.CharField(
        _("Departamento"),
        max_length=100,
        blank=True,
        null=True
    )
    is_active = models.BooleanField(_("Ativo"), default=True)
    created_at = models.DateTimeField(_("Criado em"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Atualizado em"), auto_now=True)

    class Meta:
        verbose_name = _("Perfil do Administrador")
        verbose_name_plural = _("Perfis dos Administradores")
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_role_display()}"

    @property
    def full_name(self):
        return self.user.get_full_name()

    @property
    def email(self):
        return self.user.email