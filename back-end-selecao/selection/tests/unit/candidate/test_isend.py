"""Unit tests for iSend SOAP service (mocked)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from zeep.exceptions import Fault, TransportError

from selection.candidate.isend import (
    ISendPermanentError,
    ISendSendResult,
    ISendService,
    ISendTransientError,
    classify_isend_failure,
)


@pytest.fixture
def service():
    return ISendService(token="test-token", wsdl="http://example.test/wsdl")


def test_parse_response_success():
    raw = {"success": "1", "sms_ctr": "ABC123", "sms_error": None, "contact_error": None}
    result = ISendService._parse_response(raw)
    assert result.success is True
    assert result.sms_ctr == "ABC123"


def test_parse_response_token_invalid():
    raw = {"success": "0", "sms_error": "1", "contact_error": None}
    result = ISendService._parse_response(raw)
    assert result.success is False
    assert result.error_code == "1"
    assert "Token" in (result.error_message or "")


def test_parse_response_insufficient_credit():
    raw = {"success": "0", "sms_error": "5"}
    result = ISendService._parse_response(raw)
    assert result.error_code == "5"
    assert "Crédito" in (result.error_message or "")


@patch.object(ISendService, "_get_client")
def test_send_sms_success(mock_get_client, service):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client
    mock_client.service.unitarySms.return_value = {
        "success": "1",
        "sms_ctr": "CTR-99",
        "sms_error": None,
        "contact_error": None,
    }

    result = service.send_sms("62", "999999999", "Test message")
    assert result.success is True
    assert result.sms_ctr == "CTR-99"
    mock_client.service.unitarySms.assert_called_once()


@patch.object(ISendService, "_get_client")
def test_send_sms_soap_fault(mock_get_client, service):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client
    mock_client.service.unitarySms.side_effect = Fault("SOAP fault")

    with pytest.raises(ISendTransientError, match="SOAP"):
        service.send_sms("62", "999999999", "Test")


@patch.object(ISendService, "_get_client")
def test_send_sms_invalid_token_fault_is_permanent(mock_get_client, service):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client
    mock_client.service.unitarySms.side_effect = Fault("O Token informado não é válido.")

    with pytest.raises(ISendPermanentError, match="Token") as exc_info:
        service.send_sms("62", "999999999", "Test")
    assert exc_info.value.error_code == "1"


@patch.object(ISendService, "_get_client")
def test_send_sms_transport_error(mock_get_client, service):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client
    mock_client.service.unitarySms.side_effect = TransportError("timeout")

    with pytest.raises(ISendTransientError, match="Timeout"):
        service.send_sms("62", "999999999", "Test")


def test_send_sms_missing_token():
    svc = ISendService(token="", wsdl="http://example.test/wsdl", resolve_token=False)
    with pytest.raises(ISendPermanentError, match="Token iSend"):
        svc.send_sms("62", "999999999", "Test")


def test_send_sms_missing_text():
    svc = ISendService(token="tok", wsdl="http://example.test/wsdl")
    with pytest.raises(ISendPermanentError, match="text"):
        svc.send_sms("62", "999999999", "")


def test_classify_isend_failure_permanent_credit():
    exc = classify_isend_failure("Crédito insuficiente", error_code="5")
    assert isinstance(exc, ISendPermanentError)
    assert exc.error_code == "5"


def test_classify_isend_failure_contact_error_is_permanent():
    exc = classify_isend_failure("Número inválido", contact_error="invalid")
    assert isinstance(exc, ISendPermanentError)


def test_classify_isend_failure_unknown_is_transient():
    exc = classify_isend_failure("Falha temporária", error_code="unknown")
    assert isinstance(exc, ISendTransientError)
