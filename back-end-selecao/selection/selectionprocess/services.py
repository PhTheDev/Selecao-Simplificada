"""
Serviços para SelectionProcess seguindo o princípio SRP e DIP.
Centraliza toda lógica de negócio relacionada a processos seletivos.
"""
from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.exceptions import NotFound, PermissionDenied
from ..exceptions import (
    BusinessRuleException,
    ProcessNotInAnalysisException,
    ProcessAlreadyFinishedException,
    StageNotCompletedException
)
from .models import SelectionProcess
from .choices import AnalysisStage
from ..application.models import Application
from ..application.services import ApplicationService


class SelectionProcessService:
    """
    Serviço para operações de negócio relacionadas a SelectionProcess.
    """
    
    def __init__(self):
        self.model = SelectionProcess
        self.application_service = ApplicationService()
    
    def get_by_id(self, pk: int) -> SelectionProcess:
        """Obtém processo por ID ou lança exceção."""
        try:
            return self.model.objects.get(pk=pk)
        except ObjectDoesNotExist:
            raise NotFound("Processo não encontrado")
    
    def get_by_slug(self, slug: str, user=None) -> SelectionProcess:
        """Obtém processo por slug com controle de visibilidade."""
        try:
            if user and user.is_staff:
                process = self.model.objects.get(slug=slug)
            else:
                process = self.model.objects.get(slug=slug, is_active=True)
            
            # Atualiza status baseado em datas
            if process.status != 'finished':
                process.update_status_based_on_dates()
                process.save(update_fields=['status', 'analysis_start_date'])
            
            return process
        except ObjectDoesNotExist:
            raise NotFound("Processo seletivo não encontrado")
    
    def validate_admin_permission(self, user) -> None:
        """Valida se usuário é administrador."""
        if not user.is_authenticated or not user.is_staff:
            raise PermissionDenied("Apenas administradores podem realizar esta operação")
    
    def validate_process_status(self, process: SelectionProcess, required_status: str = None) -> None:
        """Valida status do processo."""
        if process.status == 'finished':
            raise ProcessAlreadyFinishedException()
        
        if required_status and process.status != required_status:
            raise ProcessNotInAnalysisException()
    
    def advance_to_stage2(self, process_id: int, user) -> SelectionProcess:
        """
        Avança processo para etapa 2 de análise.
        Valida todas as regras de negócio antes de executar.
        """
        self.validate_admin_permission(user)
        
        process = self.get_by_id(process_id)
        self.validate_process_status(process, required_status='in_analysis')
        
        # Verifica se já está na etapa 2 ou concluído
        if process.analysis_stage in ['stage2_interview', 'analysis_completed']:
            raise BusinessRuleException("Processo já está na etapa 2 ou concluído")
        
        # Busca todas as aplicações do processo
        applications = Application.objects.filter(selection_process=process)
        
        # Verifica se todos têm etapa 1 concluída
        if not process.can_proceed_to_stage2(applications):
            raise StageNotCompletedException("Nem todos os candidatos têm a etapa 1 concluída")
        
        # Avança para etapa 2
        process.analysis_stage = AnalysisStage.STAGE2_INTERVIEW
        process.save(update_fields=['analysis_stage'])
        
        return process
    
    def complete_analysis(self, process_id: int, user) -> SelectionProcess:
        """
        Marca a análise como concluída.
        Valida todas as regras de negócio antes de executar.
        """
        self.validate_admin_permission(user)
        
        process = self.get_by_id(process_id)
        self.validate_process_status(process, required_status='in_analysis')
        
        # Verifica se já está concluído
        if process.analysis_stage == 'analysis_completed':
            raise BusinessRuleException("Análise já está concluída")
        
        # Busca todas as aplicações do processo
        applications = Application.objects.filter(selection_process=process)
        
        # Verifica se todos têm etapa 2 concluída
        if not process.can_finish_analysis(applications):
            raise StageNotCompletedException("Nem todos os candidatos têm a etapa 2 concluída")
        
        # Marca análise como concluída
        process.analysis_stage = AnalysisStage.ANALYSIS_COMPLETED
        process.save(update_fields=['analysis_stage'])
        
        return process
    
    def finish_process(self, process_id: int, user) -> SelectionProcess:
        """
        Finaliza manualmente um processo seletivo.
        """
        self.validate_admin_permission(user)
        
        process = self.get_by_id(process_id)
        
        # Verifica se já está finalizado
        if process.status == 'finished':
            raise ProcessAlreadyFinishedException()
        
        # Atualiza para finalizado
        process.status = 'finished'
        process.save(update_fields=['status'])
        
        return process

    def reopen_process_for_replacement(self, process_id: int, user) -> SelectionProcess:
        """
        Reabre um processo finalizado para permitir ajuste de resultado
        (ex.: substituir vencedor após desligamento).
        """
        self.validate_admin_permission(user)

        process = self.get_by_id(process_id)

        if process.status != 'finished':
            raise BusinessRuleException("Apenas processos finalizados podem ser reabertos.")

        # Mantém a análise como concluída e reabre somente o status operacional.
        process.status = 'in_analysis'
        process.analysis_stage = AnalysisStage.ANALYSIS_COMPLETED
        process.save(update_fields=['status', 'analysis_stage'])

        return process
    
    def update_status_based_on_dates(self, process: SelectionProcess) -> bool:
        """
        Atualiza status do processo baseado nas datas.
        Retorna True se houve mudança.
        """
        was_updated = process.update_status_based_on_dates()
        
        if was_updated:
            update_fields = ['status']
            if process.status == 'in_analysis' and process.analysis_start_date is None:
                process.analysis_start_date = timezone.now()
                update_fields.append('analysis_start_date')
            process.save(update_fields=update_fields)
        
        return was_updated
    
    def get_available_for_enrollment(self, queryset):
        """
        Retorna apenas processos disponíveis para inscrição.
        """
        available = []
        today = timezone.now().date()
        
        for process in queryset:
            # Atualiza status
            if process.status != 'finished':
                process.update_status_based_on_dates()
            
            # Verifica se está disponível para inscrição
            if process.can_enroll:
                available.append(process)
        
        return available

    def get_status_diagnostic(self, process: SelectionProcess) -> dict:
        """
        Calcula o status correto com base nas datas sem persistir alterações.
        """
        today = timezone.now().date()
        correct_status = process.status

        if process.status != "finished":
            if today < process.beginning_date:
                correct_status = "created"
            elif process.beginning_date <= today <= process.ending_date:
                correct_status = "in_application"
            else:
                correct_status = "in_analysis"

        return {
            "current_status": process.status,
            "correct_status": correct_status,
            "needs_update": process.status != correct_status,
            "beginning_date": process.beginning_date,
            "ending_date": process.ending_date,
            "today": today.isoformat(),
        }
    
    def select_winners(self, process_id: int, user) -> list[Application]:
        """
        Seleciona os ganhadores usando nota final global por métrica.
        """
        self.validate_admin_permission(user)

        process = self.get_by_id(process_id)

        if process.analysis_stage != 'analysis_completed':
            raise BusinessRuleException(
                "A análise deve estar concluída para selecionar os ganhadores"
            )

        applications = Application.objects.filter(
            selection_process=process,
            stage1_evaluation__isnull=False
        ).select_related(
            'candidate',
            'stage1_evaluation',
            'stage2_evaluation'
        )

        candidates_with_scores = []
        for app in applications:
            final_score = self.application_service._calc_final_score(app, process)
            stage1_total = float(getattr(app.stage1_evaluation, "total_score", 0) or 0) if app.stage1_evaluation else 0
            stage2_total = float(getattr(app.stage2_evaluation, "total_score", 0) or 0) if app.stage2_evaluation else 0

            candidates_with_scores.append({
                'application': app,
                'final_score': final_score,
                'stage1_score': stage1_total,
                'stage2_score': stage2_total,
            })

        # Ordenação determinística: nota desc e id asc para desempate estável.
        candidates_with_scores.sort(key=lambda x: (-x['final_score'], x['application'].id))

        number_vacancies = process.number_vacancies or 1
        winners = candidates_with_scores[:number_vacancies]

        winner_applications = []
        for winner in winners:
            app = winner['application']
            app.status = 'approved'
            app.average_score = round(winner['final_score'], 2)   # Agora guarda a nota da etapa 2 (ou etapa 1)
            app.save(update_fields=['status', 'average_score'])
            winner_applications.append(app)

        return winner_applications
    
    def get_winners(self, process_id: int, user) -> list[Application]:
        """
        Retorna lista dos ganhadores do processo seletivo (admin/staff).
        """
        self.validate_admin_permission(user)
        process = self.get_by_id(process_id)

        return Application.objects.filter(
            selection_process=process,
            status='approved'
        ).select_related(
            'candidate',
            'stage1_evaluation',
            'stage2_evaluation'
        ).order_by('-average_score')

