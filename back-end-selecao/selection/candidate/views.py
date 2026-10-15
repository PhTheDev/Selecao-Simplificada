from rest_framework import status, viewsets  # type: ignore
from rest_framework.decorators import action  # type: ignore
from rest_framework.response import Response  # type: ignore
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser  # type: ignore
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser  # type: ignore
from rest_framework_simplejwt.tokens import RefreshToken  # type: ignore
from rest_framework.authentication import SessionAuthentication  # type: ignore
from drf_spectacular.utils import (  # type: ignore
    extend_schema,
    extend_schema_view,
    OpenApiExample,
    OpenApiResponse,
)
from core.throttles import LoginRateThrottle, SmsResetRateThrottle

from django.utils import timezone  # type: ignore
from django.shortcuts import render  # type: ignore
from django.contrib.auth.hashers import make_password  # type: ignore
from django.conf import settings  # type: ignore

import logging

from selection.tasks import send_password_reset_sms

from .models import Candidate, EmailVerification, PasswordResetToken, SMSVerification, SMSVerificationStatus
from .serializers import (
    CandidateSerializer,
    CandidateRegisterSerializer,
    CandidateLoginSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetSmsRequestSerializer,
    PasswordResetSmsVerifySerializer,
)
from .otp import (
    generate_verification_id,
    get_otp_payload,
    is_on_cooldown,
    is_valid_phone_format,
    mask_phone,
    normalize_phone,
    phone_hash,
    set_cooldown,
    split_phone,
    store_dummy_otp,
    verify_otp,
)

logger = logging.getLogger(__name__)

SMS_RESET_GENERIC_MESSAGE = (
    "Se este número estiver cadastrado, enviaremos um código por SMS."
)
SMS_INVALID_CODE_MESSAGE = "Código inválido."
SMS_EXPIRED_MESSAGE = "O código de validação expirou."
SMS_BLOCKED_MESSAGE = "Código inválido."
RESEND_COOLDOWN_MESSAGE = "Aguarde alguns segundos antes de solicitar um novo código."


def _sms_expires_in() -> int:
    return int(getattr(settings, "SMS_VERIFICATION_TTL", 300))


def _sms_success_request_payload(verification_id: str) -> dict:
    return {
        "success": True,
        "verification_id": verification_id,
        "expires_in": _sms_expires_in(),
        "message": SMS_RESET_GENERIC_MESSAGE,
    }


def _sync_audit_attempts(audit: SMSVerification | None, verification_id: str) -> None:
    if not audit:
        return
    payload = get_otp_payload(verification_id)
    if payload and "attempts" in payload:
        attempts = int(payload.get("attempts", 0))
        if audit.attempts != attempts:
            audit.attempts = attempts
            audit.save(update_fields=["attempts", "updated_at"])

