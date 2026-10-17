"""Unit tests for ISendSmsGateway error classification and token refresh."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from selection.candidate.isend import (
    ISendPermanentError,
    ISendSendResult,
    ISendTransientError,
)
from django.core import mail

from selection.candidate.sms import EmailOtpGateway, ISendSmsGateway, get_sms_gateway


def test_gateway_invalid_phone_is_permanent():
    gateway = ISendSmsGateway(service=MagicMock())
    with pytest.raises(ISendPermanentError, match="Telefone inválido"):
        gateway.send("99", "codigo 123")


def test_gateway_credit_error_is_permanent():
    service = MagicMock()
    service.send_sms.return_value = ISendSendResult(
        success=False,
        error_code="5",
        error_message="Crédito insuficiente",
    )
    gateway = ISendSmsGateway(service=service)

    with pytest.raises(ISendPermanentError) as exc_info:
        gateway.send("62999998888", "codigo 123")

    assert exc_info.value.error_code == "5"
    service.send_sms.assert_called_once()


def test_gateway_unknown_error_is_transient():
    service = MagicMock()
    service.send_sms.return_value = ISendSendResult(
        success=False,
        error_code="unknown",
        error_message="Falha temporária",
    )
    gateway = ISendSmsGateway(service=service)

    with pytest.raises(ISendTransientError):
        gateway.send("62999998888", "codigo 123")


@patch("selection.candidate.sms.get_isend_token")
def test_gateway_refreshes_token_on_code_1(mock_get_token):
    service = MagicMock()
    service.send_sms.side_effect = [
        ISendSendResult(success=False, error_code="1", error_message="Token inválido"),
        ISendSendResult(success=True, sms_ctr="CTR-NEW"),
    ]
    mock_get_token.return_value = "refreshed-token"
    gateway = ISendSmsGateway(service=service)

    ctr = gateway.send("62999998888", "codigo 123")

    assert ctr == "CTR-NEW"
    mock_get_token.assert_called_once_with(force_refresh=True)
    assert service.send_sms.call_count == 2


def test_email_gateway_sends_code_to_candidate_email(settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    settings.SMS_PROVIDER = "email"
    candidate = MagicMock(email="ana@example.com")

    gateway = get_sms_gateway(candidate)
    assert isinstance(gateway, EmailOtpGateway)
    gateway.send("62999998888", "seu codigo e 123456")

    assert mail.outbox[0].to == ["ana@example.com"]
    assert "123456" in mail.outbox[0].body
