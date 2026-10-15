from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample, OpenApiResponse
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from integration.authentication import IntegrationTokenAuthentication
from integration.services import build_activities_by_user


@extend_schema(
    tags=["Integração externa"],
    summary="Listar atividades para o sistema externo",
    description=(
        "Retorna atividades agrupadas por administrador (matrícula).\n\n"
        "Autenticação: token estático cadastrado no Django Admin "
        "(`Authorization: Bearer <token>`, token puro ou `X-Integration-Token`).\n\n"
        "Documentação detalhada: `back-end-selecao/docs/INTEGRACAO_EXTERNA.md`."
    ),
    parameters=[
        OpenApiParameter(
            name="since",
            type=str,
            required=False,
            description="Data inicial (`YYYY-MM-DD`). Inclui atividades a partir deste dia.",
        ),
        OpenApiParameter(
            name="until",
            type=str,
            required=False,
            description="Data final (`YYYY-MM-DD`). Inclui até o fim deste dia.",
        ),
    ],
    responses={
        200: OpenApiResponse(description="Lista de usuários com suas atividades"),
        401: OpenApiResponse(description="Token ausente ou inválido"),
    },
    examples=[
        OpenApiExample(
            "Resposta de exemplo",
            value=[
                {
                    "user": {
                        "id": 1,
                        "matricula": "133755",
                        "email": "admin@example.com",
                        "name": "João Silva",
                    },
                    "activities": [
                        {
                            "activity": "Criação do processo seletivo Estágio Administrativo 2025",
                            "created_at": "2025-06-01T10:00:00-03:00",
                        },
                        {
                            "activity": "Análise do processo seletivo Estágio Administrativo 2025",
                            "created_at": "2025-06-20T15:30:00-03:00",
                        },
                    ],
                }
            ],
            response_only=True,
        )
    ],
    auth=[{"integrationToken": []}],
)
@api_view(["GET"])
@authentication_classes([IntegrationTokenAuthentication])
@permission_classes([AllowAny])
def integration_activities(request):
    since = request.query_params.get("since")
    until = request.query_params.get("until")
    payload = build_activities_by_user(since=since, until=until)
    return Response(payload)
