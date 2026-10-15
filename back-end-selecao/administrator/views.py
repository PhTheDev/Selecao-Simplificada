from rest_framework import status, viewsets  # type: ignore
from rest_framework.decorators import action  # type: ignore
from rest_framework.response import Response  # type: ignore
from rest_framework.permissions import IsAuthenticated, AllowAny  # type: ignore
from rest_framework_simplejwt.tokens import RefreshToken  # type: ignore
from rest_framework.authentication import SessionAuthentication  # type: ignore
from drf_spectacular.utils import (  # type: ignore
    extend_schema,
    extend_schema_view,
    OpenApiExample,
    OpenApiResponse,
)
from core.throttles import LoginRateThrottle

from django.contrib.auth.models import User  # type: ignore

from .models import AdministratorProfile
from .choices import AdministratorRole
from .serializers import (
    AdministratorProfileSerializer,
    AdministratorRegisterSerializer,
    AdministratorLoginSerializer,
    AdministratorUpdateSerializer,
)


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """Desativa CSRF quando SessionAuthentication estiver em uso."""
    def enforce_csrf(self, request):
        return


@extend_schema(tags=["Administração"])
@extend_schema_view(
    list=extend_schema(
        summary="Listar administradores",
        description=(
            "Retorna perfis de administrador.\n\n"
            "- **Super admin**: lista todos.\n"
            "- **Outros admins**: retorna apenas o próprio perfil."
        ),
        responses={200: AdministratorProfileSerializer(many=True)},
    ),
    retrieve=extend_schema(
        summary="Detalhar administrador",
        description="Retorna um perfil de administrador pelo ID.",
        responses={
            200: AdministratorProfileSerializer,
            404: OpenApiResponse(description="Administrador não encontrado"),
        },
    ),
    create=extend_schema(
        summary="Criar administrador (via ModelViewSet)",
        description=(
            "Endpoint padrão do ModelViewSet. Prefira `POST .../register/` "
            "para criação com regras de negócio (primeiro admin / super_admin)."
        ),
        request=AdministratorProfileSerializer,
        responses={
            201: AdministratorProfileSerializer,
            401: OpenApiResponse(description="Não autenticado"),
            403: OpenApiResponse(description="Sem permissão"),
        },
    ),
    update=extend_schema(
        summary="Atualizar administrador (PUT)",
        description=(
            "Atualiza perfil. Super admin pode editar qualquer um; "
            "demais admins apenas o próprio perfil."
        ),
        request=AdministratorUpdateSerializer,
        responses={
            200: AdministratorProfileSerializer,
            400: OpenApiResponse(description="Erro de validação"),
            403: OpenApiResponse(description="Sem permissão"),
            404: OpenApiResponse(description="Administrador não encontrado"),
        },
    ),
    partial_update=extend_schema(
        summary="Atualizar administrador (PATCH)",
        description=(
            "Atualização parcial. Super admin pode editar qualquer um; "
            "demais admins apenas o próprio perfil."
        ),
        request=AdministratorUpdateSerializer,
        responses={
            200: AdministratorProfileSerializer,
            400: OpenApiResponse(description="Erro de validação"),
            403: OpenApiResponse(description="Sem permissão"),
            404: OpenApiResponse(description="Administrador não encontrado"),
        },
    ),
    destroy=extend_schema(
        summary="Desativar administrador",
        description=(
            "Soft-delete: define `is_active=False` no perfil e no User.\n\n"
            "Apenas **super_admin**."
        ),
        responses={
            200: OpenApiResponse(description="Administrador desativado"),
            403: OpenApiResponse(description="Sem permissão"),
            404: OpenApiResponse(description="Administrador não encontrado"),
        },
    ),
)
class AdministratorViewSet(viewsets.ModelViewSet):
    queryset = AdministratorProfile.objects.select_related("user").all()
    serializer_class = AdministratorProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # ✅ aqui pode usar self.action sem problema
        if self.action in ["login", "register"]:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_authenticators(self):
        """
        ❌ NÃO use self.action aqui (não existe ainda).
        ✅ Use o path para decidir se precisa desabilitar CSRF.
        """
        request = getattr(self, "request", None)
        path = (getattr(request, "path", None) or "").lower()

        # login é público e não precisa validar CSRF de sessão.
        # register, por outro lado, precisa aceitar autenticação JWT do admin logado.
        if path.endswith("/api/administration/administrators/login/"):
            return [CsrfExemptSessionAuthentication()]

        return super().get_authenticators()

    def get_queryset(self):
        user = self.request.user

        if not hasattr(user, "administrator_profile"):
            return AdministratorProfile.objects.none()

        if user.administrator_profile.role == AdministratorRole.SUPER_ADMIN:
            return AdministratorProfile.objects.select_related("user").all()

        return AdministratorProfile.objects.select_related("user").filter(user=user)

    @extend_schema(
        summary="Registrar administrador",
        description=(
            "- **Primeiro admin**: sem autenticação, se ainda não existir nenhum perfil.\n"
            "- **Depois**: somente `super_admin` autenticado.\n"
            "- Sempre cria como `super_admin` com `is_staff` e `is_superuser`."
        ),
        request=AdministratorRegisterSerializer,
        responses={
            201: OpenApiResponse(description="Administrador criado com tokens JWT"),
            400: OpenApiResponse(description="Erro de validação"),
            403: OpenApiResponse(description="Sem permissão"),
        },
        examples=[
            OpenApiExample(
                "Payload de registro",
                value={
                    "username": "admin.ti",
                    "email": "admin@example.com",
                    "password": "SenhaForte123!",
                    "password_confirm": "SenhaForte123!",
                    "first_name": "João",
                    "last_name": "Silva",
                    "matricula": "133755",
                    "department": "TI",
                },
            )
        ],
        auth=[],
        tags=["Administração"],
    )
    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def register(self, request):
        """
        - Primeiro admin sem auth se não existir nenhum.
        - Depois disso, somente super_admin cria.
        - Sempre cria como super_admin com user.is_staff e user.is_superuser.
        """
        if not request.user.is_authenticated:
            if AdministratorProfile.objects.exists():
                return Response(
                    {"error": "Apenas administradores existentes podem criar novos administradores."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
            if not hasattr(request.user, "administrator_profile"):
                return Response({"error": "Sem permissão."}, status=status.HTTP_403_FORBIDDEN)

            if request.user.administrator_profile.role != AdministratorRole.SUPER_ADMIN:
                return Response(
                    {"error": "Apenas Super Administradores podem criar novos administradores."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = AdministratorRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        administrator = serializer.save()

        refresh = RefreshToken.for_user(administrator.user)
        admin_data = AdministratorProfileSerializer(administrator).data

        return Response(
            {
                "administrator": admin_data,
                "tokens": {"refresh": str(refresh), "access": str(refresh.access_token)},
                "message": "Administrador criado com sucesso!",
            },
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        summary="Login de administrador",
        description="Autentica com `username` e `password`. Retorna perfil + tokens JWT.",
        request=AdministratorLoginSerializer,
        responses={
            200: OpenApiResponse(description="Login OK com tokens"),
            400: OpenApiResponse(description="Credenciais inválidas"),
            429: OpenApiResponse(description="Throttle de login (10/min)"),
        },
        examples=[
            OpenApiExample(
                "Credenciais",
                value={"username": "admin.ti", "password": "SenhaForte123!"},
            )
        ],
        auth=[],
        tags=["Administração"],
    )
    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],
        throttle_classes=[LoginRateThrottle],
    )
    def login(self, request):
        serializer = AdministratorLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user: User = serializer.validated_data["user"]
        administrator_profile = serializer.validated_data["administrator_profile"]

        refresh = RefreshToken.for_user(user)
        admin_data = AdministratorProfileSerializer(administrator_profile).data

        return Response(
            {
                "administrator": admin_data,
                "tokens": {"refresh": str(refresh), "access": str(refresh.access_token)},
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Logout de administrador",
        description="Envia o refresh token para blacklist (SimpleJWT).",
        request={
            "application/json": {
                "type": "object",
                "properties": {"refresh_token": {"type": "string"}},
                "required": ["refresh_token"],
            }
        },
        responses={
            200: OpenApiResponse(description="Logout realizado"),
            400: OpenApiResponse(description="Token inválido"),
            401: OpenApiResponse(description="Não autenticado"),
        },
        tags=["Administração"],
    )
    @action(detail=False, methods=["post"])
    def logout(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logout realizado com sucesso"}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "Token inválido"}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Perfil do administrador autenticado",
        description="Retorna o `AdministratorProfile` vinculado ao JWT atual.",
        responses={
            200: AdministratorProfileSerializer,
            401: OpenApiResponse(description="Não autenticado"),
            404: OpenApiResponse(description="Perfil não encontrado"),
        },
        tags=["Administração"],
    )
    @action(detail=False, methods=["get"])
    def me(self, request):
        try:
            administrator = request.user.administrator_profile
            serializer = self.get_serializer(administrator)
            return Response(serializer.data)
        except AdministratorProfile.DoesNotExist:
            return Response({"error": "Perfil de administrador não encontrado"}, status=status.HTTP_404_NOT_FOUND)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        current_user = request.user

        if not hasattr(current_user, "administrator_profile"):
            return Response({"error": "Sem permissão."}, status=status.HTTP_403_FORBIDDEN)

        is_super_admin = current_user.administrator_profile.role == AdministratorRole.SUPER_ADMIN
        is_self = instance.user == current_user

        if not is_super_admin and not is_self:
            return Response(
                {"error": "Você não tem permissão para editar este perfil."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AdministratorUpdateSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(AdministratorProfileSerializer(instance).data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        if not hasattr(request.user, "administrator_profile"):
            return Response({"error": "Sem permissão."}, status=status.HTTP_403_FORBIDDEN)

        if request.user.administrator_profile.role != AdministratorRole.SUPER_ADMIN:
            return Response(
                {"error": "Apenas Super Administradores podem excluir administradores."},
                status=status.HTTP_403_FORBIDDEN,
            )

        instance = self.get_object()
        instance.is_active = False
        instance.save()

        instance.user.is_active = False
        instance.user.save()

        return Response({"message": "Administrador desativado com sucesso."}, status=status.HTTP_200_OK)
