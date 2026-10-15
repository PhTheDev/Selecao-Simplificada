from rest_framework import serializers
from .models import Application
from ..candidate.serializers import CandidateSerializer
from ..selectionprocess.serializers import SelectionProcessSerializer
from ..candidate.models import Candidate
from ..selectionprocess.models import SelectionProcess
from ..evaluation.serializers import Stage1EvaluationSerializer, Stage2EvaluationSerializer


class ApplicationSerializer(serializers.ModelSerializer):
    candidate = CandidateSerializer(read_only=True)
    selection_process = SelectionProcessSerializer(read_only=True)
    stage1_evaluation = Stage1EvaluationSerializer(read_only=True, required=False)
    stage2_evaluation = Stage2EvaluationSerializer(read_only=True, required=False)

    # ✅ NÃO obrigatório no PATCH/PUT
    selection_process_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Application
        fields = [
            'id',
            'candidate', 'selection_process',
            'status', 'application_date',

            'identity_document', 'school_records', 'frequency_statement',
            'vitae_curriculum', 'course_certificates', 'portfolio_link',

            'average_score',

            # ✅ ranking/resultado (somente leitura)
            'rank_position', 'is_winner', 'winner_status', 'winner_notes', 'winner_updated_at',

            # write-only (entrada)
            'selection_process_id',

            'stage1_evaluation', 'stage2_evaluation'
        ]
        read_only_fields = [
            'candidate',
            'selection_process',
            'status',
            'application_date',
            'average_score',
            'rank_position', 'is_winner', 'winner_status', 'winner_notes', 'winner_updated_at',
            'stage1_evaluation', 'stage2_evaluation',
        ]

    def _resolve_candidate(self, request):
        """
        Resolve o Candidate do usuário autenticado.
        """
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            return None

        try:
            return Candidate.objects.get(user=request.user)
        except Candidate.DoesNotExist:
            # fallback por email (se você usa esse fluxo)
            try:
                return Candidate.objects.get(email=request.user.email)
            except Candidate.DoesNotExist:
                return None

    def validate(self, attrs):
        request = self.context.get('request')

        # ✅ resolve candidate (somente se request existir)
        candidate = self._resolve_candidate(request)
        if request and request.user and request.user.is_authenticated:
            if not candidate:
                raise serializers.ValidationError({"detail": "Perfil de candidato não encontrado."})
            attrs['candidate'] = candidate

        # selection_process_id só na criação; update não pode reassociar o processo
        if self.instance is None:
            sp_id = attrs.get('selection_process_id')
            if sp_id is not None:
                sp = SelectionProcess.objects.filter(id=sp_id).first()
                if not sp:
                    raise serializers.ValidationError(
                        {"selection_process_id": "Processo seletivo não encontrado."}
                    )
                attrs['selection_process'] = sp
        else:
            attrs.pop('selection_process_id', None)

        if 'portfolio_link' in attrs:
            link = (attrs.get('portfolio_link') or '').strip()
            if link:
                from urllib.parse import urlparse
                parsed = urlparse(link)
                if parsed.scheme not in ('http', 'https') or not parsed.netloc:
                    raise serializers.ValidationError(
                        {"portfolio_link": "Informe uma URL http(s) válida."}
                    )
                attrs['portfolio_link'] = link
            else:
                attrs['portfolio_link'] = ''

        return attrs

    def create(self, validated_data):
        """
        ✅ Aqui sim selection_process_id é obrigatório.
        """
        sp_id = validated_data.pop('selection_process_id', None)
        if not sp_id:
            raise serializers.ValidationError({"selection_process_id": "selection_process_id é obrigatório."})

        sp = SelectionProcess.objects.filter(id=sp_id).first()
        if not sp:
            raise serializers.ValidationError({"selection_process_id": "Processo seletivo não encontrado."})

        validated_data['selection_process'] = sp

        return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        PATCH/PUT não altera o processo seletivo da inscrição.
        """
        validated_data.pop('selection_process_id', None)
        validated_data.pop('selection_process', None)
        return super().update(instance, validated_data)


class ReplaceWinnerSerializer(serializers.Serializer):
    declined_application_id = serializers.IntegerField(required=True)
    new_winner_application_id = serializers.IntegerField(required=True)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class WinnerDecisionSerializer(serializers.Serializer):
    application_id = serializers.IntegerField(required=True)
    decision = serializers.ChoiceField(choices=['accepted', 'declined'])
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
