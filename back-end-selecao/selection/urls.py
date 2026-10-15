# selection/urls.py
from django.urls import path, include  # type: ignore
from rest_framework import routers  # type: ignore
from rest_framework_simplejwt.views import TokenRefreshView  # type: ignore
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiResponse  # type: ignore

# Import viewsets
from selection.candidate.views import CandidateViewSet
from selection.selectionprocess.views import SelectionProcessViewSet, NoticeDocumentViewSet
from selection.application.views import ApplicationViewSet

router = routers.DefaultRouter()
router.register(r"candidates", CandidateViewSet)
router.register(r"selection-processes", SelectionProcessViewSet)
router.register(r"applications", ApplicationViewSet)
router.register(r"notice-documents", NoticeDocumentViewSet, basename="notice-document")

TokenRefreshViewAnnotated = extend_schema(
    tags=["Autenticação JWT"],
    summary="Renovar access token",
    description=(
        "Recebe o `refresh` token e devolve um novo `access` "
        "(e novo `refresh` se rotação estiver ativa)."
    ),
    request={
        "application/json": {
            "type": "object",
            "properties": {"refresh": {"type": "string"}},
            "required": ["refresh"],
        }
    },
    responses={
        200: OpenApiResponse(description="Novo access (e refresh, se aplicável)"),
        401: OpenApiResponse(description="Refresh inválido ou na blacklist"),
    },
    examples=[
        OpenApiExample(
            "Refresh",
            value={"refresh": "<refresh_token>"},
        )
    ],
    auth=[],
)(TokenRefreshView)

urlpatterns = [
    path("", include(router.urls)),
    path("auth/token/", TokenRefreshViewAnnotated.as_view(), name="token_refresh"),
]
