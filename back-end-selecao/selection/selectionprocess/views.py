from django.conf import settings
from django.core.cache import cache
from django.db.models import Count

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import NotFound

from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiParameter,
    OpenApiExample,
    OpenApiResponse,
)

from ..permissions import IsAdminOrReadOnly, IsAdminOnly
from ..application.serializers import ApplicationSerializer
from .models import SelectionProcess, NoticeDocument
from .serializers import SelectionProcessSerializer, NoticeDocumentSerializer
from .services import SelectionProcessService
from .cache_utils import SELECTION_PROCESS_CACHE_VERSION_KEY, bump_selection_process_cache_version


@extend_schema(tags=["Editais"])
@extend_schema_view(
    list=extend_schema(
        summary="Listar documentos do edital",
        description=(
            "Retorna todos os documentos de edital.\n\n"
            "- **Público**: apenas visualização.\n"
            "- **Admin/Staff**: total (criação, edição, exclusão)."
        ),
        responses={200: NoticeDocumentSerializer(many=True)},
        tags=["Editais"],
    ),
    retrieve=extend_schema(
        summary="Detalhar documento do edital",
        description="Retorna um documento específico pelo ID.",
        responses={
            200: NoticeDocumentSerializer,
            404: OpenApiResponse(description="Documento não encontrado"),
        },
        tags=["Editais"],
    ),
    create=extend_schema(
        summary="(Admin) Adicionar documento ao edital",
        description="Cria um novo documento associado a um processo seletivo. Apenas admin/staff.",
        request=NoticeDocumentSerializer,
        responses={
            201: NoticeDocumentSerializer,
            400: OpenApiResponse(description="Erro de validação"),
            403: OpenApiResponse(description="Sem permissão"),
        },
        tags=["Editais"],
    ),
    update=extend_schema(
        summary="(Admin) Atualizar documento",
        description="Atualiza completamente um documento. Apenas admin/staff.",
        responses={
            200: NoticeDocumentSerializer,
            400: OpenApiResponse(description="Erro de validação"),
            403: OpenApiResponse(description="Sem permissão"),
            404: OpenApiResponse(description="Documento não encontrado"),
        },
        tags=["Editais"],
    ),
    partial_update=extend_schema(
        summary="(Admin) Atualizar parcialmente documento",
        description="Atualiza parcialmente um documento. Apenas admin/staff.",
        responses={
            200: NoticeDocumentSerializer,
            400: OpenApiResponse(description="Erro de validação"),
            403: OpenApiResponse(description="Sem permissão"),
            404: OpenApiResponse(description="Documento não encontrado"),
        },
        tags=["Editais"],
    ),
    destroy=extend_schema(
        summary="(Admin) Remover documento",
        description=(
            "Remove um documento do edital.\n\n"
            "- **Apenas admin/staff**.\n"
            "- O arquivo físico também é deletado do sistema de arquivos."
        ),
        responses={
            204: OpenApiResponse(description="Documento removido com sucesso"),
            403: OpenApiResponse(description="Sem permissão"),
            404: OpenApiResponse(description="Documento não encontrado"),
        },
        tags=["Editais"],
    ),
)
class NoticeDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar documentos do edital (NoticeDocument).

    Permissões:
    - Público / candidato: **visualizar** apenas documentos de processos `is_active=True`.
    - Staff ou administrador do painel (`administrator_profile`): visualizar todos.
    - Apenas administradores/staff podem **criar, alterar ou deletar** documentos.

    Comportamento:
    - Ao deletar um documento, o arquivo correspondente é removido do storage.
    """

    queryset = NoticeDocument.objects.all()
    serializer_class = NoticeDocumentSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = NoticeDocument.objects.select_related("selection_process")
        user = self.request.user
        privileged = (
            user.is_authenticated
            and (
                getattr(user, "is_staff", False)
                or hasattr(user, "administrator_profile")
            )
        )
        if not privileged:
            qs = qs.filter(selection_process__is_active=True)
        return qs

    def perform_destroy(self, instance):
        """
        Remove o arquivo físico antes de deletar o registro.
        """
        if instance.file:
            storage = instance.file.storage
            if storage.exists(instance.file.name):
                storage.delete(instance.file.name)
        instance.delete()


@extend_schema(tags=["Processos seletivos"])
@extend_schema_view(
    list=extend_schema(
        summary="Listar processos seletivos",
        description=(
            "Retorna processos seletivos.\n\n"
            "- **Público (não staff)**: retorna apenas `is_active=True`.\n"
            "- **Admin/Staff**: retorna todos.\n\n"
            "Observação: o status pode ser atualizado automaticamente com base nas datas "
            "para cada item retornado (se não estiver `finished`)."
        ),
        responses={200: SelectionProcessSerializer(many=True)},
        tags=["Processos seletivos"],
    ),
    retrieve=extend_schema(
        summary="Detalhar processo seletivo (por slug)",
        description=(
            "Retorna os detalhes de um processo seletivo pelo `slug`.\n\n"
            "- **Público**: só acessa se `is_active=True`.\n"
            "- **Admin/Staff**: acessa mesmo inativo.\n\n"
            "Observação: pode atualizar `status` automaticamente se não estiver `finished`."
        ),
        responses={
            200: SelectionProcessSerializer,
            404: OpenApiResponse(description="Processo seletivo não encontrado"),
        },
        tags=["Processos seletivos"],
    ),
    create=extend_schema(
        summary="(Admin) Criar processo seletivo",
        description="Cria um novo processo seletivo. Apenas admin/staff.",
        responses={
            201: SelectionProcessSerializer,
            400: OpenApiResponse(description="Erro de validação"),
            403: OpenApiResponse(description="Sem permissão"),
        },
        tags=["Processos seletivos"],
    ),
    update=extend_schema(
        summary="(Admin) Atualizar processo seletivo (PUT)",
        description="Atualiza um processo seletivo. Apenas admin/staff.",
        responses={
            200: SelectionProcessSerializer,
            400: OpenApiResponse(description="Erro de validação"),
            403: OpenApiResponse(description="Sem permissão"),
        },
        tags=["Processos seletivos"],
    ),
    partial_update=extend_schema(
        summary="(Admin) Atualizar processo seletivo (PATCH)",
        description="Atualiza parcialmente um processo seletivo. Apenas admin/staff.",
        responses={
            200: SelectionProcessSerializer,
            400: OpenApiResponse(description="Erro de validação"),
            403: OpenApiResponse(description="Sem permissão"),
        },
        tags=["Processos seletivos"],
    ),
    destroy=extend_schema(
        summary="(Admin) Remover processo seletivo",
        description="Remove um processo seletivo. Apenas admin/staff.",
        responses={
            204: OpenApiResponse(description="Removido com sucesso"),
            403: OpenApiResponse(description="Sem permissão"),
        },
        tags=["Processos seletivos"],
    ),
)
class SelectionProcessViewSet(viewsets.ModelViewSet):
    """
    ViewSet para SelectionProcess.

    Objetivos:
    - Expor endpoints públicos (list/retrieve) respeitando is_active.
    - Expor endpoints administrativos (criação/edição/forçar status/etapas/selecionar vencedores).
    - Delegar regras de negócio ao SelectionProcessService (SRP).

    Observação:
    - O atributo `lookup_field='slug'` faz o retrieve padrão ser por slug.
    """

    queryset = SelectionProcess.objects.filter(is_active=True)
    serializer_class = SelectionProcessSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.service = SelectionProcessService()

    CACHE_VERSION_KEY = SELECTION_PROCESS_CACHE_VERSION_KEY
    DEFAULT_CACHE_TTL = getattr(settings, "SELECTION_PROCESS_CACHE_TTL", 120)

    def _cache_version(self) -> int:
        version = cache.get(self.CACHE_VERSION_KEY)
        if version is None:
            cache.set(self.CACHE_VERSION_KEY, 1, None)
            return 1
        return int(version)

    def _cache_key(self, scope: str) -> str:
        return f"selection_process:v{self._cache_version()}:{scope}"

    def _invalidate_selection_process_cache(self) -> None:
        bump_selection_process_cache_version()

    def _is_public_request(self, request) -> bool:
        """
        Requisição "pública" usa cache de lista/detalhe.
        Administradores do painel (perfil `administrator_profile`) precisam ver
        `enrollments_count` e filtros atualizados, mesmo sem `is_staff` no User.
        """
        if not request.user.is_authenticated:
            return True
        if getattr(request.user, "is_staff", False):
            return False
        if hasattr(request.user, "administrator_profile"):
            return False
        return True

    def _error_response(self, exc: Exception) -> Response:
        """
        Padroniza a resposta de erro para ações administrativas.
        """
        message = str(exc.detail) if hasattr(exc, "detail") else str(exc)
        status_code = getattr(exc, "status_code", status.HTTP_400_BAD_REQUEST)
        return Response({"error": message}, status=status_code)

    def _serialize_available_processes(self):
        queryset = self.filter_queryset(self.get_queryset())
        available = self.service.get_available_for_enrollment(queryset)
        serializer = self.get_serializer(available, many=True)
        return serializer.data

    def _process_admin_action(self, action_callable):
        try:
            process = action_callable()
            serializer = self.get_serializer(process)
            self._invalidate_selection_process_cache()
            return Response(serializer.data)
        except Exception as exc:
            return self._error_response(exc)

    def get_queryset(self):
        """
        Retorna queryset filtrado baseado no usuário:
        - Público / candidato: somente processos ativos
        - Staff Django ou administrador do painel (`administrator_profile`): todos

        Também atualiza status baseado em datas (se não estiver finished).
        """
        queryset = SelectionProcess.objects.annotate(
            enrollments_count=Count("enrollments")
        )

        privileged = (
            self.request.user.is_authenticated
            and (
                getattr(self.request.user, "is_staff", False)
                or hasattr(self.request.user, "administrator_profile")
            )
        )
        if not privileged:
            queryset = queryset.filter(is_active=True)

        # Atualiza status baseado em datas (não salva aqui — apenas ajusta em memória)
        for process in queryset:
            if process.status != "finished":
                process.update_status_based_on_dates()

        return queryset.order_by("-created_at")

    def list(self, request, *args, **kwargs):
        if self._is_public_request(request):
            page = request.query_params.get("page", "1")
            page_size = request.query_params.get("page_size", str(getattr(settings, "PAGE_SIZE", 20)))
            cache_key = self._cache_key(f"list:page={page}:page_size={page_size}")
            cached_payload = cache.get(cache_key)
            if cached_payload is not None:
                return Response(cached_payload)

            response = super().list(request, *args, **kwargs)
            cache.set(cache_key, response.data, self.DEFAULT_CACHE_TTL)
            return response

        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        if self._is_public_request(request):
            slug = kwargs.get(self.lookup_field)
            cache_key = self._cache_key(f"detail:slug={slug}")
            cached_payload = cache.get(cache_key)
            if cached_payload is not None:
                return Response(cached_payload)

            response = super().retrieve(request, *args, **kwargs)
            cache.set(cache_key, response.data, self.DEFAULT_CACHE_TTL)
            return response

        return super().retrieve(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        self._invalidate_selection_process_cache()

    def perform_update(self, serializer):
        serializer.save()
        self._invalidate_selection_process_cache()

    def perform_destroy(self, instance):
        instance.delete()
        self._invalidate_selection_process_cache()

    # ---------------------------------------------------------------------
    # Endpoints extras (custom)
    # ---------------------------------------------------------------------

    @extend_schema(
        summary="Buscar processo por slug (endpoint auxiliar)",
        description=(
            "Busca um processo seletivo pelo `slug`.\n\n"
            "Diferença do retrieve padrão:\n"
            "- Aqui você pode usar um endpoint dedicado por slug.\n"
            "- O service atualiza e salva o status (se necessário) quando não está `finished`."
        ),
        parameters=[
            OpenApiParameter(
                name="slug",
                type=str,
                location=OpenApiParameter.PATH,
                description="Slug do processo seletivo",
            )
        ],
        responses={
            200: SelectionProcessSerializer,
            404: OpenApiResponse(description="Processo seletivo não encontrado"),
        },
    )
    @action(detail=False, methods=["get"], url_path=r"slug/(?P<slug>[^/.]+)")
    def get_by_slug(self, request, slug=None):
        """
        GET /selection-processes/slug/{slug}/
        Retorna processo por slug (usando service).
        """
        try:
            process = self.service.get_by_slug(slug, request.user)
            serializer = self.get_serializer(process)
            data = serializer.data
            if self._is_public_request(request):
                cache_key = self._cache_key(f"detail:slug={slug}")
                cache.set(cache_key, data, self.DEFAULT_CACHE_TTL)
            return Response(data)
        except NotFound as e:
            return Response({"error": str(e.detail)}, status=status.HTTP_404_NOT_FOUND)

    @extend_schema(
        summary="(Admin) Listar inscrições do processo (por slug)",
        description=(
            "Retorna as inscrições vinculadas ao processo.\n\n"
            "Apenas administradores/staff."
        ),
        responses={
            200: ApplicationSerializer(many=True),
            403: OpenApiResponse(description="Sem permissão"),
            404: OpenApiResponse(description="Processo não encontrado"),
        },
    )
    @action(detail=True, methods=["get"], permission_classes=[IsAdminOnly])
    def enrollments(self, request, slug=None):
        """
        GET /selection-processes/{slug}/enrollments/
        Lista inscrições do processo (admin/staff).
        """
        process = self.get_object()
        enrollments = process.enrollments.select_related("candidate")
        serializer = ApplicationSerializer(enrollments, many=True)
        return Response(serializer.data)

    # ---------------------------------------------------------------------
    # Admin - Finalizar processo (duas variações: por pk e por slug)
    # ---------------------------------------------------------------------

    @extend_schema(
        summary="(Admin) Finalizar processo por ID (pk)",
        description=(
            "Finaliza manualmente um processo seletivo usando o ID.\n\n"
            "Regras:\n"
            "- Apenas admin/staff.\n"
            "- Define `status='finished'`.\n"
            "- Não permite finalizar novamente."
        ),
        parameters=[
            OpenApiParameter(
                name="pk",
                type=int,
                location=OpenApiParameter.PATH,
                description="ID do processo seletivo",
            )
        ],
        responses={
            200: SelectionProcessSerializer,
            400: OpenApiResponse(description="Erro de negócio/validação"),
            403: OpenApiResponse(description="Sem permissão"),
        },
    )
    @action(detail=False, methods=["patch"], url_path=r"(?P<pk>\d+)/finish_process")
    def finish_process_by_id(self, request, pk=None):
        """
        PATCH /selection-processes/{pk}/finish_process/
        Finaliza manualmente por ID.
        """
        return self._process_admin_action(
            lambda: self.service.finish_process(pk, request.user)
        )

    @extend_schema(
        summary="(Admin) Finalizar processo por slug",
        description=(
            "Finaliza manualmente um processo seletivo usando slug.\n\n"
            "Regras:\n"
            "- Apenas admin/staff.\n"
            "- Define `status='finished'`.\n"
            "- Não permite finalizar novamente."
        ),
        responses={
            200: SelectionProcessSerializer,
            400: OpenApiResponse(description="Erro de negócio/validação"),
            403: OpenApiResponse(description="Sem permissão"),
        },
    )
    @action(detail=True, methods=["patch"], url_path="finish_process")
    def finish_process(self, request, slug=None):
        """
        PATCH /selection-processes/{slug}/finish_process/
        Finaliza manualmente por slug.
        """
        process = self.get_object()
        return self._process_admin_action(
            lambda: self.service.finish_process(process.id, request.user)
        )

    @extend_schema(
        summary="(Admin) Reabrir processo finalizado para substituição",
        description=(
            "Reabre um processo com status `finished` para permitir ajustes de resultado "
            "(aceite/desistência/substituição). Mantém `analysis_stage=analysis_completed`."
        ),
        responses={
            200: SelectionProcessSerializer,
            400: OpenApiResponse(description="Erro de negócio/validação"),
            403: OpenApiResponse(description="Sem permissão"),
        },
    )
    @action(detail=False, methods=["patch"], url_path=r"(?P<pk>\d+)/reopen_process")
    def reopen_process(self, request, pk=None):
        """
        PATCH /selection-processes/{pk}/reopen_process/
        Reabre processo finalizado para ajustes de resultado.
        """
        return self._process_admin_action(
            lambda: self.service.reopen_process_for_replacement(pk, request.user)
        )

    # ---------------------------------------------------------------------
    # Admin - Etapas da análise
    # ---------------------------------------------------------------------

    @extend_schema(
        summary="(Admin) Avançar processo para etapa 2 (por ID)",
        description=(
            "Avança o processo para `analysis_stage=stage2_interview`.\n\n"
            "Regras:\n"
            "- Apenas admin/staff.\n"
            "- Processo deve estar `status='in_analysis'`.\n"
            "- Todos os candidatos devem ter a avaliação da etapa 1 concluída."
        ),
        parameters=[
            OpenApiParameter(
                name="pk",
                type=int,
                location=OpenApiParameter.PATH,
                description="ID do processo seletivo",
            )
        ],
        responses={
            200: SelectionProcessSerializer,
            400: OpenApiResponse(description="Regras de negócio não atendidas"),
            403: OpenApiResponse(description="Sem permissão"),
        },
    )
    @action(detail=False, methods=["patch"], url_path=r"(?P<pk>\d+)/advance_to_stage2")
    def advance_to_stage2(self, request, pk=None):
        """
        PATCH /selection-processes/{pk}/advance_to_stage2/
        Avança para etapa 2.
        """
        return self._process_admin_action(
            lambda: self.service.advance_to_stage2(pk, request.user)
        )

    @extend_schema(
        summary="(Admin) Concluir análise (por ID)",
        description=(
            "Marca a análise como concluída: `analysis_stage=analysis_completed`.\n\n"
            "Regras:\n"
            "- Apenas admin/staff.\n"
            "- Processo deve estar `status='in_analysis'`.\n"
            "- Todos os candidatos devem ter a etapa 2 concluída (se for exigida)."
        ),
        parameters=[
            OpenApiParameter(
                name="pk",
                type=int,
                location=OpenApiParameter.PATH,
                description="ID do processo seletivo",
            )
        ],
        responses={
            200: SelectionProcessSerializer,
            400: OpenApiResponse(description="Regras de negócio não atendidas"),
            403: OpenApiResponse(description="Sem permissão"),
        },
    )
    @action(detail=False, methods=["patch"], url_path=r"(?P<pk>\d+)/complete_analysis")
    def complete_analysis(self, request, pk=None):
        """
        PATCH /selection-processes/{pk}/complete_analysis/
        Conclui análise.
        """
        return self._process_admin_action(
            lambda: self.service.complete_analysis(pk, request.user)
        )

    # ---------------------------------------------------------------------
    # Público - Processos disponíveis para inscrição
    # ---------------------------------------------------------------------

    @extend_schema(
        summary="Listar processos disponíveis para inscrição",
        description=(
            "Retorna processos que estão dentro do período de inscrição e ativos.\n\n"
            "Critérios:\n"
            "- `is_active=True`\n"
            "- `status='in_application'`\n"
            "- Data atual entre `beginning_date` e `ending_date`\n\n"
            "Obs: o service pode atualizar status baseado em datas antes de filtrar."
        ),
        responses={200: SelectionProcessSerializer(many=True)},
    )
    @action(detail=False, methods=["get"])
    def available_for_enrollment(self, request):
        """
        GET /selection-processes/available_for_enrollment/
        Lista processos abertos para inscrição.
        """
        if self._is_public_request(request):
            cache_key = self._cache_key("available_for_enrollment")
            cached_payload = cache.get(cache_key)
            if cached_payload is not None:
                return Response(cached_payload)

            payload = self._serialize_available_processes()
            cache.set(cache_key, payload, self.DEFAULT_CACHE_TTL)
            return Response(payload)

        payload = self._serialize_available_processes()
        return Response(payload)

    # ---------------------------------------------------------------------
    # Admin - Status automático (check e force)
    # ---------------------------------------------------------------------

    @extend_schema(
        summary="(Admin) Forçar atualização de status por datas",
        description=(
            "Força atualização do `status` baseado na data atual.\n\n"
            "Regras:\n"
            "- Não permite atualização automática se estiver `finished`.\n"
            "- Pode registrar `analysis_start_date` ao entrar em `in_analysis`."
        ),
        request=None,
        responses={
            200: OpenApiResponse(description="Status atualizado ou mantido"),
            400: OpenApiResponse(description="Processo finalizado não pode ser atualizado"),
        },
        examples=[
            OpenApiExample(
                "Resposta quando atualiza",
                value={
                    "message": "Status atualizado com sucesso",
                    "new_status": "in_analysis",
                    "old_status": "in_application",
                    "analysis_start_date": "2026-01-28T10:00:00-03:00",
                },
            ),
            OpenApiExample(
                "Resposta quando não altera",
                value={
                    "message": "Status não foi alterado",
                    "current_status": "created",
                    "reason": "Datas não requerem mudança de status",
                },
            ),
        ],
    )
    @action(detail=True, methods=["post"])
    def force_update_status(self, request, slug=None):
        """
        POST /selection-processes/{slug}/force_update_status/
        Força atualização de status.
        """
        process = self.get_object()

        if process.status == "finished":
            return Response(
                {"error": "Processos finalizados não podem ter o status atualizado automaticamente"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        was_updated = self.service.update_status_based_on_dates(process)

        if was_updated:
            self._invalidate_selection_process_cache()
            return Response(
                {
                    "message": "Status atualizado com sucesso",
                    "new_status": process.status,
                    "old_status": request.data.get("old_status", "unknown"),
                    "analysis_start_date": process.analysis_start_date,
                }
            )

        return Response(
            {
                "message": "Status não foi alterado",
                "current_status": process.status,
                "reason": "Datas não requerem mudança de status",
            }
        )

    @extend_schema(
        summary="Verificar status atual x status correto (por datas)",
        description=(
            "Retorna o `current_status`, o `correct_status` e se precisa atualizar.\n\n"
            "Não altera o status automaticamente, apenas calcula e informa."
        ),
        responses={
            200: OpenApiResponse(description="Status calculado com sucesso"),
        },
        examples=[
            OpenApiExample(
                "Exemplo",
                value={
                    "current_status": "created",
                    "correct_status": "in_application",
                    "needs_update": True,
                    "beginning_date": "2026-01-01",
                    "ending_date": "2026-02-01",
                    "today": "2026-01-28",
                },
            )
        ],
    )
    @action(detail=True, methods=["get"])
    def check_status(self, request, slug=None):
        """
        GET /selection-processes/{slug}/check_status/
        Verifica status atual x status correto.
        """
        process = self.get_object()
        payload = self.service.get_status_diagnostic(process)
        return Response(payload)

    # ---------------------------------------------------------------------
    # Admin - Selecionar vencedores (por ID)
    # ---------------------------------------------------------------------

    @extend_schema(
        summary="(Admin) Selecionar vencedores automaticamente (por ID)",
        description=(
            "Seleciona os vencedores com base na pontuação e no número de vagas.\n\n"
            "Regras:\n"
            "- Apenas admin/staff.\n"
            "- Recomendado que `analysis_stage` esteja concluído (service pode validar).\n"
            "- Marca os N melhores como `approved` e define `average_score`.\n\n"
            "Obs: desistência/substituição não é automática (isso deve ser manual via admin)."
        ),
        parameters=[
            OpenApiParameter(
                name="pk",
                type=int,
                location=OpenApiParameter.PATH,
                description="ID do processo seletivo",
            )
        ],
        responses={
            200: OpenApiResponse(description="Vencedores selecionados"),
            400: OpenApiResponse(description="Erro de validação / regras de negócio"),
            403: OpenApiResponse(description="Sem permissão"),
        },
        examples=[
            OpenApiExample(
                "Resposta exemplo",
                value={
                    "message": "2 ganhador(es) selecionado(s) com sucesso",
                    "winners": [{"id": 1}, {"id": 2}],
                },
            )
        ],
    )
    @action(detail=False, methods=["post"], url_path=r"(?P<pk>\d+)/select_winners")
    def select_winners(self, request, pk=None):
        """
        POST /selection-processes/{pk}/select_winners/
        Seleciona vencedores com base na nota.
        """
        try:
            winners = self.service.select_winners(pk, request.user)
            serializer = ApplicationSerializer(winners, many=True)
            self._invalidate_selection_process_cache()
            return Response(
                {"message": f"{len(winners)} ganhador(es) selecionado(s) com sucesso", "winners": serializer.data}
            )
        except Exception as exc:
            return self._error_response(exc)

    @extend_schema(
        summary="(Admin) Listar vencedores do processo (por ID)",
        description=(
            "Retorna os vencedores marcados como `approved` para o processo.\n\n"
            "Apenas administradores/staff."
        ),
        parameters=[
            OpenApiParameter(
                name="pk",
                type=int,
                location=OpenApiParameter.PATH,
                description="ID do processo seletivo",
            )
        ],
        responses={
            200: OpenApiResponse(description="Lista de vencedores"),
            400: OpenApiResponse(description="Erro de validação"),
            403: OpenApiResponse(description="Sem permissão"),
        },
        examples=[
            OpenApiExample(
                "Exemplo",
                value={"count": 1, "winners": [{"id": 10, "status": "approved"}]},
            )
        ],
    )
    @action(
        detail=False,
        methods=["get"],
        url_path=r"(?P<pk>\d+)/winners",
        permission_classes=[IsAdminOnly],
    )
    def get_winners(self, request, pk=None):
        """
        GET /selection-processes/{pk}/winners/
        Retorna lista de vencedores (admin/staff).
        """
        try:
            winners = self.service.get_winners(pk, request.user)
            serializer = ApplicationSerializer(winners, many=True)
            return Response({"count": len(winners), "winners": serializer.data})
        except Exception as exc:
            return self._error_response(exc)
