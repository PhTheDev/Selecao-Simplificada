from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from ..models import BaseModel
from ..application.models import Application


class Stage1Evaluation(BaseModel):
    """Avaliação da Etapa 1 - Documentos"""
    application = models.OneToOneField(
        Application,
        on_delete=models.CASCADE,
        related_name='stage1_evaluation',
        verbose_name=_("Inscrição")
    )

    # -------------------------
    # Validação de documentos
    # -------------------------
    identity_document_valid = models.BooleanField(
        _("Documento de identidade válido"),
        default=None
    )
    school_records_valid = models.BooleanField(
        _("Histórico escolar válido"),
        default=None
    )
    frequency_statement_valid = models.BooleanField(
        _("Declaração de frequência válida"),
        default=None,
        null=True,
        blank=True
    )
    vitae_curriculum_valid = models.BooleanField(
        _("Currículo válido"),
        default=None
    )
    course_certificates_valid = models.BooleanField(
        _("Certificados de cursos válidos"),
        default=None,
        null=True,
        blank=True
    )
    portfolio_link_valid = models.BooleanField(
        _("Link de portfólio válido"),
        default=None,
        null=True,
        blank=True
    )

    # -------------------------
    # ✅ Motivos de rejeição
    # (o frontend espera estes nomes)
    # -------------------------
    identity_document_rejection_reason = models.TextField(
        _("Motivo da rejeição - Documento de Identidade"),
        null=True,
        blank=True
    )
    school_records_rejection_reason = models.TextField(
        _("Motivo da rejeição - Histórico Escolar"),
        null=True,
        blank=True
    )
    frequency_statement_rejection_reason = models.TextField(
        _("Motivo da rejeição - Declaração de Frequência"),
        null=True,
        blank=True
    )
    vitae_curriculum_rejection_reason = models.TextField(
        _("Motivo da rejeição - Currículo"),
        null=True,
        blank=True
    )
    course_certificates_rejection_reason = models.TextField(
        _("Motivo da rejeição - Certificados de Cursos"),
        null=True,
        blank=True
    )
    portfolio_link_rejection_reason = models.TextField(
        _("Motivo da rejeição - Portfólio"),
        null=True,
        blank=True
    )

    # -------------------------
    # Pontuações
    # -------------------------
    curriculum_score = models.DecimalField(
        _("Pontuação do currículo"),
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True
    )
    school_records_score = models.DecimalField(
        _("Pontuação do histórico escolar"),
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True
    )
    course_certificates_score = models.DecimalField(
        _("Pontuação dos certificados"),
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True
    )
    portfolio_score = models.DecimalField(
        _("Pontuação do portfólio"),
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True
    )

    # Observações
    notes = models.TextField(
        _("Observações"),
        null=True,
        blank=True
    )

    # Data da avaliação
    evaluated_at = models.DateTimeField(
        _("Avaliado em"),
        auto_now=True
    )
    evaluated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stage1_evaluations",
        verbose_name=_("Avaliado por"),
    )

    # Pontuação total (calculada)
    total_score = models.DecimalField(
        _("Pontuação total"),
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )

    class Meta:
        verbose_name = _("Avaliação da Etapa 1")
        verbose_name_plural = _("Avaliações da Etapa 1")
        ordering = ['-evaluated_at']

    def __str__(self):
        return f"Avaliação Etapa 1 - {self.application}"

    def save(self, *args, **kwargs):
        """Calcula a pontuação total ao salvar"""
        self.calculate_total_score()
        super().save(*args, **kwargs)

    def calculate_total_score(self):
        """
        Calcula a pontuação total usando os pesos configurados no processo seletivo.

        Observação:
        - O frontend já calcula e envia total_score, mas aqui mantemos o cálculo canônico no backend.
        """
        process = self.application.selection_process

        scores = []
        weights = []

        # 1. Currículo
        if self.curriculum_score is not None:
            scores.append(float(self.curriculum_score))
            weights.append(process.weight_curriculum)

        # 2. Histórico escolar
        if self.school_records_score is not None:
            scores.append(float(self.school_records_score))
            weights.append(process.weight_school_records)

        # 3. Certificados (se incluído)
        if getattr(process, "include_certificates_in_score", True) and self.course_certificates_score is not None:
            scores.append(float(self.course_certificates_score))
            weights.append(process.weight_certificates)

        # 4. Portfólio (se incluído)
        if getattr(process, "include_portfolio_in_score", True) and self.portfolio_score is not None:
            scores.append(float(self.portfolio_score))
            weights.append(process.weight_portfolio)

        if not scores:
            self.total_score = None
            return

        weighted_sum = sum(s * w for s, w in zip(scores, weights))
        total_weight = sum(weights) if sum(weights) != 0 else 1
        self.total_score = round(weighted_sum / total_weight, 2)


class Stage2Evaluation(BaseModel):
    """Avaliação da Etapa 2 - Entrevista e Redação"""
    application = models.OneToOneField(
        Application,
        on_delete=models.CASCADE,
        related_name='stage2_evaluation',
        verbose_name=_("Inscrição")
    )

    # Pontuações
    interview_score = models.DecimalField(
        _("Pontuação da entrevista"),
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True
    )
    essay_score = models.DecimalField(
        _("Pontuação da redação"),
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True
    )

    # Observações
    interview_notes = models.TextField(
        _("Observações da entrevista"),
        null=True,
        blank=True
    )
    essay_notes = models.TextField(
        _("Observações da redação"),
        null=True,
        blank=True
    )

    # Data da avaliação
    evaluated_at = models.DateTimeField(
        _("Avaliado em"),
        auto_now=True
    )
    evaluated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stage2_evaluations",
        verbose_name=_("Avaliado por"),
    )

    # Pontuação total (calculada)
    total_score = models.DecimalField(
        _("Pontuação total"),
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )

    class Meta:
        verbose_name = _("Avaliação da Etapa 2")
        verbose_name_plural = _("Avaliações da Etapa 2")
        ordering = ['-evaluated_at']

    def __str__(self):
        return f"Avaliação Etapa 2 - {self.application}"

    def save(self, *args, **kwargs):
        """Calcula a pontuação total ao salvar"""
        self.calculate_total_score()
        super().save(*args, **kwargs)

    def calculate_total_score(self):
        """
        Calcula a pontuação total da etapa 2 com base nos pesos configurados no processo.
        """
        process = self.application.selection_process

        if not getattr(process, "has_interview", True):
            self.total_score = None
            return

        scores = []
        weights = []

        if self.interview_score is not None:
            scores.append(float(self.interview_score))
            weights.append(process.weight_interview)

        if getattr(process, "has_essay", True) and self.essay_score is not None:
            scores.append(float(self.essay_score))
            weights.append(process.weight_essay)

        if not scores:
            self.total_score = None
            return

        weighted_sum = sum(s * w for s, w in zip(scores, weights))
        total_weight = sum(weights) if sum(weights) != 0 else 1
        self.total_score = round(weighted_sum / total_weight, 2)