class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    Remove CSRF enforcement quando (e somente quando) cairmos aqui.
    """
    def enforce_csrf(self, request):
        return


@extend_schema(tags=["Candidatos"])
@extend_schema_view(
    list=extend_schema(
        summary="Listar candidatos",
        description=(
            "- **Superuser**: todos os candidatos.\n"
            "- **Candidato autenticado**: apenas o próprio registro."
        ),
        responses={200: CandidateSerializer(many=True)},
    ),
    retrieve=extend_schema(
        summary="Detalhar candidato",
        responses={
            200: CandidateSerializer,
            404: OpenApiResponse(description="Candidato não encontrado"),
        },
    ),
    create=extend_schema(
        summary="(Admin) Criar candidato",
        description="Criação via ModelViewSet. Prefira `POST .../register/` para cadastro público.",
        request=CandidateSerializer,
        responses={
            201: CandidateSerializer,
            403: OpenApiResponse(description="Requer IsAdminUser"),
        },
    ),
    update=extend_schema(
        summary="Atualizar candidato (PUT)",
        request=CandidateSerializer,
        responses={
            200: CandidateSerializer,
            400: OpenApiResponse(description="Erro de validação"),
            403: OpenApiResponse(description="Sem permissão"),
        },
    ),
    partial_update=extend_schema(
        summary="Atualizar candidato (PATCH)",
        request=CandidateSerializer,
        responses={
            200: CandidateSerializer,
            400: OpenApiResponse(description="Erro de validação"),
            403: OpenApiResponse(description="Sem permissão"),
        },
    ),
    destroy=extend_schema(
        summary="(Admin) Remover candidato",
        responses={
            204: OpenApiResponse(description="Removido"),
            403: OpenApiResponse(description="Requer IsAdminUser"),
        },
    ),
)
class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_authenticators(self):
        """
        ⚠️ NÃO use self.action aqui (ainda não existe nessa fase do request).
        ✅ Decide por URL/path para endpoints públicos sem CSRF.
        """
        request = getattr(self, "request", None)
        path = (getattr(request, "path", None) or "").lower()

        public = (
            path.endswith("/api/selection/candidates/register/")
            or path.endswith("/api/selection/candidates/login/")
            or "/api/selection/candidates/verify-email/" in path
            or path.endswith("/api/selection/candidates/resend_verification/")
            or path.endswith("/api/selection/candidates/password_reset_request/")
            or "/api/selection/candidates/password_reset_validate/" in path
            or path.endswith("/api/selection/candidates/password_reset_confirm/")
            or path.endswith("/api/selection/candidates/password_reset_sms_request/")
            or path.endswith("/api/selection/candidates/password_reset_sms_verify/")
        )

        if public:
            return [CsrfExemptSessionAuthentication()]

        return super().get_authenticators()

    def get_permissions(self):
        """
        Aqui o DRF já define self.action corretamente.
        """
        if self.action in [
            "register",
            "login",
            "verify_email",
            "resend_verification",
            "password_reset_request",
            "password_reset_confirm",
            "password_reset_validate",
            "password_reset_sms_request",
            "password_reset_sms_verify",
        ]:
            permission_classes = [AllowAny]
        elif self.action in ["list", "retrieve", "update", "partial_update", "me"]:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Candidate.objects.none()

        if user.is_superuser:
            return Candidate.objects.all()

        return Candidate.objects.filter(user=user)

    @extend_schema(
        summary="Registrar candidato",
        description=(
            "Cadastro público. Envia e-mail de verificação quando SMTP estiver configurado.\n"
            "O login só é liberado após verificação do e-mail."
        ),
        request=CandidateRegisterSerializer,
        responses={
            201: OpenApiResponse(description="Cadastro criado"),
            400: OpenApiResponse(description="Erro de validação"),
        },
        examples=[
            OpenApiExample(
                "Registro",
                value={
                    "name": "Maria Souza",
                    "email": "maria@email.com",
                    "password": "SenhaForte123!",
                    "password_confirm": "SenhaForte123!",
                },
            )
        ],
        auth=[],
        tags=["Candidatos"],
    )
    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def register(self, request):
        serializer = CandidateRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        candidate = serializer.save()

        # tenta enviar email de verificação (sem quebrar cadastro)
        try:
            candidate.send_verification_email(request)
            verification_sent = True
        except Exception:
            verification_sent = False

        return Response(
            {
                "message": (
                    "✅ Cadastro realizado com sucesso! Um email de verificação foi enviado."
                    if verification_sent
                    else "✅ Cadastro realizado! ⚠️ Não foi possível enviar o email de verificação no momento."
                ),
                "email": candidate.email,
                "candidate_id": candidate.id,
                "email_verified": candidate.email_verified,
                "verification_sent": verification_sent,
            },
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        summary="Login de candidato",
        description="Retorna perfil do candidato + tokens JWT. Requer e-mail verificado.",
        request=CandidateLoginSerializer,
        responses={
            200: OpenApiResponse(description="Login OK com tokens"),
            400: OpenApiResponse(description="Credenciais inválidas ou e-mail não verificado"),
            429: OpenApiResponse(description="Throttle de login (10/min)"),
        },
        auth=[],
        tags=["Candidatos"],
    )
    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],
        throttle_classes=[LoginRateThrottle],
    )
    def login(self, request):
        serializer = CandidateLoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        candidate = serializer.validated_data["candidate"]
        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)
        candidate_data = CandidateSerializer(candidate, context={"request": request}).data

        return Response(
            {
                "candidate": candidate_data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Reenviar e-mail de verificação",
        description="Reenvia o link de verificação para o e-mail informado.",
        request={
            "application/json": {
                "type": "object",
                "properties": {"email": {"type": "string", "format": "email"}},
                "required": ["email"],
            }
        },
        responses={
            200: OpenApiResponse(description="E-mail reenviado"),
            400: OpenApiResponse(description="E-mail já verificado ou ausente"),
            404: OpenApiResponse(description="Candidato não encontrado"),
        },
        auth=[],
        tags=["Candidatos"],
    )
    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def resend_verification(self, request):
        email = (request.data.get("email") or "").strip().lower()
        generic = {
            "message": (
                "Se existir uma conta com este email ainda não verificada, "
                "enviaremos um novo link de verificação."
            )
        }
        if not email:
            return Response({"error": "Email é obrigatório"}, status=status.HTTP_400_BAD_REQUEST)

        candidate = Candidate.objects.filter(email=email).first()
        if candidate and not candidate.email_verified:
            EmailVerification.objects.filter(candidate=candidate, expires_at__lt=timezone.now()).delete()
            candidate.send_verification_email(request)

        return Response(generic, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Verificar e-mail (HTML)",
        description=(
            "Valida o token enviado por e-mail e renderiza página HTML de sucesso/erro. "
            "Não é uma resposta JSON típica da API."
        ),
        responses={
            200: OpenApiResponse(description="HTML de sucesso ou erro"),
        },
        auth=[],
        tags=["Candidatos"],
    )
    @action(detail=False, methods=["get"], permission_classes=[AllowAny], url_path="verify-email/(?P<token>[^/.]+)")
    def verify_email(self, request, token=None):
        if not token:
            return render(request, "candidate/verification_error.html", {"error": "Token de verificação é obrigatório"})

        verification = EmailVerification.objects.filter(token=token).first()
        if not verification:
            return render(request, "candidate/verification_error.html", {"error": "Token inválido ou já utilizado."})

        if verification.is_expired():
            verification.delete()
            return render(
                request,
                "candidate/verification_error.html",
                {"error": "Token expirado. Solicite um novo email.", "expired": True},
            )

        if verification.verified:
            return render(
                request,
                "candidate/verification_error.html",
                {"message": "Este email já foi verificado anteriormente.", "already_verified": True},
            )

        candidate = verification.candidate
        candidate.email_verified = True
        candidate.save(update_fields=["email_verified"])

        if not candidate.user:
            candidate.create_user_account()

        verification.verified = True
        verification.save(update_fields=["verified"])

        refresh = RefreshToken.for_user(candidate.user)
        access_token = str(refresh.access_token)

        return render(
            request,
            "candidate/verification_success.html",
            {
                "candidate_name": candidate.name,
                "email": candidate.email,
                "access_token": access_token,
                "verification_date": timezone.now().strftime("%d/%m/%Y %H:%M"),
            },
        )

    @extend_schema(
        summary="Perfil do candidato autenticado",
        responses={
            200: CandidateSerializer,
            401: OpenApiResponse(description="Não autenticado"),
            404: OpenApiResponse(description="Candidato não encontrado"),
        },
        tags=["Candidatos"],
    )
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def me(self, request):
        candidate = Candidate.objects.filter(user=request.user).first()
        if not candidate:
            return Response({"error": "Candidato não encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response(CandidateSerializer(candidate, context={"request": request}).data)

    # ============================
    # 🔐 Password Reset
    # ============================

    @extend_schema(
        summary="Solicitar reset de senha por e-mail",
        description=(
            "Sempre retorna mensagem genérica (anti-enumeração). "
            "Se o e-mail existir, envia link com token válido por 2 horas."
        ),
        request=PasswordResetRequestSerializer,
        responses={200: OpenApiResponse(description="Mensagem genérica de sucesso")},
        auth=[],
        tags=["Candidatos"],
    )
    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def password_reset_request(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = (serializer.validated_data["email"] or "").strip().lower()

        try:
            candidate = Candidate.objects.get(email=email)

            PasswordResetToken.objects.filter(candidate=candidate, used=False, expires_at__lt=timezone.now()).delete()

            reset = PasswordResetToken.objects.create(
                candidate=candidate,
                used=False,
                expires_at=timezone.now() + timezone.timedelta(hours=2),
            )

            candidate.send_password_reset_email(request, reset)

        except Candidate.DoesNotExist:
            pass

        return Response(
            {"message": "Se existir uma conta com este email, enviaremos instruções para redefinir sua senha."},
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Validar token de reset (e-mail)",
        description="Verifica se o token ainda é válido e não foi usado.",
        responses={
            200: OpenApiResponse(description="`{\"valid\": true}`"),
            400: OpenApiResponse(description="Token inválido ou expirado"),
        },
        auth=[],
        tags=["Candidatos"],
    )
    @action(
        detail=False,
        methods=["get"],
        permission_classes=[AllowAny],
        url_path="password_reset_validate/(?P<token>[^/.]+)",
    )
    def password_reset_validate(self, request, token=None):
        if not token:
            return Response({"valid": False, "error": "Token ausente"}, status=status.HTTP_400_BAD_REQUEST)

        reset = PasswordResetToken.objects.filter(token=token, used=False).first()
        if not reset:
            return Response({"valid": False, "error": "Token inválido"}, status=status.HTTP_400_BAD_REQUEST)

        if reset.is_expired():
            return Response({"valid": False, "error": "Token expirado"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"valid": True}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Confirmar nova senha (e-mail ou SMS)",
        description=(
            "Usa o `token` do e-mail ou o `reset_token` obtido após verificação SMS. "
            "Marca o token como usado."
        ),
        request=PasswordResetConfirmSerializer,
        responses={
            200: OpenApiResponse(description="Senha redefinida"),
            400: OpenApiResponse(description="Token inválido ou expirado"),
        },
        auth=[],
        tags=["Candidatos"],
    )
    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def password_reset_confirm(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["token"]
        password = serializer.validated_data["password"]

        reset = PasswordResetToken.objects.filter(token=token, used=False).first()
        if not reset:
            return Response({"error": "Token inválido ou já utilizado."}, status=status.HTTP_400_BAD_REQUEST)

        if reset.is_expired():
            return Response({"error": "Token expirado."}, status=status.HTTP_400_BAD_REQUEST)

        candidate = reset.candidate

        if not candidate.user:
            candidate.create_user_account()

        candidate.user.set_password(password)
        candidate.user.save(update_fields=["password"])

        # compatibilidade (opcional)
        candidate.password = make_password(password)
        candidate.save(update_fields=["password"])

        reset.used = True
        reset.save(update_fields=["used"])

        return Response({"message": "Senha redefinida com sucesso."}, status=status.HTTP_200_OK)

    # ============================
    # 📱 Password Reset via SMS
    # ============================

    @extend_schema(
        summary="Solicitar reset de senha por SMS",
        description=(
            "Enfileira OTP via Celery (provider `console` ou `isend`). "
            "Resposta sempre genérica (anti-enumeração)."
        ),
        request=PasswordResetSmsRequestSerializer,
        responses={
            200: OpenApiResponse(description="Solicitação registrada (anti-enumeração)."),
            429: OpenApiResponse(description="Cooldown de reenvio ativo."),
        },
        auth=[],
        tags=["Candidatos"],
    )
    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],
        throttle_classes=[SmsResetRateThrottle],
    )
    def password_reset_sms_request(self, request):
        serializer = PasswordResetSmsRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = normalize_phone(serializer.validated_data.get("phone"))
        verification_id = generate_verification_id()

        if not is_valid_phone_format(phone):
            store_dummy_otp(verification_id)
            return Response(
                _sms_success_request_payload(verification_id),
                status=status.HTTP_200_OK,
            )

        if is_on_cooldown(phone):
            return Response(
                {
                    "success": False,
                    "code": "RESEND_COOLDOWN",
                    "message": RESEND_COOLDOWN_MESSAGE,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        set_cooldown(phone)
        ddd, _ = split_phone(phone)
        phash = phone_hash(phone)
        expires_at = timezone.now() + timezone.timedelta(seconds=_sms_expires_in())

        matches = list(Candidate.objects.filter(phone=phone)[:2])
        if len(matches) != 1:
            store_dummy_otp(verification_id)
            logger.info(
                "SMS reset request without unique match verification_id=%s phone=%s",
                verification_id,
                mask_phone(phone),
            )
            return Response(
                _sms_success_request_payload(verification_id),
                status=status.HTTP_200_OK,
            )

        candidate = matches[0]
        SMSVerification.objects.create(
            verification_id=verification_id,
            phone_hash=phash,
            ddd=ddd,
            status=SMSVerificationStatus.PENDING,
            expires_at=expires_at,
        )

        send_password_reset_sms.delay(verification_id, candidate.id, phone)
        logger.info(
            "SMS reset queued verification_id=%s phone=%s",
            verification_id,
            mask_phone(phone),
        )

        return Response(
            _sms_success_request_payload(verification_id),
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Verificar OTP de SMS",
        description="Valida o código e devolve `reset_token` para `password_reset_confirm`.",
        request=PasswordResetSmsVerifySerializer,
        responses={
            200: OpenApiResponse(description="Código validado; retorna reset_token."),
            400: OpenApiResponse(description="Código inválido, expirado ou bloqueado."),
        },
        auth=[],
        tags=["Candidatos"],
    )
    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],
        throttle_classes=[SmsResetRateThrottle],
    )
    def password_reset_sms_verify(self, request):
        serializer = PasswordResetSmsVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        verification_id = (serializer.validated_data.get("verification_id") or "").strip()
        code = (serializer.validated_data.get("code") or "").strip()

        if not verification_id or not code:
            return Response(
                {"success": False, "error": SMS_INVALID_CODE_MESSAGE},
                status=status.HTTP_400_BAD_REQUEST,
            )

        audit = SMSVerification.objects.filter(verification_id=verification_id).first()
        result, candidate_id = verify_otp(verification_id, code)

        if result == "expired":
            if audit:
                audit.status = SMSVerificationStatus.EXPIRED
                audit.save(update_fields=["status", "updated_at"])
            return Response(
                {
                    "success": False,
                    "code": "CODE_EXPIRED",
                    "message": SMS_EXPIRED_MESSAGE,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if result == "blocked":
            if audit:
                audit.status = SMSVerificationStatus.BLOCKED
                audit.attempts = int(getattr(settings, "SMS_VERIFICATION_MAX_ATTEMPTS", 5))
                audit.save(update_fields=["status", "attempts", "updated_at"])
            return Response(
                {
                    "success": False,
                    "code": "BLOCKED",
                    "message": SMS_BLOCKED_MESSAGE,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if result != "ok" or candidate_id is None:
            _sync_audit_attempts(audit, verification_id)
            return Response(
                {"success": False, "error": SMS_INVALID_CODE_MESSAGE},
                status=status.HTTP_400_BAD_REQUEST,
            )

        candidate = Candidate.objects.filter(id=candidate_id).first()
        if not candidate:
            return Response(
                {"success": False, "error": SMS_INVALID_CODE_MESSAGE},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if audit:
            audit.status = SMSVerificationStatus.VERIFIED
            audit.verified_at = timezone.now()
            audit.save(update_fields=["status", "verified_at", "updated_at"])

        PasswordResetToken.objects.filter(
            candidate=candidate, used=False, expires_at__lt=timezone.now()
        ).delete()

        reset = PasswordResetToken.objects.create(
            candidate=candidate,
            used=False,
            expires_at=timezone.now() + timezone.timedelta(hours=2),
        )

        return Response(
            {"reset_token": str(reset.token)},
            status=status.HTTP_200_OK,
        )