"""SOAP client for iSend SMS (Envio de SMS Unitário)."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from django.conf import settings
from zeep import Client
from zeep.exceptions import Fault, TransportError
from zeep.transports import Transport

from .isend_auth import ISendAuthServiceError, get_isend_token

logger = logging.getLogger(__name__)

DEFAULT_WSDL = "http://www2.isend.com.br/SendWSImplService/SendWSImpl?wsdl"

# Known iSend error codes (documented).
ISEND_ERROR_CODES = {
    "1": "Token inválido",
    "2": "Campo text ausente",
    "3": "long_sms inválido",
    "4": "long_sms incorreto para mensagem longa",
    "5": "Crédito insuficiente",
    "6": "schedule_sms inválido",
    "7": "schedule_date inválida",
}
PERMANENT_ISEND_CODES = frozenset(ISEND_ERROR_CODES)


@dataclass(frozen=True)
class ISendSendResult:
    success: bool
    sms_ctr: str | None = None
    contact_error: str | None = None
    sms_error: str | None = None
    error_code: str | None = None
    error_message: str | None = None


class ISendServiceError(Exception):
    """Raised when iSend communication fails."""

    def __init__(self, message: str, *, error_code: str | None = None):
        super().__init__(message)
        self.error_code = error_code


class ISendTransientError(ISendServiceError):
    """Retryable communication or temporary iSend failure."""


class ISendPermanentError(ISendServiceError):
    """Non-retryable business or configuration failure."""


def classify_isend_failure(
    message: str,
    *,
    error_code: str | None = None,
    contact_error: str | None = None,
) -> ISendServiceError:
    """Map an iSend business/transport outcome to a retryable or permanent error."""
    if error_code and error_code in PERMANENT_ISEND_CODES:
        return ISendPermanentError(message, error_code=error_code)
    if contact_error:
        return ISendPermanentError(message, error_code=error_code or "contact_error")
    return ISendTransientError(message, error_code=error_code)


class ISendService:
    """
    Isolated SOAP adapter for iSend unitary SMS.

    Parameters follow iSend documentation only:
    token, sms, cell_phone_ddd, cell_phone, text, long_sms,
    enable_answer, schedule_sms, schedule_date.
    """

    _OPERATION_CANDIDATES = (
        "unitarySms",
        "sendSms",
        "SendSms",
        "sendSMS",
        "SendSMS",
        "enviarSms",
        "EnviarSms",
    )

    def __init__(
        self,
        token: str | None = None,
        wsdl: str | None = None,
        timeout: int = 15,
        *,
        resolve_token: bool = True,
    ):
        self._static_token = (token or "").strip() if token is not None else None
        self.wsdl = (wsdl or getattr(settings, "ISEND_WSDL", "") or DEFAULT_WSDL).strip()
        self.timeout = timeout
        self._resolve_token = resolve_token
        self._client: Client | None = None

    @property
    def token(self) -> str:
        if self._static_token:
            return self._static_token
        if self._resolve_token:
            return get_isend_token()
        return (getattr(settings, "ISEND_TOKEN", "") or "").strip()

    def _get_client(self) -> Client:
        if self._client is None:
            transport = Transport(timeout=self.timeout)
            self._client = Client(self.wsdl, transport=transport)
        return self._client

    def _resolve_operation(self, client: Client):
        service = client.service
        for name in self._OPERATION_CANDIDATES:
            op = getattr(service, name, None)
            if op is not None:
                return op
        available = [name for name in dir(service) if not name.startswith("_")]
        raise ISendPermanentError(
            f"Operação SOAP de envio não encontrada no WSDL. Disponíveis: {available}"
        )

    def send_sms(
        self,
        ddd: str,
        phone: str,
        text: str,
        *,
        long_sms: bool = False,
        enable_answer: bool = False,
        schedule_sms: bool = False,
        schedule_date=None,
    ) -> ISendSendResult:
        try:
            token = self.token
        except ISendAuthServiceError as exc:
            raise ISendPermanentError(
                str(exc),
                error_code=exc.error_code or "1",
            ) from exc

        if not token:
            raise ISendPermanentError(
                "Token iSend não configurado (ISEND_TOKEN ou credenciais).",
                error_code="1",
            )

        if not text:
            raise ISendPermanentError("Campo text ausente.", error_code="2")

        long_sms_flag = 1 if long_sms or len(text) > 150 else 0

        sms_payload = {
            "cell_phone_ddd": ddd,
            "cell_phone": phone,
            "text": text,
            "long_sms": long_sms_flag,
            "enable_answer": 1 if enable_answer else 0,
            "schedule_sms": schedule_sms,
        }
        if schedule_date is not None:
            sms_payload["schedule_date"] = schedule_date

        request_payload = {
            "token": self.token,
            "sms": sms_payload,
        }

        try:
            client = self._get_client()
            operation = self._resolve_operation(client)
            try:
                raw = operation(arg0=request_payload)
            except TypeError:
                raw = operation(**request_payload)
        except Fault as exc:
            fault_msg = (getattr(exc, "message", None) or str(exc) or "").strip()
            if getattr(settings, "SMS_DEBUG_EXPOSE_ERRORS", False):
                logger.error("iSend SOAP fault: %s", fault_msg)
            else:
                logger.error("iSend SOAP fault during SMS send")
            if "token" in fault_msg.lower():
                raise ISendPermanentError(
                    "Token iSend inválido.",
                    error_code="1",
                ) from exc
            raise ISendTransientError("Falha SOAP ao enviar SMS.") from exc
        except TransportError as exc:
            logger.error("iSend transport error during SMS send")
            raise ISendTransientError("Timeout ou falha de comunicação com iSend.") from exc
        except ISendServiceError:
            raise
        except Exception as exc:
            logger.exception("Erro inesperado ao chamar iSend")
            raise ISendTransientError("Erro inesperado ao enviar SMS.") from exc

        return self._parse_response(raw)

    @staticmethod
    def _parse_response(raw: Any) -> ISendSendResult:
        if raw is None:
            return ISendSendResult(success=False, error_message="Resposta vazia do iSend.")

        if isinstance(raw, dict):
            data = raw
        else:
            data = {
                "success": getattr(raw, "success", None),
                "sms_ctr": getattr(raw, "sms_ctr", None),
                "contact_error": getattr(raw, "contact_error", None),
                "sms_error": getattr(raw, "sms_error", None),
            }

        success_val = data.get("success")
        success = str(success_val) == "1" or success_val is True or success_val == 1

        sms_error = data.get("sms_error")
        contact_error = data.get("contact_error")
        error_code = None
        error_message = None

        if sms_error is not None and str(sms_error).strip():
            error_code = str(sms_error).strip()
            error_message = ISEND_ERROR_CODES.get(error_code, f"Erro iSend ({error_code})")
        elif contact_error is not None and str(contact_error).strip():
            error_message = str(contact_error).strip()

        sms_ctr = data.get("sms_ctr")
        sms_ctr_str = str(sms_ctr).strip() if sms_ctr is not None else None

        return ISendSendResult(
            success=success,
            sms_ctr=sms_ctr_str if success else None,
            contact_error=str(contact_error) if contact_error else None,
            sms_error=str(sms_error) if sms_error else None,
            error_code=error_code,
            error_message=error_message,
        )
