from django.db import models
from django.utils.translation import gettext_lazy as _

class Status(models.TextChoices):
    PENDING = 'pending', _('Pendente')
    APPROVED = 'approved', _('Aprovado')
    REJECTED = 'rejected', _('Rejeitado')

class WinnerStatus(models.TextChoices):
    NONE = 'none', _('Sem resultado')
    PENDING = 'pending', _('Convocado/Pendente')
    ACCEPTED = 'accepted', _('Aceitou')
    DECLINED = 'declined', _('Desistiu')
    REPLACED = 'replaced', _('Substituído')