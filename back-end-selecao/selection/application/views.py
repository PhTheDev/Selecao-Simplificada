from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiParameter,
    OpenApiExample,
    OpenApiResponse,
)

from .models import Application
from .serializers import (
    ApplicationSerializer,
    ReplaceWinnerSerializer,
    WinnerDecisionSerializer,
)
from .services import ApplicationService
from ..selectionprocess.models import SelectionProcess


@extend_schema(tags=["Inscrições"])
@extend_schema_view(
    list=extend_schema(
        summary="Listar inscrições (admin vê todas, candidato vê só as próprias)",
        description=(
            "Retorna inscrições.\n\n"
            "- **Admin/Staff**: retorna todas as inscrições.\n"
            "- **Candidato**: retorna apenas as inscrições vinculadas ao seu perfil.\n\n"
            "Use `?expand=evaluations` para incluir `stage1_evaluation` e `stage2_evaluation`.\n\n"
            "Filtros opcionais:\n"
            "- `?selection_process=<id>` filtra por processo seletivo\n"
            "- `?candidate=<id>` filtra por candidato (**somente admin**)\n"
        ),
        parameters=[
            OpenApiParameter(
                name="expand",
                type=str,
                required=False,
                description="Use `evaluations` para expandir avaliações (admin/candidato). Ex: `?expand=evaluations`",
            ),
            OpenApiParameter(
                name="selection_process",
                type=int,
                required=False,
                description="Filtra inscrições por ID do processo seletivo. Ex: `?selection_process=3`",
            ),
            OpenApiParameter(
                name="candidate",
                type=int,
                required=False,
                description="(Admin) Filtra inscrições por ID do candidato. Ex: `?candidate=1`",
            ),
        ],
        responses={200: ApplicationSerializer(many=True)},
    ),
    retrieve=extend_schema(
        summary="Detalhar inscrição",
        description=(
            "Retorna detalhes de uma inscrição.\n\n"
            "- **Admin/Staff**: pode ver qualquer inscrição.\n"
            "- **Candidato**: pode ver apenas inscrições próprias."
        ),
        responses={200: ApplicationSerializer},
    ),
    create=extend_schema(
        summary="Criar inscrição (candidato)",
        description=(
            "Cria uma inscrição para um processo seletivo.\n\n"
            "Regras:\n"
            "- Requer candidato autenticado.\n"
            "- Requer email verificado.\n"
            "- Proíbe inscrição duplicada no mesmo processo.\n"
            "- Só permite inscrição se o processo estiver no período de inscrições.\n\n"
            "Campos obrigatórios: `selection_process_id` + documentos."
        ),
        request=ApplicationSerializer,
        responses={
            201: ApplicationSerializer,
            400: OpenApiResponse(description="Erro de validação"),
            401: OpenApiResponse(description="Não autenticado"),
            403: OpenApiResponse(description="Sem permissão"),
        },
        examples=[
            OpenApiExample(
                "Exemplo de payload",
                value={
                    "selection_process_id": 10,
                    "identity_document": "<file>",
                    "school_records": "<file>",
                    "vitae_curriculum": "<file>",
                    "frequency_statement": "<file opcional>",
                    "course_certificates": "<file opcional>",
                    "portfolio_link": "https://meuportfolio.com"
                },
            )
        ],
    ),
    update=extend_schema(
        summary="Atualizar inscrição (PUT)",
        description=(
            "Atualiza inscrição. Candidato só edita a própria, "
            "em geral enquanto o período de inscrição estiver aberto."
        ),
        request=ApplicationSerializer,
        responses={
            200: ApplicationSerializer,
            400: OpenApiResponse(description="Erro de validação"),
            401: OpenApiResponse(description="Não autenticado"),
            403: OpenApiResponse(description="Sem permissão"),
            404: OpenApiResponse(description="Inscrição não encontrada"),
        },
        tags=["Inscrições"],
    ),
    partial_update=extend_schema(
        summary="Atualizar inscrição (PATCH)",
        description="Atualização parcial da inscrição.",
        request=ApplicationSerializer,
        responses={
            200: ApplicationSerializer,
            400: OpenApiResponse(description="Erro de validação"),
            401: OpenApiResponse(description="Não autenticado"),
            403: OpenApiResponse(description="Sem permissão"),
            404: OpenApiResponse(description="Inscrição não encontrada"),
        },
        tags=["Inscrições"],
    ),
    destroy=extend_schema(
        summary="Remover inscrição",
        description="Remove uma inscrição. Respeita permissões do ViewSet/serviço.",
        responses={
            204: OpenApiResponse(description="Removida"),
            401: OpenApiResponse(description="Não autenticado"),
            403: OpenApiResponse(description="Sem permissão"),
            404: OpenApiResponse(description="Inscrição não encontrada"),
        },
        tags=["Inscrições"],
    ),
)
class ApplicationViewSet(viewsets.ModelViewSet):
    """
    ViewSet de Inscrições (Application).

    - Candidato cria inscrição e consulta suas próprias inscrições.
    - Admin gerencia inscrições, avalia etapas, gera ranking e define vencedores.

    Observação:
    - As regras de negócio ficam no `ApplicationService` (SRP).
    """

    serializer_class = ApplicationSerializer
    queryset = Application.objects.all()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.service = ApplicationService()

    def get_queryset(self):
        """
        Queryset filtrado por usuário:
        - Admin/staff: todas
        - Candidato: somente as próprias

        Filtros opcionais:
        - selection_process=<id>
        - candidate=<id> (apenas admin)
        """
        expand = self.request.query_params.get("expand", "") == "evaluations"
        qs = self.service.get_queryset_for_user(self.request.user, expand_evaluations=expand)

        selection_process_id = self.request.query_params.get("selection_process")
        candidate_id = self.request.query_params.get("candidate")

        if selection_process_id:
            qs = qs.filter(selection_process_id=selection_process_id)

        # candidate filter só para admin
        if candidate_id and (self.request.user.is_staff or self.request.user.is_superuser):
            qs = qs.filter(candidate_id=candidate_id)

        # ordenação útil para admin (por processo e ranking)
        if self.request.user.is_staff or self.request.user.is_superuser:
            return qs.order_by("selection_process_id", "rank_position", "-average_score", "-created_at")

        return qs.order_by("-created_at")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        app = self.service.create_application(serializer.validated_data, request.user)
        out = self.get_serializer(app)
        return Response(out.data, status=status.HTTP_201_CREATED)

    # ---------------------------------------------------------------------
    # Admin - Avaliações
    # ---------------------------------------------------------------------

    @extend_schema(
        summary="(Admin) Criar/atualizar avaliação da etapa 1",
        description=(
            "Cria ou atualiza a avaliação da **Etapa 1** para uma inscrição.\n\n"
            "Regras:\n"
            "- Apenas **Admin/Staff**.\n"
            "- Se já existir avaliação, faz update parcial.\n"
            "- Se não existir, cria nova avaliação vinculada à inscrição."
        ),
        request=None,
        responses={
            200: ApplicationSerializer,
            400: OpenApiResponse(description="Erro de validação"),
            403: OpenApiResponse(description="Sem permissão"),
        },
        examples=[OpenApiExample("Exemplo payload", value={"total_score": 8.5, "notes": "Boa documentação"})],
    )
    @action(detail=True, methods=["post"], url_path="stage1_evaluation")
    def stage1_evaluation(self, request, pk=None):
        application = self.get_object()
        updated = self.service.create_or_update_stage1_evaluation(application, request.data, request.user)
        return Response(self.get_serializer(updated).data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="(Admin) Criar/atualizar avaliação da etapa 2",
        description=(
            "Cria ou atualiza a avaliação da **Etapa 2** para uma inscrição.\n\n"
            "Regras:\n"
            "- Apenas **Admin/Staff**.\n"
            "- Se já existir avaliação, faz update parcial.\n"
            "- Se não existir, cria nova avaliação vinculada à inscrição."
        ),
        request=None,
        responses={
            200: ApplicationSerializer,
            400: OpenApiResponse(description="Erro de validação"),
            403: OpenApiResponse(description="Sem permissão"),
        },
        examples=[OpenApiExample("Exemplo payload", value={"total_score": 9.0, "notes": "Ótima entrevista"})],
    )
    @action(detail=True, methods=["post"], url_path="stage2_evaluation")
    def stage2_evaluation(self, request, pk=None):
        application = self.get_object()
        updated = self.service.create_or_update_stage2_evaluation(application, request.data, request.user)
        return Response(self.get_serializer(updated).data, status=status.HTTP_200_OK)

    # ---------------------------------------------------------------------
    # Admin - Decisão do vencedor
    # ---------------------------------------------------------------------

    @extend_schema(
        summary="(Admin) Registrar decisão do vencedor: accepted/declined",
        request=WinnerDecisionSerializer,
        responses={
            200: ApplicationSerializer,
            400: OpenApiResponse(description="Erro de validação"),
            403: OpenApiResponse(description="Sem permissão"),
        },
        examples=[
            OpenApiExample("Exemplo accepted", value={"application_id": 1, "decision": "accepted", "notes": "Confirmou por e-mail"}),
            OpenApiExample("Exemplo declined", value={"application_id": 1, "decision": "declined", "notes": "Desistiu"}),
        ],
    )
    @action(detail=True, methods=["post"], url_path="winner_decision")
    def winner_decision(self, request, pk=None):
        self.service.validate_admin_permission(request.user)

        application = self.get_object()

        payload = WinnerDecisionSerializer(data=request.data)
        payload.is_valid(raise_exception=True)

        decision = payload.validated_data["decision"]
        notes = payload.validated_data.get("notes")

        updated = self.service.set_winner_decision(application, decision, request.user, notes=notes)
        return Response(self.get_serializer(updated).data, status=status.HTTP_200_OK)

    # ---------------------------------------------------------------------
    # Admin - Ranking / Resultado
    # ---------------------------------------------------------------------

    @extend_schema(
        summary="(Admin) Listar ranking de inscrições por processo (slug)",
        parameters=[
            OpenApiParameter(
                name="slug",
                type=str,
                location=OpenApiParameter.PATH,
                description="Slug do processo seletivo",
            ),
        ],
        responses={
            200: OpenApiResponse(description="Ranking do processo", response=ApplicationSerializer(many=True)),
            404: OpenApiResponse(description="Processo não encontrado"),
        },
    )
    @action(detail=False, methods=["get"], url_path=r"process/(?P<slug>[^/.]+)/ranking")
    def process_ranking(self, request, slug=None):
        self.service.validate_admin_permission(request.user)

        process = SelectionProcess.objects.filter(slug=slug).first()
        if not process:
            return Response({"error": "Processo não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        qs = (
            Application.objects.filter(selection_process=process)
            .select_related("candidate", "selection_process", "stage1_evaluation", "stage2_evaluation")
            .order_by("rank_position", "-average_score", "created_at")
        )

        return Response({
            "process": process.slug,
            "count": qs.count(),
            "results": ApplicationSerializer(qs, many=True).data
        }, status=status.HTTP_200_OK)

    @extend_schema(
        summary="(Admin) Gerar ranking e definir vencedor(es) do processo",
        parameters=[
            OpenApiParameter(
                name="slug",
                type=str,
                location=OpenApiParameter.PATH,
                description="Slug do processo seletivo",
            ),
        ],
        request=None,
        responses={
            200: OpenApiResponse(description="Ranking gerado e vencedores definidos"),
            400: OpenApiResponse(description="Erro de validação"),
            404: OpenApiResponse(description="Processo não encontrado"),
        },
    )
    @action(detail=False, methods=["post"], url_path=r"process/(?P<slug>[^/.]+)/generate_winners")
    def generate_winners(self, request, slug=None):
        self.service.validate_admin_permission(request.user)

        process = SelectionProcess.objects.filter(slug=slug).first()
        if not process:
            return Response({"error": "Processo não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        self.service.generate_ranking_and_set_winners(process, request.user)
        return Response({"message": "Ranking gerado e vencedores definidos com sucesso."}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="(Admin) Substituir vencedor manualmente",
        parameters=[
            OpenApiParameter(
                name="slug",
                type=str,
                location=OpenApiParameter.PATH,
                description="Slug do processo seletivo",
            ),
        ],
        request=ReplaceWinnerSerializer,
        responses={
            200: OpenApiResponse(description="Vencedor substituído com sucesso"),
            400: OpenApiResponse(description="Erro de validação"),
            403: OpenApiResponse(description="Sem permissão"),
            404: OpenApiResponse(description="Processo não encontrado"),
        },
        examples=[
            OpenApiExample(
                "Exemplo de substituição",
                value={
                    "declined_application_id": 120,
                    "new_winner_application_id": 121,
                    "notes": "Desistência formal; promovido próximo da lista."
                },
            )
        ],
    )
    @action(detail=False, methods=["post"], url_path=r"process/(?P<slug>[^/.]+)/replace_winner")
    def replace_winner(self, request, slug=None):
        self.service.validate_admin_permission(request.user)

        process = SelectionProcess.objects.filter(slug=slug).first()
        if not process:
            return Response({"error": "Processo não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        payload = ReplaceWinnerSerializer(data=request.data)
        payload.is_valid(raise_exception=True)

        result = self.service.manual_replace_winner(
            process=process,
            declined_application_id=payload.validated_data["declined_application_id"],
            new_winner_application_id=payload.validated_data["new_winner_application_id"],
            user=request.user,
            notes=payload.validated_data.get("notes"),
        )

        return Response({"message": "Vencedor substituído com sucesso.", "result": result}, status=status.HTTP_200_OK)
