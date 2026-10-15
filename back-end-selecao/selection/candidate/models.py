import uuid
from django.db import models  # type: ignore
from django.utils import timezone  # type: ignore
from django.utils.translation import gettext_lazy as _  # type: ignore
from django.core.validators import RegexValidator  # type: ignore
from django.contrib.auth.models import User  # type: ignore

from ..models import BaseModel
from .choices import Gender, Period, Semester


def candidate_profile_image_path(instance, filename):
    return f'candidate_profiles/{instance.id}_{filename}'


class Candidate(BaseModel):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='candidate',
        null=True,
        blank=True
    )
    name = models.CharField(_("Nome"), max_length=255)
    email = models.EmailField(_("E-mail"), max_length=255, unique=True)

    password = models.CharField(
        _("Senha"),
        max_length=128,
        null=True,
        blank=True,
        help_text=_("Senha para login tradicional (hash)")
    )

    email_verified = models.BooleanField(_("E-mail verificado"), default=False)

    cpf = models.CharField(
        _("CPF"),
        max_length=11,
        validators=[RegexValidator(r"^\d{11}$", "Digite um CPF válido (somente números)")],
        help_text=_("Apenas números"),
        null=True,
        blank=True
    )
    gender = models.CharField(_("Sexo"), max_length=1, choices=Gender.choices, null=True, blank=True)
    phone = models.CharField(
        _("Telefone"),
        max_length=15,
        validators=[RegexValidator(r"^\d{10,11}$", "Digite um telefone válido (somente números)")],
        null=True,
        blank=True
    )

    college = models.CharField(_("Faculdade"), max_length=255, null=True, blank=True)
    period = models.CharField(_("Período"), max_length=1, choices=Period.choices, null=True, blank=True)
    semester = models.CharField(_("Semestre"), max_length=2, choices=Semester.choices, null=True, blank=True)

    cep = models.CharField(_("CEP"), max_length=8, null=True, blank=True)
    address = models.CharField(_("Endereço"), max_length=255, null=True, blank=True)
    complement = models.CharField(_("Complemento"), max_length=255, null=True, blank=True)
    neighborhood = models.CharField(_("Bairro"), max_length=255, null=True, blank=True)
    city = models.CharField(_("Cidade"), max_length=50, null=True, blank=True)
    uf = models.CharField(_("UF"), max_length=2, null=True, blank=True)

    profile_image = models.ImageField(
        _("Foto de perfil"),
        upload_to=candidate_profile_image_path,
        null=True,
        blank=True,
        help_text=_("Imagem de perfil do candidato")
    )

    class Meta:
        verbose_name = _("Candidato")
        verbose_name_plural = _("Candidatos")

    def __str__(self):
        return self.name

    def create_user_account(self):
        """Cria ou obtém um User do Django para o Candidate"""
        if self.user:
            return self.user

        try:
            user = User.objects.get(email=self.email)
        except User.DoesNotExist:
            try:
                user = User.objects.get(username=self.email)
            except User.DoesNotExist:
                user = User.objects.create_user(
                    username=self.email,
                    email=self.email,
                    password=None,
                    first_name=self.name.split()[0] if self.name else '',
                    last_name=' '.join(self.name.split()[1:]) if self.name else ''
                )

        user.username = self.email
        user.email = self.email
        user.first_name = self.name.split()[0] if self.name else ''
        user.last_name = ' '.join(self.name.split()[1:]) if self.name else ''
        user.save()

        self.user = user
        self.save()
        return self.user

    def send_password_reset_email(self, request, reset_obj):
        """
        Envia email de redefinição de senha.
        reset_obj é o PasswordResetToken criado para este candidato.
        """
        from django.core.mail import send_mail  # type: ignore
        from django.template.loader import render_to_string  # type: ignore
        from django.utils.html import strip_tags  # type: ignore
        from django.conf import settings  # type: ignore
        from django.utils import timezone  # type: ignore
        import logging

        logger = logging.getLogger(__name__)

        # ============================
        # 🔗 URL DO FRONTEND (Next.js)
        # ============================
        frontend_url = getattr(
            settings,
            "FRONTEND_URL",
            "http://localhost:3000"
        ).rstrip("/")

        reset_url = (
            f"{frontend_url}/auth/redefinir-senha"
            f"?token={reset_obj.token}"
        )

        # ============================
        # ⏱️ Tempo restante (horas)
        # ============================
        expires_hours = max(
            1,
            int((reset_obj.expires_at - timezone.now()).total_seconds() // 3600)
        )

        # ============================
        # 📧 Render do template
        # ============================
        html_message = render_to_string(
            "candidate/password_reset_email.html",
            {
                "candidate_name": self.name,
                "reset_url": reset_url,
                "expires_hours": expires_hours,
                "support_email": getattr(
                    settings,
                    "SUPPORT_EMAIL",
                    "contato@example.com"
                ),
                "tracking_pixel_url": getattr(
                    settings,
                    "TRACKING_PIXEL_URL",
                    ""
                ),
            },
        )

        plain_message = strip_tags(html_message)

        # ============================
        # 🚀 Envio do email
        # ============================
        result = send_mail(
            subject="Redefinição de Senha - Seleção Simplificada",
            message=plain_message,
            html_message=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[self.email],
            fail_silently=False,
        )

        if result != 1:
            logger.error(f"❌ Falha ao enviar email de reset para {self.email}")
            raise Exception("Falha ao enviar email de redefinição de senha")

        logger.info(f"✅ Email de redefinição de senha enviado para {self.email}")
        return True
    
    def send_verification_email(self, request):
        """
        Envia email de verificação para o candidato, criando um EmailVerification.
        O link aponta para o endpoint do BACK (Django) que renderiza o template de sucesso/erro.
        """
        from django.core.mail import send_mail  # type: ignore
        from django.template.loader import render_to_string  # type: ignore
        from django.utils.html import strip_tags  # type: ignore
        from django.conf import settings  # type: ignore
        from django.utils import timezone  # type: ignore
        from datetime import timedelta
        import logging

        logger = logging.getLogger(__name__)

        # Remove tokens antigos/expirados (opcional, mas bom)
        EmailVerification.objects.filter(
            candidate=self,
            verified=False,
            expires_at__lt=timezone.now()
        ).delete()

        # Cria um novo token (2h, ajuste se quiser)
        verification = EmailVerification.objects.create(
            candidate=self,
            email=self.email,
            verified=False,
            expires_at=timezone.now() + timedelta(hours=2),
        )

        # Monta domínio do BACK (para chamar o endpoint que renderiza HTML)
        if getattr(settings, "DEBUG", False):
            domain = f"http://{request.get_host()}"
        else:
            domain = f"https://{request.get_host()}"

        # Link do endpoint do seu ViewSet:
        # @action(... url_path='verify-email/(?P<token>[^/.]+)')
        verification_url = f"{domain}/api/selection/candidates/verify-email/{verification.token}"

        expires_hours = max(
            1,
            int((verification.expires_at - timezone.now()).total_seconds() // 3600)
        )

        html_message = render_to_string(
            "candidate/verification_email.html",
            {
                "candidate_name": self.name,
                "verification_url": verification_url,
                "expires_hours": expires_hours,
                "support_email": getattr(settings, "SUPPORT_EMAIL", "contato@example.com"),
                "tracking_pixel_url": getattr(settings, "TRACKING_PIXEL_URL", ""),
            },
        )
        plain_message = strip_tags(html_message)

        result = send_mail(
            subject="Verificação de E-mail - Seleção Simplificada",
            message=plain_message,
            html_message=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[self.email],
            fail_silently=False,
        )

        if result != 1:
            logger.error(f"❌ Falha ao enviar email de verificação para {self.email}")
            raise Exception("Falha ao enviar email de verificação")

        logger.info(f"✅ Email de verificação enviado para {self.email}")
        return True




class EmailVerification(BaseModel):
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    candidate = models.ForeignKey('Candidate', on_delete=models.CASCADE, related_name='verifications')
    email = models.EmailField(_("E-mail para verificação"))
    verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    class Meta:
        verbose_name = _("Verificação de E-mail")
        verbose_name_plural = _("Verificações de E-mail")

    def is_expired(self):
        return timezone.now() > self.expires_at


class PasswordResetToken(BaseModel):
    """
    Token de redefinição de senha (uso único)
    """
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name="password_resets")
    used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    class Meta:
        verbose_name = _("Token de redefinição de senha")
        verbose_name_plural = _("Tokens de redefinição de senha")

    @property
    def expires_hours(self) -> int:
        # só para template (ajuste se quiser)
        return 2

    def is_expired(self):
        return timezone.now() > self.expires_at


class SMSVerificationStatus(models.TextChoices):
    PENDING = "PENDING", _("Pendente")
    SENT = "SENT", _("Enviado")
    VERIFIED = "VERIFIED", _("Verificado")
    EXPIRED = "EXPIRED", _("Expirado")
    BLOCKED = "BLOCKED", _("Bloqueado")
    FAILED = "FAILED", _("Falha no envio")


class SMSVerification(BaseModel):
    """
    Auditoria de envio/validação SMS — nunca armazena o código OTP.
    """

    verification_id = models.CharField(_("ID de verificação"), max_length=64, unique=True, db_index=True)
    phone_hash = models.CharField(_("Hash do telefone"), max_length=64, db_index=True)
    ddd = models.CharField(_("DDD"), max_length=2, blank=True, default="")
    status = models.CharField(
        _("Status"),
        max_length=16,
        choices=SMSVerificationStatus.choices,
        default=SMSVerificationStatus.PENDING,
        db_index=True,
    )
    attempts = models.PositiveSmallIntegerField(_("Tentativas"), default=0)
    sms_ctr = models.CharField(_("SMS CTR"), max_length=64, blank=True, default="")
    error_code = models.CharField(_("Código de erro"), max_length=32, blank=True, default="")
    error_message = models.TextField(_("Mensagem de erro"), blank=True, default="")
    requested_at = models.DateTimeField(_("Solicitado em"), auto_now_add=True)
    sent_at = models.DateTimeField(_("Enviado em"), null=True, blank=True)
    verified_at = models.DateTimeField(_("Verificado em"), null=True, blank=True)
    expires_at = models.DateTimeField(_("Expira em"))

    class Meta:
        verbose_name = _("Verificação SMS")
        verbose_name_plural = _("Verificações SMS")
        ordering = ("-requested_at",)

    def __str__(self):
        return f"SMSVerification {self.verification_id} ({self.status})"
