"""Unit tests for iSend authentication service."""

from __future__ import annotations

import hashlib
from unittest.mock import MagicMock, patch

import pytest
from django.core.cache import cache

from selection.candidate.isend_auth import (
    ISendAuthService,
    ISendAuthServiceError,
    TOKEN_CACHE_KEY,
    TOKEN_OBTAINED_AT_CACHE_KEY,
    get_isend_token,
    hash_password_md5,
    to_isend_password_digest,
)


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


def test_hash_password_md5_lowercase_hex():
    digest = hash_password_md5("senha123")
    assert len(digest) == 32
    assert digest == digest.lower()
    assert digest == hashlib.md5(b"senha123").hexdigest()


def test_hash_password_md5_never_plaintext_in_payload():
    service = ISendAuthService(username="user", password="plain-secret")
    payload = service._build_login_payload(hash_password_md5("plain-secret"))
    assert payload["password"] == hash_password_md5("plain-secret")
    assert "plain-secret" not in payload.values()


def test_to_isend_password_digest_accepts_pre_hashed_md5():
    digest = hash_password_md5("senha123")
    assert to_isend_password_digest(digest) == digest
    assert to_isend_password_digest("senha123") == digest


@patch.object(ISendAuthService, "_get_client")
def test_authenticate_get_access_token_uses_plain_password(mock_get_client):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client
    mock_client.service.getAccessToken = MagicMock()

    service = ISendAuthService(username="user", password="plain-secret")
    with patch.object(
        service,
        "_authenticate_get_access_token",
        return_value={"accessToken": "abc-session"},
    ) as mock_auth:
        result = service.authenticate(force_refresh=True)

    mock_auth.assert_called_once_with(mock_client, "plain-secret")
    assert result.success is True
    assert result.token == "abc-session"
    assert cache.get(TOKEN_CACHE_KEY) == "abc-session"


@patch.object(ISendAuthService, "_get_client")
def test_authenticate_uses_cached_token(mock_get_client):
    cache.set(TOKEN_CACHE_KEY, "cached-token", timeout=3600)
    cache.set(TOKEN_OBTAINED_AT_CACHE_KEY, "2099-01-01T00:00:00+00:00", timeout=3600)

    service = ISendAuthService(username="user", password="secret")
    result = service.authenticate()

    assert result.success is True
    assert result.token == "cached-token"
    mock_get_client.assert_not_called()


@patch.object(ISendAuthService, "_get_client")
def test_is_token_valid_remote(mock_get_client):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client
    mock_client.service.validateToken.return_value = {"valid": "1"}

    service = ISendAuthService(username="user", password="secret")
    assert service.is_token_valid("tok-123", remote=True) is True


@patch.object(ISendAuthService, "_get_client")
def test_is_token_valid_remote_failure(mock_get_client):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client
    mock_client.service.validateToken.return_value = {"valid": "0"}

    service = ISendAuthService(username="user", password="secret")
    assert service.is_token_valid("tok-bad", remote=True) is False


def test_get_isend_token_prefers_static_token(settings):
    settings.ISEND_TOKEN = "static-token"
    settings.ISEND_USERNAME = "api-user"
    settings.ISEND_PASSWORD = "api-pass"

    assert get_isend_token() == "static-token"


def test_get_isend_token_uses_credentials_when_no_static(settings):
    settings.ISEND_TOKEN = ""
    settings.ISEND_USERNAME = "api-user"
    settings.ISEND_PASSWORD = "api-pass"

    with patch.object(ISendAuthService, "get_token", return_value="dynamic-token") as mock_get:
        token = get_isend_token()

    assert token == "dynamic-token"
    mock_get.assert_called_once()


def test_get_isend_token_missing_credentials(settings):
    settings.ISEND_TOKEN = ""
    settings.ISEND_USERNAME = ""
    settings.ISEND_PASSWORD = ""

    with pytest.raises(ISendAuthServiceError, match="ISEND_TOKEN"):
        get_isend_token()


def test_invalidate_token():
    cache.set(TOKEN_CACHE_KEY, "x", timeout=60)
    cache.set(TOKEN_OBTAINED_AT_CACHE_KEY, "y", timeout=60)

    ISendAuthService(username="u", password="p").invalidate_token()

    assert cache.get(TOKEN_CACHE_KEY) is None
    assert cache.get(TOKEN_OBTAINED_AT_CACHE_KEY) is None
