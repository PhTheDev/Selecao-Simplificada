from django.db import models # type: ignore
from django.utils.translation import gettext_lazy as _ # type: ignore

# ===========================
# BASE MODEL
# ===========================

class BaseModel(models.Model):
    is_active = models.BooleanField(_("Ativo"), default=True)
    created_at = models.DateTimeField(_("Criado em"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Atualizado em"), auto_now=True)

    class Meta:
        abstract = True
