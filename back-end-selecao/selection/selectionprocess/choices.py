from django.db import models # type: ignore
from django.utils.translation import gettext_lazy as _ # type: ignore
    
class Bout(models.TextChoices):
    MORNING = "M", _("Matutino")
    AFTERNOON = "T", _("Vespertino")
    SCALE = "E", _("Escala")

class Status(models.TextChoices):
    CREATED = "created", _("Criado")
    IN_APPLICATION = "in_application", _("Em inscrição")
    IN_ANALYSIS = "in_analysis", _("Em análise")
    FINISHED = "finished", _("Finalizado")

class AnalysisStage(models.TextChoices):
    STAGE1_DOCUMENTS = "stage1_documents", _("Etapa 1 - Documentos")
    STAGE2_INTERVIEW = "stage2_interview", _("Etapa 2 - Entrevista")
    ANALYSIS_COMPLETED = "analysis_completed", _("Análise Concluída")