"""Unit tests for OTP generation and Redis-backed verification."""

from __future__ import annotations

import re
from unittest.mock import patch

import pytest
from django.core.cache import cache

from selection.candidate.otp import (
    _hash_code,
    generate_otp,
    generate_verification_id,
    get_otp_payload,
    is_on_cooldown,
    set_cooldown,
    store_dummy_otp,
    store_otp,
    verify_otp,
)


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


def test_generate_otp_has_six_digits():
    code = generate_otp()
    assert re.fullmatch(r"\d{6}", code)


def test_generate_otp_can_start_with_zero():
    with patch("selection.candidate.otp.secrets.randbelow", return_value=4821):
        assert generate_otp() == "004821"


def test_generate_otp_is_not_constant():
    codes = {generate_otp() for _ in range(20)}
    assert len(codes) > 1


def test_store_and_verify_success():
    vid = generate_verification_id()
    code = "483921"
    store_otp(vid, code, candidate_id=42)

    payload = get_otp_payload(vid)
    assert payload is not None
    assert payload["code_hash"] == _hash_code(code)
    assert payload["attempts"] == 0

    result, candidate_id = verify_otp(vid, code)
    assert result == "ok"
    assert candidate_id == 42
    assert get_otp_payload(vid) is None


def test_verify_wrong_code_increments_attempts():
    vid = generate_verification_id()
    store_otp(vid, "111111", candidate_id=1)

    result, _ = verify_otp(vid, "000000")
    assert result == "invalid"

    payload = get_otp_payload(vid)
    assert payload is not None
    assert payload["attempts"] == 1


def test_verify_blocks_after_max_attempts(settings):
    settings.SMS_VERIFICATION_MAX_ATTEMPTS = 5
    vid = generate_verification_id()
    store_otp(vid, "111111", candidate_id=1)

    for _ in range(5):
        result, _ = verify_otp(vid, "000000")

    assert result == "blocked"
    assert get_otp_payload(vid) is None


def test_expired_code_returns_expired():
    vid = generate_verification_id()
    store_otp(vid, "111111", candidate_id=1)

    payload = get_otp_payload(vid)
    assert payload is not None
    payload["expires_at"] = "2000-01-01T00:00:00+00:00"
    cache.set(f"sms:verification:{vid}", payload, timeout=300)

    result, candidate_id = verify_otp(vid, "111111")
    assert result == "expired"
    assert candidate_id is None


def test_dummy_otp_never_validates():
    vid = generate_verification_id()
    store_dummy_otp(vid)

    result, candidate_id = verify_otp(vid, "123456")
    assert result == "invalid"
    assert candidate_id is None


def test_cooldown_blocks_resend():
    phone = "62999999999"
    assert not is_on_cooldown(phone)
    set_cooldown(phone)
    assert is_on_cooldown(phone)


def test_cooldown_allows_after_ttl(settings):
    settings.SMS_VERIFICATION_RESEND_COOLDOWN = 1
    phone = "62999999999"
    set_cooldown(phone)
    assert is_on_cooldown(phone)

    import time

    time.sleep(1.1)
    assert not is_on_cooldown(phone)
