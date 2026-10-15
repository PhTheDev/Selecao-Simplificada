# serializers.py
from django.utils import timezone
from rest_framework import serializers
from .models import SelectionProcess, NoticeDocument

class NoticeDocumentSerializer(serializers.ModelSerializer):
    file = serializers.FileField(use_url=True)

    class Meta:
        model = NoticeDocument
        fields = ['id', 'file', 'name', 'order', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class SelectionProcessSerializer(serializers.ModelSerializer):
    # lista de documentos (read-only)
    notice_documents = NoticeDocumentSerializer(many=True, read_only=True)

    enrollments_count = serializers.SerializerMethodField(read_only=True)

    def get_enrollments_count(self, obj):
        v = getattr(obj, "enrollments_count", None)
        if v is not None:
            return int(v)
        # Objetos sem annotate (ex.: get_by_slug via service) ainda precisam do total correto
        return obj.enrollments.count()

    # campo para upload de múltiplos arquivos (write-only)
    notice_doc_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
        help_text="Lista de arquivos do edital (múltiplos)"
    )

    class Meta:
        model = SelectionProcess
        fields = [field.name for field in SelectionProcess._meta.fields] + \
                 ['notice_documents', 'notice_doc_files', 'enrollments_count']

    def create(self, validated_data):
        # Extrai os arquivos antes de criar o processo
        files = validated_data.pop('notice_doc_files', [])
        process = super().create(validated_data)

        # Cria os NoticeDocument para cada arquivo enviado
        for f in files:
            NoticeDocument.objects.create(
                selection_process=process,
                file=f,
                name=f.name
            )
        return process

    def update(self, instance, validated_data):
        files = validated_data.pop('notice_doc_files', [])

        old_beginning_date = instance.beginning_date
        old_ending_date = instance.ending_date
        old_status = instance.status

        instance = super().update(instance, validated_data)

        dates_changed = (
            old_beginning_date != instance.beginning_date or
            old_ending_date != instance.ending_date
        )

        if dates_changed or instance.status != 'finished':
            was_updated = instance.update_status_based_on_dates()
            if was_updated:
                update_fields = ['status']
                if instance.status == 'in_analysis' and old_status != 'in_analysis':
                    update_fields.append('analysis_start_date')
                instance.save(update_fields=update_fields)

        for f in files:
            NoticeDocument.objects.create(
                selection_process=instance,
                file=f,
                name=f.name
            )

        return instance