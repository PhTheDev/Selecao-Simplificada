from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from ..exceptions import (
    CandidateNotFoundException,
    EmailNotVerifiedException,
    DuplicateApplicationException
)

from .models import Application
from ..candidate.models import Candidate
from ..selectionprocess.models import SelectionProcess
from ..evaluation.serializers import Stage1EvaluationSerializer, Stage2EvaluationSerializer
from ..evaluation.models import Stage1Evaluation
from .choices import Status, WinnerStatus  # ✅ Importação correta dos enums


class ApplicationService:
    """
    Serviço para operações de negócio relacionadas a Application.
    """

    def __init__(self):
        self.model = Application

    # -------------------------
    # Helpers Candidate
    # -------------------------
    def get_candidate_for_user(self, user) -> Candidate | None:
        if user.is_superuser or user.is_staff:
            return None

        try:
            return Candidate.objects.get(user=user)
        except ObjectDoesNotExist:
            try:
                candidate = Candidate.objects.get(email=user.email)
                candidate.user = user
                candidate.save(update_fields=["user"])
                return candidate
            except ObjectDoesNotExist:
                return None

    def validate_candidate_exists(self, user) -> Candidate:
        candidate = self.get_candidate_for_user(user)
        if not candidate:
            raise CandidateNotFoundException()
        return candidate

    def validate_email_verified(self, candidate: Candidate) -> None:
        if not candidate.email_verified:
            raise EmailNotVerifiedException()

    # -------------------------
    # SelectionProcess resolve/validate
    # -------------------------
    def resolve_selection_process(self, validated_data: dict) -> SelectionProcess:
        selection_process = validated_data.get("selection_process")
        if isinstance(selection_process, SelectionProcess):
            return selection_process

        sp_id = validated_data.get("selection_process_id")
        if not sp_id:
            raise ValidationError({"selection_process_id": "selection_process_id é obrigatório."})

        sp = SelectionProcess.objects.filter(id=sp_id).first()
        if not sp:
            raise ValidationError({"selection_process_id": "Processo seletivo não encontrado."})

        validated_data["selection_process"] = sp
        return sp

    def validate_no_duplicate_application(self, candidate: Candidate, selection_process: SelectionProcess) -> None:
        if Application.objects.filter(candidate=candidate, selection_process=selection_process).exists():
            raise DuplicateApplicationException()

    def validate_process_accepts_applications(self, selection_process: SelectionProcess) -> None:
        if selection_process is None:
            raise ValidationError({"selection_process": "Processo seletivo inválido ou não informado."})

        # Atualiza status baseado em datas antes de verificar
        if selection_process.status != 'finished':
            selection_process.update_status_based_on_dates()
            selection_process.save(update_fields=['status', 'analysis_start_date'])

        if not selection_process.can_enroll:
            today = timezone.now().date()

            if today < selection_process.beginning_date:
                raise ValidationError("As inscrições para este processo seletivo ainda não foram abertas.")
            elif today > selection_process.ending_date:
                raise ValidationError("As inscrições para este processo seletivo já foram encerradas.")
            elif selection_process.status != 'in_application':
                raise ValidationError("Este processo seletivo não está aceitando inscrições no momento.")
            elif not selection_process.is_active:
                raise ValidationError("Este processo seletivo não está mais ativo.")
            else:
                raise ValidationError("Este processo seletivo não está aceitando inscrições.")

    # -------------------------
    # CRUD
    # -------------------------
    def create_application(self, validated_data: dict, user) -> Application:
        selection_process = self.resolve_selection_process(validated_data)

        # Admin criando aplicação manualmente
        if user.is_superuser or user.is_staff:
            if 'candidate' not in validated_data:
                raise ValidationError("Para administradores, é necessário especificar o candidato.")
            validated_data.pop("selection_process_id", None)
            validated_data["selection_process"] = selection_process
            return Application.objects.create(**validated_data)

        candidate = self.validate_candidate_exists(user)
        self.validate_email_verified(candidate)

        self.validate_no_duplicate_application(candidate, selection_process)
        self.validate_process_accepts_applications(selection_process)

        validated_data['candidate'] = candidate
        validated_data.pop("selection_process_id", None)
        validated_data["selection_process"] = selection_process

        return Application.objects.create(**validated_data)

    def get_queryset_for_user(self, user, expand_evaluations: bool = False):
        queryset = Application.objects.all()

        if user.is_superuser or user.is_staff:
            queryset = queryset.select_related('candidate', 'selection_process')
            if expand_evaluations:
                queryset = queryset.select_related('stage1_evaluation', 'stage2_evaluation')
            return queryset

        candidate = self.get_candidate_for_user(user)
        if candidate:
            queryset = queryset.filter(candidate=candidate).select_related('candidate', 'selection_process')
            if expand_evaluations:
                queryset = queryset.select_related('stage1_evaluation', 'stage2_evaluation')
            return queryset

        return Application.objects.none()

    # -------------------------
    # Admin Evaluations
    # -------------------------
    def validate_admin_permission(self, user) -> None:
        if not user.is_authenticated or not user.is_staff:
            raise PermissionDenied("Apenas administradores podem realizar esta operação")

    # ----------------------------------------------------------------------
    # ✅ Atualiza status da inscrição com base na avaliação da etapa 1
    # ----------------------------------------------------------------------
    def _update_application_status_based_on_stage1(self, application: Application, stage1_eval: Stage1Evaluation):
        """
        Define o status da inscrição baseado nos documentos obrigatórios da etapa 1.
        - Se algum documento obrigatório for rejeitado → status = REJECTED ('rejected')
        - Caso contrário, mantém o status atual.
        """
        # Documentos obrigatórios
        required_docs_valid = [
            stage1_eval.identity_document_valid,
            stage1_eval.school_records_valid,
            stage1_eval.vitae_curriculum_valid,
        ]

        # Se algum obrigatório foi explicitamente rejeitado (False) → reprovado.
        # None (não avaliado) e True (aceito) não reprova automaticamente.
        if any(value is False for value in required_docs_valid):
            application.status = Status.REJECTED  # ✅ usa o enum importado
            application.save(update_fields=['status'])
            return

        process = application.selection_process

        if getattr(process, "include_portfolio_in_score", False):
            if not application.portfolio_link and stage1_eval.portfolio_link_valid is False:
                application.status = Status.REJECTED
                application.save(update_fields=['status'])
                return

        if getattr(process, "include_certificates_in_score", False):
            if not application.course_certificates and stage1_eval.course_certificates_valid is False:
                application.status = Status.REJECTED
                application.save(update_fields=['status'])
                return

        # (Opcional) Se todos os obrigatórios foram aceitos, pode-se alterar o status
        # Exemplo: application.status = Status.PENDING
        # Por enquanto, não alteramos para preservar o status atual

    # ----------------------------------------------------------------------
    # ✅ Cria/atualiza avaliação e já aplica reprovação automática
    # ----------------------------------------------------------------------
    def create_or_update_stage1_evaluation(self, application: Application, data: dict, user) -> Application:
        self.validate_admin_permission(user)
        existing = getattr(application, 'stage1_evaluation', None)

        if existing:
            serializer = Stage1EvaluationSerializer(existing, data=data, partial=True)
        else:
            data['application'] = application.id
            serializer = Stage1EvaluationSerializer(data=data)

        if serializer.is_valid():
            stage1_eval = serializer.save(evaluated_by=user)
            application.refresh_from_db()

            # ✅ Reprovação automática se documento obrigatório rejeitado
            self._update_application_status_based_on_stage1(application, stage1_eval)

            return application

        raise ValidationError(serializer.errors)

    def create_or_update_stage2_evaluation(self, application: Application, data: dict, user) -> Application:
        self.validate_admin_permission(user)
        existing = getattr(application, 'stage2_evaluation', None)

        if existing:
            serializer = Stage2EvaluationSerializer(existing, data=data, partial=True)
        else:
            data['application'] = application.id
            serializer = Stage2EvaluationSerializer(data=data)

        if serializer.is_valid():
            serializer.save(evaluated_by=user)
            application.refresh_from_db()
            return application

        raise ValidationError(serializer.errors)

    def _collect_process_evaluator_ids(self, process: SelectionProcess, triggering_user) -> set[int]:
        evaluator_ids: set[int] = set()
        apps = Application.objects.filter(selection_process=process).select_related(
            "stage1_evaluation",
            "stage2_evaluation",
        )
        for app in apps:
            for eval_obj in [getattr(app, "stage1_evaluation", None), getattr(app, "stage2_evaluation", None)]:
                if eval_obj and eval_obj.evaluated_by_id:
                    evaluator_ids.add(eval_obj.evaluated_by_id)

        if triggering_user and triggering_user.id:
            evaluator_ids.add(triggering_user.id)

        return evaluator_ids

    # -------------------------
    # Ranking / Winners
    # -------------------------
    def _build_global_metric_score_map(self, app: Application, process: SelectionProcess) -> dict[str, tuple[float, int]]:
        """
        Mapeia métricas globais ativas para (nota, peso_percentual).
        Regra para nota ausente: considera 0.
        """
        stage1 = getattr(app, "stage1_evaluation", None)
        stage2 = getattr(app, "stage2_evaluation", None)

        score_map: dict[str, tuple[float, int]] = {}

        # Etapa 1
        if getattr(process, "include_curriculum_in_score", True):
            score_map["curriculum"] = (
                float(getattr(stage1, "curriculum_score", 0) or 0),
                int(getattr(process, "weight_curriculum", 0) or 0),
            )

        score_map["school_records"] = (
            float(getattr(stage1, "school_records_score", 0) or 0),
            int(getattr(process, "weight_school_records", 0) or 0),
        )

        if getattr(process, "include_certificates_in_score", False):
            score_map["certificates"] = (
                float(getattr(stage1, "course_certificates_score", 0) or 0),
                int(getattr(process, "weight_certificates", 0) or 0),
            )

        if getattr(process, "include_portfolio_in_score", False):
            score_map["portfolio"] = (
                float(getattr(stage1, "portfolio_score", 0) or 0),
                int(getattr(process, "weight_portfolio", 0) or 0),
            )

        # Etapa 2
        if getattr(process, "has_interview", True):
            score_map["interview"] = (
                float(getattr(stage2, "interview_score", 0) or 0),
                int(getattr(process, "weight_interview", 0) or 0),
            )

            if getattr(process, "has_essay", True):
                score_map["essay"] = (
                    float(getattr(stage2, "essay_score", 0) or 0),
                    int(getattr(process, "weight_essay", 0) or 0),
                )

        return score_map

    def _calc_final_score(self, app: Application, process: SelectionProcess) -> float:
        """
        Retorna a nota final global por métrica.
        Fórmula: soma(score_metrica * peso_global_metrica) / 100
        Métrica sem nota recebe 0.
        """
        metric_scores = self._build_global_metric_score_map(app, process)
        weighted_sum = sum(score * weight for score, weight in metric_scores.values())
        return weighted_sum / 100.0

    @transaction.atomic
    def generate_ranking_and_set_winners(self, process: SelectionProcess, user):
        """
        Gera ranking (rank_position) e define vencedores (is_winner=True) para as vagas.
        Manual: gestor chama quando quiser.

        ✅ Alteração: candidatos com status REJECTED são excluídos do ranking/vencedores.
        """
        self.validate_admin_permission(user)

        # regra recomendada
        if process.analysis_stage != 'analysis_completed':
            raise ValidationError("A análise deve estar concluída para gerar ranking e definir vencedores.")

        # ✅ Apenas candidatos com status PENDING ou APPROVED (não rejeitados)
        apps = list(
            Application.objects.filter(
                selection_process=process,
                status__in=[Status.PENDING, Status.APPROVED]  # ✅ usa o enum
            )
            .select_related("candidate", "selection_process", "stage1_evaluation", "stage2_evaluation")
        )

        if not apps:
            raise ValidationError("Não existem inscrições elegíveis (aprovadas/pendentes) neste processo.")

        scored = []
        for app in apps:
            final_score = self._calc_final_score(app, process)
            scored.append((app, final_score))

        # Ordenação determinística: nota desc e id asc para desempate estável.
        scored.sort(key=lambda x: (-x[1], x[0].id))

        # limpa winners atuais
        Application.objects.filter(selection_process=process, is_winner=True).update(
            is_winner=False,
            winner_status=WinnerStatus.REPLACED,  # ✅ usa o enum
            winner_updated_at=timezone.now(),
            winner_updated_by=user,
        )

        number_vacancies = int(process.number_vacancies or 1)

        for idx, (app, final_score) in enumerate(scored, start=1):
            app.rank_position = idx
            app.average_score = round(final_score, 2)

            if idx <= number_vacancies:
                app.mark_winner(by_user=user, notes="Definido automaticamente pelo ranking.")
            else:
                # mantém como pendente
                if app.status != Status.REJECTED:
                    app.status = Status.PENDING
                if app.winner_status == WinnerStatus.NONE:
                    app.winner_status = WinnerStatus.NONE

            app.save(update_fields=[
                "rank_position", "average_score",
                "is_winner", "status", "winner_status",
                "winner_notes", "winner_updated_at", "winner_updated_by",
            ])

        from integration.services import record_process_analysis_activity

        evaluator_ids = self._collect_process_evaluator_ids(process, user)
        record_process_analysis_activity(process, evaluator_ids)

        return True

    @transaction.atomic
    def manual_replace_winner(
        self,
        process: SelectionProcess,
        declined_application_id: int,
        new_winner_application_id: int,
        user,
        notes: str | None = None
    ):
        """
        Troca manualmente o vencedor:
        - marca o atual como DECLINED
        - promove outro como winner PENDING
        """
        self.validate_admin_permission(user)

        declined_app = Application.objects.filter(
            id=declined_application_id,
            selection_process=process
        ).first()
        if not declined_app:
            raise ValidationError("Inscrição do vencedor atual não encontrada para este processo.")

        if not declined_app.is_winner:
            raise ValidationError("A inscrição informada como 'declined' não é vencedora atual.")

        new_app = Application.objects.filter(
            id=new_winner_application_id,
            selection_process=process
        ).first()
        if not new_app:
            raise ValidationError("Inscrição do novo vencedor não encontrada para este processo.")

        # retira vencedor atual
        declined_app.clear_winner(
            by_user=user,
            new_winner_status=WinnerStatus.DECLINED,  # ✅ usa o enum
            notes=(notes or "Desistência informada pelo gestor.")
        )
        declined_app.save(update_fields=[
            "is_winner", "winner_status", "winner_notes", "winner_updated_at", "winner_updated_by"
        ])

        # promove novo
        new_app.mark_winner(
            by_user=user,
            notes=(notes or "Promovido manualmente pelo gestor.")
        )
        new_app.save(update_fields=[
            "is_winner", "status", "winner_status", "winner_notes", "winner_updated_at", "winner_updated_by"
        ])

        return {"declined": declined_app.id, "new_winner": new_app.id}

    @transaction.atomic
    def set_winner_decision(self, application: Application, decision: str, user, notes: str | None = None):
        """
        Admin marca se o vencedor aceitou ou desistiu.
        """
        self.validate_admin_permission(user)

        process = application.selection_process
        if process.status == 'finished':
            raise ValidationError("Processo finalizado: não é possível alterar aceite/desistência.")

        # Permite alteração de decisão antes da finalização:
        # - vencedor atual (is_winner=True), ou
        # - registros legados que ficaram com status de vencedor definido
        #   mesmo com is_winner=False.
        if not application.is_winner and application.winner_status not in [
            WinnerStatus.PENDING,
            WinnerStatus.ACCEPTED,
            WinnerStatus.DECLINED,
        ]:
            raise ValidationError("Somente vencedor atual pode receber decisão.")

        if decision == "accepted":
            application.winner_status = WinnerStatus.ACCEPTED
        elif decision == "declined":
            application.winner_status = WinnerStatus.DECLINED
        else:
            raise ValidationError("Decisão inválida.")

        application.winner_updated_at = timezone.now()
        application.winner_updated_by = user
        if notes is not None:
            application.winner_notes = notes

        application.save(update_fields=[
            "is_winner",
            "winner_status",
            "winner_updated_at",
            "winner_updated_by",
            "winner_notes",
        ])
        return application