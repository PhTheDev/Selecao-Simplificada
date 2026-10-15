from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from ..models import BaseModel
from .choices import Bout, Status, AnalysisStage
import os

class NoticeDocument(models.Model):
    """
    Documentos do edital (edital principal, erratas, anexos).
    """
    selection_process = models.ForeignKey(
        'SelectionProcess',
        on_delete=models.CASCADE,
        related_name='notice_documents',
        verbose_name=_("Processo seletivo")
    )
    file = models.FileField(
        _("Arquivo"),
        upload_to='notice_docs/%Y/',
        max_length=100
    )
    name = models.CharField(
        _("Nome do documento"),
        max_length=255,
        blank=True,
        help_text=_("Nome amigável exibido para o usuário")
    )
    order = models.PositiveSmallIntegerField(
        _("Ordem"),
        default=0,
        help_text=_("Ordem de exibição")
    )
    uploaded_at = models.DateTimeField(
        _("Enviado em"),
        auto_now_add=True
    )

    class Meta:
        ordering = ['order', 'uploaded_at']
        verbose_name = _("Documento do edital")
        verbose_name_plural = _("Documentos do edital")

    def save(self, *args, **kwargs):
        if not self.name:
            self.name = os.path.basename(self.file.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class SelectionProcess(BaseModel):
    title = models.CharField(_("Título"), max_length=255)
    subtitle = models.CharField(_("Subtítulo"), max_length=255, null=True, blank=True)
    description = models.TextField(_("Descrição"), null=True, blank=True)
    course = models.CharField(_("Curso"), max_length=255)
    slug = models.SlugField(_("Identificador do link"), unique=True)
    beginning_date = models.DateField(_("Data de início da inscrição"))
    ending_date = models.DateField(_("Data de finalização da inscrição"))
    period_accepted = models.CharField(_("Períodos aceitos"), max_length=100)
    bout = models.CharField(_("Turno"), max_length=1, choices=Bout.choices, default=Bout.MORNING)
    weekly_workload = models.CharField(_("Carga horária semanal"), max_length=10)
    salary = models.DecimalField(_("Bolsa"), max_digits=7, decimal_places=2, null=True, blank=True)
    number_vacancies = models.PositiveSmallIntegerField(_("Número de vagas"), default=1)
    local = models.CharField(_("Local"), max_length=255, null=True, blank=True)
    requirements = models.TextField(_("Requisitos"), null=True, blank=True)
    benefits = models.TextField(_("Benefícios"), null=True, blank=True)
    process_banner = models.ImageField(_("Banner do processo"), upload_to="process_banners/%Y/", max_length=100, null=True, blank=True)
    is_active = models.BooleanField(_("Ativo"), default=True)
    analysis_start_date = models.DateTimeField(_("Data de início da análise"), null=True, blank=True)
    status = models.CharField(_("Status do Processo Seletivo"), max_length=20, choices=Status.choices, default='created')
    analysis_stage = models.CharField(
        _("Etapa da Análise"),
        max_length=20,
        choices=AnalysisStage.choices,
        default=AnalysisStage.STAGE1_DOCUMENTS,
        null=True,
        blank=True
    )
    # Configurações de avaliação
    has_interview = models.BooleanField(
        _("Tem entrevista"),
        default=True,
        help_text=_("Define se o processo seletivo terá etapa de entrevista")
    )
    has_essay = models.BooleanField(
        _("Tem redação"),
        default=True,
        help_text=_("Define se o processo seletivo terá avaliação de redação na etapa 2")
    )
    include_curriculum_in_score = models.BooleanField(
        _("Incluir currículo na nota"),
        default=True,  # ✅ ALTERADO: agora padrão é True (alinhado com o frontend)
        help_text=_("Define se o currículo será considerado no cálculo da nota da etapa 1")
    )
    include_portfolio_in_score = models.BooleanField(
        _("Incluir portfólio na nota"),
        default=False,
        help_text=_("Define se o portfólio será considerado no cálculo da nota da etapa 1")
    )
    include_certificates_in_score = models.BooleanField(
        _("Incluir certificados na nota"),
        default=False,
        help_text=_("Define se os certificados de cursos serão considerados no cálculo da nota da etapa 1")
    )
    
    results_published_at = models.DateTimeField(
        _("Data de publicação do resultado"),
        null=True,
        blank=True,
        help_text=_("Quando preenchido, indica que o resultado foi publicado e o processo pode ser finalizado.")
    )
    
    # ─────────────────────────────────────────────────────────
    # Pesos da Etapa 1 (valores em %)
    # ─────────────────────────────────────────────────────────
    weight_curriculum = models.PositiveSmallIntegerField(
        _("Peso do currículo"),
        default=40,
        help_text=_("Peso global do currículo na nota final (0-100)")
    )
    weight_school_records = models.PositiveSmallIntegerField(
        _("Peso do histórico escolar"),
        default=40,
        help_text=_("Peso global do histórico escolar na nota final (0-100)")
    )
    weight_certificates = models.PositiveSmallIntegerField(
        _("Peso dos certificados"),
        default=10,
        help_text=_("Peso global dos certificados (considerado apenas se include_certificates_in_score=True)")
    )
    weight_portfolio = models.PositiveSmallIntegerField(
        _("Peso do portfólio"),
        default=10,
        help_text=_("Peso global do portfólio (considerado apenas se include_portfolio_in_score=True)")
    )

    # ─────────────────────────────────────────────────────────
    # Pesos da Etapa 2 (valores em %)
    # ─────────────────────────────────────────────────────────
    weight_interview = models.PositiveSmallIntegerField(
        _("Peso da entrevista"),
        default=70,
        help_text=_("Peso global da entrevista na nota final (0-100)")
    )
    weight_essay = models.PositiveSmallIntegerField(
        _("Peso da redação"),
        default=30,
        help_text=_("Peso global da redação na nota final (considerado apenas se has_essay=True)")
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_selection_processes",
        verbose_name=_("Criado por"),
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Processo Seletivo")
        verbose_name_plural = _("Processos Seletivos")

    def __str__(self):
        return self.title
    
    # ─────────────────────────────────────────────────────────
    # Validação customizada
    # ─────────────────────────────────────────────────────────
    def clean(self):
        """Valida que a soma global dos pesos ativos seja exatamente 100."""
        if not self.has_interview:
            self.weight_interview = 0
            self.weight_essay = 0
        elif not self.has_essay:
            self.weight_essay = 0

        active_weight_fields = [
            ('weight_curriculum', self.include_curriculum_in_score),
            ('weight_school_records', True),
            ('weight_certificates', self.include_certificates_in_score),
            ('weight_portfolio', self.include_portfolio_in_score),
            ('weight_interview', self.has_interview),
            ('weight_essay', self.has_interview and self.has_essay),
        ]

        global_weight_total = 0
        for field, active in active_weight_fields:
            if active:
                global_weight_total += getattr(self, field) or 0

        if global_weight_total != 100:
            raise ValidationError(
                _("A soma global dos pesos ativos deve ser 100%% (atualmente %(total)s%%).") %
                {'total': global_weight_total}
            )

    def save(self, *args, **kwargs):
        self.full_clean()  # chama clean() automaticamente
        super().save(*args, **kwargs)
    
    def update_status_based_on_dates(self):
        """
        Atualiza o status automaticamente baseado nas datas.
        Regras:
        - Antes de beginning_date: 'created'
        - Entre beginning_date e ending_date: 'in_application'
        - Após ending_date: 'in_analysis'
        - 'finished' só manualmente
        """
        today = timezone.now().date()
        old_status = self.status
        
        # Apenas atualiza se não estiver finalizado manualmente
        if self.status != 'finished':
            if today < self.beginning_date:
                new_status = 'created'
            elif self.beginning_date <= today <= self.ending_date:
                new_status = 'in_application'
            else:  # today > ending_date
                new_status = 'in_analysis'
                # Se está mudando para análise, registra a data
                if old_status != 'in_analysis':
                    self.analysis_start_date = timezone.now()
            
            # Atualiza apenas se mudou
            if self.status != new_status:
                self.status = new_status
                return True
        
        return False
    
    @property
    def can_enroll(self):
        """Verifica se o processo está aberto para inscrições"""
        today = timezone.now().date()
        return (
            self.status == 'in_application' and
            self.is_active and
            self.beginning_date <= today <= self.ending_date
        )
    
    @property
    def days_until_beginning(self):
        """Dias até o início das incrições"""
        today = timezone.now().date()
        if today < self.beginning_date:
            return (self.beginning_date - today).days
        return 0
    
    @property
    def days_until_ending(self):
        """Dias até o término das inscrições"""
        today = timezone.now().date()
        if today <= self.ending_date:
            return (self.ending_date - today).days
        return 0
    
    @property
    def is_in_stage1(self):
        """Verifica se está na etapa 1 de análise"""
        return self.status == 'in_analysis' and self.analysis_stage == 'stage1_documents'
    
    @property
    def is_in_stage2(self):
        """Verifica se está na etapa 2 de análise"""
        return self.status == 'in_analysis' and self.analysis_stage == 'stage2_interview'
    
    @property
    def is_analysis_completed(self):
        """Verifica se a análise foi concluída"""
        return self.status == 'in_analysis' and self.analysis_stage == 'analysis_completed'
    
    def can_proceed_to_stage2(self, applications):
        """Verifica se pode avançar para etapa 2 (todos os candidatos com etapa 1 concluída)"""
        if not applications:
            return False
        
        if not isinstance(applications, list):
            # Se applications for um queryset
            stage1_completed = applications.filter(stage1_evaluation__isnull=False).count()
            total_applications = applications.count()
        else:
            # Se applications for uma lista
            stage1_completed = sum(1 for app in applications if hasattr(app, 'stage1_evaluation') and app.stage1_evaluation)
            total_applications = len(applications)
        
        return total_applications > 0 and stage1_completed == total_applications
    
    def can_finish_analysis(self, applications):
        """Verifica se pode finalizar a análise (todos os candidatos com etapa 2 concluída)"""
        if not applications:
            return False
        
        if not isinstance(applications, list):
            # Se applications for um queryset
            stage2_completed = applications.filter(stage2_evaluation__isnull=False).count()
            total_applications = applications.count()
        else:
            # Se applications for uma lista
            stage2_completed = sum(1 for app in applications if hasattr(app, 'stage2_evaluation') and app.stage2_evaluation)
            total_applications = len(applications)
        
        return total_applications > 0 and stage2_completed == total_applications