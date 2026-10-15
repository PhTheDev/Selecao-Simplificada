from rest_framework import serializers
from ..evaluation.models import Stage1Evaluation, Stage2Evaluation
from ..application.models import Application


class Stage1EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stage1Evaluation
        fields = "__all__"
        read_only_fields = ["id", "evaluated_at", "total_score", "evaluated_by"]

    def validate(self, attrs):
        """
        ✅ Regras:
        - Se valid=False (rejeitado), motivo é obrigatório.
        - Se valid=True (aceito), motivo pode vir vazio/null.
        - Se valid=None (pendente/não avaliado), não exige motivo.
        - Para documentos opcionais (frequency_statement, course_certificates, portfólio):
          se o arquivo/link não existir na Application, ignora completamente a validação
          (mesmo que venha False por acidente).
        """
        instance = getattr(self, "instance", None)

        def get_value(field: str):
            if field in attrs:
                return attrs.get(field)
            if instance is not None:
                return getattr(instance, field, None)
            return None

        def get_application_from_payload_or_instance():
            # 1) update
            if instance is not None:
                return getattr(instance, "application", None)

            # 2) create: pode vir como objeto ou id (PK)
            app = attrs.get("application")
            if isinstance(app, Application):
                return app
            if isinstance(app, int):
                return Application.objects.filter(pk=app).first()
            return None

        app = get_application_from_payload_or_instance()
        process = getattr(app, "selection_process", None) if app is not None else None

        pairs = [
            ("identity_document_valid", "identity_document_rejection_reason"),
            ("school_records_valid", "school_records_rejection_reason"),
            ("frequency_statement_valid", "frequency_statement_rejection_reason"),
            ("vitae_curriculum_valid", "vitae_curriculum_rejection_reason"),
            ("course_certificates_valid", "course_certificates_rejection_reason"),
            ("portfolio_link_valid", "portfolio_link_rejection_reason"),
        ]

        errors = {}

        for valid_field, reason_field in pairs:
            valid_value = get_value(valid_field)

            # ✅ Ignora opcionais quando não existe arquivo na inscrição
            if app is not None:
                if valid_field == "course_certificates_valid" and not getattr(app, "course_certificates", None):
                    if not (process and getattr(process, "include_certificates_in_score", False)):
                        continue
                if valid_field == "frequency_statement_valid" and not getattr(app, "frequency_statement", None):
                    continue
                if valid_field == "portfolio_link_valid" and not getattr(app, "portfolio_link", None):
                    if not (process and getattr(process, "include_portfolio_in_score", False)):
                        continue

            # ✅ Só exige motivo quando explicitamente rejeitado
            if valid_value is False:
                reason_value = get_value(reason_field)
                if not (reason_value or "").strip():
                    errors[reason_field] = "Motivo obrigatório quando o documento é rejeitado."

        if errors:
            raise serializers.ValidationError(errors)

        return attrs


class Stage2EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stage2Evaluation
        fields = "__all__"
        read_only_fields = ["id", "evaluated_at", "total_score", "evaluated_by"]
