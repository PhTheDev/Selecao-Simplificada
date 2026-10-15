from django.db import models # type: ignore
from django.utils.translation import gettext_lazy as _ # type: ignore

class AdministratorRole(models.TextChoices):
    SUPER_ADMIN = 'super_admin', _('Super Administrador')