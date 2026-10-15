from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class ActivityType(models.TextChoices):
    PROCESS_ANALYSIS = "process_analysis", _("Análise de processo seletivo")


class IntegrationToken(models.Model):
    """
    Token estático usado pelo sistema externo para autenticar GET /api/integration/activities/.
    Cadastre e gerencie pelo Django Admin (Integração externa → Tokens de integração).
    """
    name = models.CharField(
        _("Nome"),
        max_length=100,
        default="Externo",
        help_text=_("Identificação amigável (ex.: externo produção)"),
    )
    token = models.CharField(
        _("Token"),
        max_length=255,
        unique=True,
        help_text=_("Valor enviado no header Authorization: Bearer <token>"),
    )
    is_active = models.BooleanField(_("Ativo"), default=True)
    created_at = models.DateTimeField(_("Criado em"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Atualizado em"), auto_now=True)

    class Meta:
        verbose_name = _("Token de integração")
        verbose_name_plural = _("Tokens de integração")
        ordering = ["-updated_at"]

    def __str__(self):
        status = "ativo" if self.is_active else "inativo"
        return f"{self.name} ({status})"

    def save(self, *args, **kwargs):
        self.token = (self.token or "").strip()
        super().save(*args, **kwargs)

    @classmethod
    def get_active_token_value(cls) -> str:
        """Retorna o token ativo mais recente, ou string vazia se não houver."""
        row = cls.objects.filter(is_active=True).order_by("-updated_at").first()
        return (row.token if row else "") or ""


class IntegrationActivity(models.Model):
    activity_type = models.CharField(
        _("Tipo de atividade"),
        max_length=32,
        choices=ActivityType.choices,
    )
    activity = models.CharField(_("Atividade"), max_length=255)
    selection_process = models.ForeignKey(
        "selection.SelectionProcess",
        on_delete=models.CASCADE,
        related_name="integration_activities",
        verbose_name=_("Processo seletivo"),
    )
    users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="integration_activities",
        verbose_name=_("Usuários"),
    )
    created_at = models.DateTimeField(_("Criado em"), auto_now_add=True)

    class Meta:
        verbose_name = _("Atividade de integração")
        verbose_name_plural = _("Atividades de integração")
        constraints = [
            models.UniqueConstraint(
                fields=["selection_process", "activity_type"],
                name="unique_integration_activity_per_process_type",
            )
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return self.activity
