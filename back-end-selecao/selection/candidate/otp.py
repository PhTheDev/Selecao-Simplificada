"""OTP generation and Redis-backed verification for SMS password reset."""

from __future__ import annotations

import hashlib
import hmac
import logging
import secrets
import uuid
from datetime import datetime, timezone as dt_timezone
from typing import Any, Literal

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

logger = logging.getLogger(__name__)

OTP_CACHE_PREFIX = "sms:verification"
COOLDOWN_PREFIX = "sms:verification:cooldown"

VerifyResult = Literal["ok", "invalid", "expired", "blocked"]


def normalize_phone(raw: str | None) -> str:
    if not raw:
        return ""
    return "".join(ch for ch in str(raw) if ch.isdigit())


def is_valid_phone_format(phone: str) -> bool:
    return bool(phone) and len(phone) in (10, 11) and phone.isdigit()


def split_phone(phone: str) -> tuple[str, str]:
    """Split Brazilian phone into DDD (2 digits) and local number."""
    normalized = normalize_phone(phone)
    if len(normalized) < 10:
        return "", normalized
    return normalized[:2], normalized[2:]


def phone_hash(phone: str) -> str:
    normalized = normalize_phone(phone)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def mask_phone(phone: str) -> str:
    normalized = normalize_phone(phone)
    if len(normalized) < 4:
        return "****"
    return f"{'*' * (len(normalized) - 4)}{normalized[-4:]}"


def _otp_key(verification_id: str) -> str:
    return f"{OTP_CACHE_PREFIX}:{verification_id}"


def _cooldown_key(phash: str) -> str:
    return f"{COOLDOWN_PREFIX}:{phash}"


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def _ttl() -> int:
    return int(getattr(settings, "SMS_VERIFICATION_TTL", 300))


def _otp_length() -> int:
    return int(getattr(settings, "SMS_VERIFICATION_LENGTH", 6))


def _max_attempts() -> int:
    return int(getattr(settings, "SMS_VERIFICATION_MAX_ATTEMPTS", 5))


def _cooldown_seconds() -> int:
    return int(getattr(settings, "SMS_VERIFICATION_RESEND_COOLDOWN", 60))


def generate_verification_id() -> str:
    return uuid.uuid4().hex


def generate_otp() -> str:
    length = _otp_length()
    upper = 10**length
    return str(secrets.randbelow(upper)).zfill(length)


def is_on_cooldown(phone: str) -> bool:
    phash = phone_hash(phone)
    return cache.get(_cooldown_key(phash)) is not None


def set_cooldown(phone: str) -> None:
    phash = phone_hash(phone)
    cache.set(_cooldown_key(phash), True, timeout=_cooldown_seconds())


def store_otp(
    verification_id: str,
    code: str,
    candidate_id: int,
    *,
    dummy: bool = False,
) -> None:
    now = timezone.now()
    expires_at = now + timezone.timedelta(seconds=_ttl())
    payload = {
        "code_hash": _hash_code(code),
        "candidate_id": candidate_id,
        "attempts": 0,
        "expires_at": expires_at.isoformat(),
        "dummy": dummy,
    }
    cache.set(_otp_key(verification_id), payload, timeout=_ttl())


def store_dummy_otp(verification_id: str) -> None:
    """Anti-enumeration placeholder — never validates."""
    dummy_code = secrets.token_hex(16)
    store_otp(verification_id, dummy_code, candidate_id=0, dummy=True)


def get_otp_payload(verification_id: str) -> dict[str, Any] | None:
    data = cache.get(_otp_key(verification_id))
    if not isinstance(data, dict):
        return None
    return data


def _remaining_ttl(expires_at_iso: str) -> int:
    try:
        expires_at = datetime.fromisoformat(expires_at_iso)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=dt_timezone.utc)
    except (TypeError, ValueError):
        return _ttl()

    remaining = int((expires_at - timezone.now()).total_seconds())
    return max(remaining, 1)


def verify_otp(verification_id: str, code: str) -> tuple[VerifyResult, int | None]:
    """
    Validate OTP for verification_id.

    Returns (result, candidate_id). candidate_id is set only when result == "ok".
    """
    key = _otp_key(verification_id)
    data = get_otp_payload(verification_id)
    if not data:
        return "expired", None

    if data.get("dummy"):
        return "invalid", None

    expires_at_iso = data.get("expires_at") or ""
    if expires_at_iso:
        try:
            expires_at = datetime.fromisoformat(expires_at_iso)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=dt_timezone.utc)
            if timezone.now() > expires_at:
                cache.delete(key)
                return "expired", None
        except (TypeError, ValueError):
            pass

    attempts = int(data.get("attempts", 0))
    if attempts >= _max_attempts():
        cache.delete(key)
        return "blocked", None

    expected = data.get("code_hash") or ""
    provided = _hash_code((code or "").strip())

    if not hmac.compare_digest(str(expected), provided):
        data["attempts"] = attempts + 1
        if data["attempts"] >= _max_attempts():
            cache.delete(key)
            return "blocked", None
        remaining = _remaining_ttl(expires_at_iso)
        cache.set(key, data, timeout=remaining)
        return "invalid", None

    candidate_id = data.get("candidate_id")
    cache.delete(key)
    if candidate_id is None or int(candidate_id) <= 0:
        return "invalid", None
    return "ok", int(candidate_id)


def clear_otp(verification_id: str) -> None:
    cache.delete(_otp_key(verification_id))
