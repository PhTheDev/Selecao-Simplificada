from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser

from ..evaluation.models import Stage1Evaluation, Stage2Evaluation
from .serializers import Stage1EvaluationSerializer, Stage2EvaluationSerializer


class Stage1EvaluationViewSet(viewsets.ModelViewSet):
    queryset = Stage1Evaluation.objects.all().select_related("application", "application__candidate", "application__selection_process")
    serializer_class = Stage1EvaluationSerializer
    permission_classes = [IsAdminUser]


class Stage2EvaluationViewSet(viewsets.ModelViewSet):
    queryset = Stage2Evaluation.objects.all().select_related("application", "application__candidate", "application__selection_process")
    serializer_class = Stage2EvaluationSerializer
    permission_classes = [IsAdminUser]
