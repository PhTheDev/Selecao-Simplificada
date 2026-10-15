"""Unit tests for password-reset SMS Celery task retry policy."""

from __future__ import annotations

from datetime import timedelta
from unittest.mock import MagicMock, patch

import pytest
from celery.exceptions import MaxRetriesExceededError, Retry
from django.core.cache import cache
from django.utils import timezone

from selection.candidate.isend import ISendPermanentError, ISendTransientError
from selection.candidate.models import Candidate, SMSVerification, SMSVerificationStatus
from selection.candidate.otp import get_otp_payload, phone_hash
from selection.tasks import send_password_reset_sms

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def candidate(db):
    return Candidate.objects.create(
        name="SMS Task Candidate",
        email="sms-task@test.com",
        phone="62999998888",
        email_verified=True,
    )


@pytest.fixture
def audit(candidate):
    return SMSVerification.objects.create(
        verification_id="verif-sms-task-1",
        phone_hash=phone_hash(candidate.phone),
        ddd="62",
        status=SMSVerificationStatus.PENDING,
        expires_at=timezone.now() + timedelta(seconds=300),
    )


def test_transient_error_retries_without_failing_audit(candidate, audit):
    gateway = MagicMock()
    gateway.send.side_effect = ISendTransientError("Timeout ou falha de comunicação com iSend.")

    with (
        patch("selection.candidate.sms.get_sms_gateway", return_value=gateway),
        patch.object(send_password_reset_sms, "retry", side_effect=Retry()) as mock_retry,
        pytest.raises(Retry),
    ):
        send_password_reset_sms(audit.verification_id, candidate.id, candidate.phone)

    mock_retry.assert_called_once()
    retry_kwargs = mock_retry.call_args.kwargs
    assert retry_kwargs["args"][0] == audit.verification_id
    assert retry_kwargs["args"][3]  # same OTP reused on retry

    audit.refresh_from_db()
    assert audit.status == SMSVerificationStatus.PENDING
    assert get_otp_payload(audit.verification_id) is not None


def test_permanent_credit_error_fails_without_retry(candidate, audit):
    gateway = MagicMock()
    gateway.send.side_effect = ISendPermanentError(
        "Crédito insuficiente",
        error_code="5",
    )

    with (
        patch("selection.candidate.sms.get_sms_gateway", return_value=gateway),
        patch.object(send_password_reset_sms, "retry") as mock_retry,
    ):
        result = send_password_reset_sms(audit.verification_id, candidate.id, candidate.phone)

    mock_retry.assert_not_called()
    assert result == {"success": False, "error": "isend_failure"}
    audit.refresh_from_db()
    assert audit.status == SMSVerificationStatus.FAILED
    assert audit.error_code == "5"
    assert get_otp_payload(audit.verification_id) is None


def test_retries_exhausted_marks_failed_and_clears_otp(candidate, audit):
    gateway = MagicMock()
    gateway.send.side_effect = ISendTransientError("Timeout ou falha de comunicação com iSend.")

    with (
        patch("selection.candidate.sms.get_sms_gateway", return_value=gateway),
        patch.object(
            send_password_reset_sms,
            "retry",
            side_effect=MaxRetriesExceededError(),
        ),
    ):
        result = send_password_reset_sms(audit.verification_id, candidate.id, candidate.phone)

    assert result == {"success": False, "error": "isend_failure"}
    audit.refresh_from_db()
    assert audit.status == SMSVerificationStatus.FAILED
    assert get_otp_payload(audit.verification_id) is None


def test_success_after_retry_reuses_otp_and_marks_sent(candidate, audit):
    gateway = MagicMock()
    gateway.send.side_effect = ISendTransientError("Timeout ou falha de comunicação com iSend.")

    with (
        patch("selection.candidate.sms.get_sms_gateway", return_value=gateway),
        patch.object(send_password_reset_sms, "retry", side_effect=Retry()) as mock_retry,
        pytest.raises(Retry),
    ):
        send_password_reset_sms(audit.verification_id, candidate.id, candidate.phone)

    code = mock_retry.call_args.kwargs["args"][3]
    gateway.send.side_effect = None
    gateway.send.return_value = "CTR-1"

    with patch("selection.candidate.sms.get_sms_gateway", return_value=gateway):
        result = send_password_reset_sms(
            audit.verification_id,
            candidate.id,
            candidate.phone,
            code,
        )

    assert result == {"success": True, "verification_id": audit.verification_id}
    audit.refresh_from_db()
    assert audit.status == SMSVerificationStatus.SENT
    assert audit.sms_ctr == "CTR-1"
    sent_message = gateway.send.call_args.args[1]
    assert code in sent_message
