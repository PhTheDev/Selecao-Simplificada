"""API tests for password reset via SMS."""

from __future__ import annotations

from unittest.mock import patch

import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from selection.candidate.models import Candidate, SMSVerification, SMSVerificationStatus
from selection.candidate.otp import get_otp_payload, store_otp

pytestmark = pytest.mark.django_db

REQUEST_URL = "/api/selection/candidates/password_reset_sms_request/"
VERIFY_URL = "/api/selection/candidates/password_reset_sms_verify/"


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def candidate_with_phone(db):
    return Candidate.objects.create(
        name="Test Candidate",
        email="sms@test.com",
        phone="62999998888",
        email_verified=True,
    )


def test_request_returns_verification_id(api_client, candidate_with_phone):
    response = api_client.post(REQUEST_URL, {"phone": "62999998888"}, format="json")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["verification_id"]
    assert data["expires_in"] == 300

    audit = SMSVerification.objects.get(verification_id=data["verification_id"])
    assert audit.status == SMSVerificationStatus.SENT


def test_request_unknown_phone_still_200(api_client):
    response = api_client.post(REQUEST_URL, {"phone": "62999997777"}, format="json")
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert SMSVerification.objects.count() == 0


def test_request_cooldown_returns_429(api_client, candidate_with_phone):
    first = api_client.post(REQUEST_URL, {"phone": "62999998888"}, format="json")
    assert first.status_code == 200

    second = api_client.post(REQUEST_URL, {"phone": "62999998888"}, format="json")
    assert second.status_code == 429
    assert second.json()["code"] == "RESEND_COOLDOWN"


def test_verify_success_returns_reset_token(api_client, candidate_with_phone):
    request = api_client.post(REQUEST_URL, {"phone": "62999998888"}, format="json")
    verification_id = request.json()["verification_id"]

    store_otp(verification_id, "123456", candidate_with_phone.id)

    response = api_client.post(
        VERIFY_URL,
        {"verification_id": verification_id, "code": "123456"},
        format="json",
    )
    assert response.status_code == 200
    assert "reset_token" in response.json()

    audit = SMSVerification.objects.get(verification_id=verification_id)
    assert audit.status == SMSVerificationStatus.VERIFIED


def test_verify_invalid_code(api_client, candidate_with_phone):
    request = api_client.post(REQUEST_URL, {"phone": "62999998888"}, format="json")
    verification_id = request.json()["verification_id"]
    store_otp(verification_id, "123456", candidate_with_phone.id)

    response = api_client.post(
        VERIFY_URL,
        {"verification_id": verification_id, "code": "000000"},
        format="json",
    )
    assert response.status_code == 400
    assert response.json()["error"]


def test_verify_expired_code(api_client, candidate_with_phone):
    verification_id = "expired1234567890abcdef"
    SMSVerification.objects.create(
        verification_id=verification_id,
        phone_hash="abc",
        ddd="62",
        status=SMSVerificationStatus.PENDING,
        expires_at=candidate_with_phone.created_at,
    )

    response = api_client.post(
        VERIFY_URL,
        {"verification_id": verification_id, "code": "123456"},
        format="json",
    )
    assert response.status_code == 400
    assert response.json()["code"] == "CODE_EXPIRED"


@patch("selection.candidate.views.send_password_reset_sms.delay")
def test_request_enqueues_celery(mock_delay, api_client, candidate_with_phone):
    response = api_client.post(REQUEST_URL, {"phone": "62999998888"}, format="json")
    assert response.status_code == 200
    mock_delay.assert_called_once()
    args = mock_delay.call_args[0]
    assert args[1] == candidate_with_phone.id
    assert args[2] == "62999998888"


def test_otp_not_in_audit_model(api_client, candidate_with_phone):
    response = api_client.post(REQUEST_URL, {"phone": "62999998888"}, format="json")
    verification_id = response.json()["verification_id"]
    store_otp(verification_id, "654321", candidate_with_phone.id)

    audit = SMSVerification.objects.get(verification_id=verification_id)
    for field in audit._meta.fields:
        value = getattr(audit, field.name)
        if isinstance(value, str):
            assert "654321" not in value

    payload = get_otp_payload(verification_id)
    assert payload is not None
    assert "654321" not in str(payload)
