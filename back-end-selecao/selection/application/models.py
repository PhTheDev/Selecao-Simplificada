# application/models.py
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from ..models import BaseModel
from ..candidate.models import Candidate
from ..selectionprocess.models import SelectionProcess
from .choices import Status, WinnerStatus

def identity_document_path(instance, filename):
    return f'candidate_{instance.candidate.id}/identity_documents/{filename}'

def school_records_path(instance, filename):
    return f'candidate_{instance.candidate.id}/school_records/{filename}'

def frequency_statement_path(instance, filename):
    return f'candidate_{instance.candidate.id}/frequency_statements/{filename}'

def vitae_curriculum_path(instance, filename):
    return f'candidate_{instance.candidate.id}/vitae_curriculums/{filename}'

def course_certificates_path(instance, filename):
    return f'candidate_{instance.candidate.id}/course_certificates/{filename}'


class Application(BaseModel):
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name="enrollments",
        verbose_name=_("Candidato")
    )
    selection_process = models.ForeignKey(
        SelectionProcess,
        on_delete=models.CASCADE,
        related_name="enrollments",
        verbose_name=_("Processo Seletivo")
    )

    status = models.CharField(
        _("Status da Inscrição"),
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    application_date = models.DateTimeField(_("Data da Inscrição"), auto_now_add=True)

    # Documentos
    identity_document = models.FileField(upload_to=identity_document_path, max_length=100)
    school_records = models.FileField(upload_to=school_records_path, max_length=100)
    frequency_statement = models.FileField(upload_to=frequency_statement_path, max_length=100, null=True, blank=True)
    vitae_curriculum = models.FileField(upload_to=vitae_curriculum_path, max_length=100)
    course_certificates = models.FileField(upload_to=course_certificates_path, max_length=100, null=True, blank=True)
    portfolio_link = models.URLField(_("Portfólio"), null=True, blank=True)

    # Score final que você já usa
    average_score = models.DecimalField(_("Pontuação média"), max_digits=5, decimal_places=2, null=True, blank=True)

    # ✅ Resultado / ranking
    rank_position = models.PositiveIntegerField(_("Posição no ranking"), null=True, blank=True)

    is_winner = models.BooleanField(_("É vencedor atual?"), default=False)

    winner_status = models.CharField(
        _("Status do resultado"),
        max_length=20,
        choices=WinnerStatus.choices,
        default=WinnerStatus.NONE,
    )

    winner_notes = models.TextField(_("Observações do resultado"), null=True, blank=True)

    winner_updated_at = models.DateTimeField(_("Atualizado em"), null=True, blank=True)
    winner_updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="winner_updates",
        verbose_name=_("Atualizado por"),
    )

    class Meta:
        unique_together = ("candidate", "selection_process")
        verbose_name = _("Inscrição")
        verbose_name_plural = _("Inscrições")
        indexes = [
            models.Index(fields=["selection_process", "rank_position"]),
            models.Index(fields=["selection_process", "is_winner"]),
            models.Index(fields=["selection_process", "status"]),
        ]

    def __str__(self):
        return f"{self.candidate.name} - {self.selection_process.title}"

    def mark_winner(self, by_user=None, notes: str | None = None):
        self.is_winner = True
        self.status = Status.APPROVED
        self.winner_status = WinnerStatus.PENDING
        self.winner_updated_at = timezone.now()
        self.winner_updated_by = by_user
        if notes is not None:
            self.winner_notes = notes

    def clear_winner(self, by_user=None, new_winner_status: str = WinnerStatus.REPLACED, notes: str | None = None):
        self.is_winner = False
        self.winner_status = new_winner_status
        self.winner_updated_at = timezone.now()
        self.winner_updated_by = by_user
        if notes is not None:
            self.winner_notes = notes
