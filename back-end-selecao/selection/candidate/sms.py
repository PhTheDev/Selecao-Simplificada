"""SMS gateway abstractions for transactional messages (password recovery OTP)."""

from __future__ import annotations

import logging
import sys
from abc import ABC, abstractmethod

from django.conf import settings
from django.core.mail import send_mail

from .isend import (
    PERMANENT_ISEND_CODES,
    ISendPermanentError,
    ISendSendResult,
    ISendService,
    ISendTransientError,
    classify_isend_failure,
)
from .isend_auth import ISendAuthServiceError, get_isend_token
from .otp import mask_phone, split_phone

logger = logging.getLogger(__name__)


class SmsGateway(ABC):
    @abstractmethod
    def send(self, phone: str, message: str) -> str | None:
        """
        Send SMS to a Brazilian phone (digits only, 10–11).

        Returns provider message id (sms_ctr) when available.
        """


class ConsoleSmsGateway(SmsGateway):
    """Dev/fallback: prints code to stdout in DEBUG; never logs OTP in logger."""

    def send(self, phone: str, message: str) -> str | None:
        masked = mask_phone(phone)
        if settings.DEBUG:
            print(f"[SMS console] to={masked} message={message}", file=sys.stdout, flush=True)
        else:
            logger.info("[SMS console] message sent to=%s", masked)
        return "console-dev"


class ISendSmsGateway(SmsGateway):
    """SOAP adapter via ISendService."""

    def __init__(self, service: ISendService | None = None):
        self._service = service or ISendService()

    def send(self, phone: str, message: str) -> str | None:
        ddd, local = split_phone(phone)
        if not ddd or not local:
            raise ISendPermanentError(
                "Telefone inválido para envio SMS.",
                error_code="invalid_phone",
            )

        long_sms = len(message) > 150
        result = self._dispatch(ddd, local, message, long_sms)

        if not result.success and result.error_code == "1":
            result = self._retry_after_token_refresh(ddd, local, message, long_sms)

        if result.success:
            logger.info("iSend SMS sent sms_ctr=%s", result.sms_ctr)
            return result.sms_ctr

        raise self._error_from_result(result)

    def _dispatch(self, ddd: str, local: str, message: str, long_sms: bool):
        return self._service.send_sms(
            ddd=ddd,
            phone=local,
            text=message,
            long_sms=long_sms,
            enable_answer=False,
            schedule_sms=False,
        )

    def _retry_after_token_refresh(
        self,
        ddd: str,
        local: str,
        message: str,
        long_sms: bool,
    ):
        try:
            get_isend_token(force_refresh=True)
        except ISendAuthServiceError as exc:
            raise ISendPermanentError(
                str(exc),
                error_code=exc.error_code or "1",
            ) from exc
        return self._dispatch(ddd, local, message, long_sms)

    @staticmethod
    def _error_from_result(result: ISendSendResult) -> ISendPermanentError | ISendTransientError:
        message = result.error_message or "Falha ao enviar SMS."
        code = result.error_code or "unknown"
        logger.error("iSend SMS failed error_code=%s", code)
        if code in PERMANENT_ISEND_CODES:
            return ISendPermanentError(message, error_code=code)
        return classify_isend_failure(
            message,
            error_code=result.error_code,
            contact_error=result.contact_error,
        )


class EmailOtpGateway(SmsGateway):
    """Entrega o código no e-mail do candidato (substitui o SMS sem provedor pago)."""

    def __init__(self, email: str):
        self._email = email

    def send(self, phone: str, message: str) -> str | None:
        try:
            sent = send_mail(
                "Selecao Simplificada: codigo de recuperacao de senha",
                message,
                settings.DEFAULT_FROM_EMAIL,
                [self._email],
                fail_silently=False,
            )
        except Exception as exc:
            raise ISendTransientError(f"Falha ao enviar e-mail: {exc}") from exc
        if not sent:
            raise ISendTransientError("E-mail não foi enviado.")
        return "email"


def get_sms_gateway(candidate=None) -> SmsGateway:
    provider = (getattr(settings, "SMS_PROVIDER", "console") or "console").strip().lower()

    if provider == "email":
        if candidate is None or not candidate.email:
            raise ISendPermanentError("Candidato sem e-mail.", error_code="no_email")
        return EmailOtpGateway(candidate.email)

    if provider == "isend":
        return ISendSmsGateway()

    if provider == "console":
        return ConsoleSmsGateway()

    logger.warning("Unknown SMS_PROVIDER=%s; falling back to console", provider)
    return ConsoleSmsGateway()
