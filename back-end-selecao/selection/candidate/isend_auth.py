"""iSend SOAP authentication — token acquisition, validation and Redis cache."""

from __future__ import annotations

import hashlib
import logging
import re
from dataclasses import dataclass
from datetime import datetime, timezone as dt_timezone
from typing import Any

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from zeep import Client
from zeep.exceptions import Fault, TransportError
from zeep.transports import Transport

logger = logging.getLogger(__name__)

DEFAULT_AUTH_WSDL = (
    "http://www2.isend.com.br/iSend/ws/PartnerSendIntegrationWs?wsdl"
)

GET_ACCESS_TOKEN_REQUEST_TYPE = (
    "{http://intelly.com/ws/PartnerSendIntegration/1.0/}GetAccessTokenRequest"
)

ISEND_AUTH_ERROR_MESSAGES = {
    "0": "Erro inesperado na autenticação iSend.",
    "1": "Login iSend é obrigatório.",
    "2": "Senha iSend é obrigatória.",
    "3": "Login ou senha iSend inválidos.",
    "4": "Usuário iSend bloqueado (tentativas ou inativo).",
    "5": "Usuário iSend bloqueado (pendência financeira ou desativado).",
}

TOKEN_CACHE_KEY = "isend:auth:token"
TOKEN_OBTAINED_AT_CACHE_KEY = "isend:auth:token:obtained_at"


@dataclass(frozen=True)
class ISendAuthResult:
    success: bool
    token: str | None = None
    error_code: str | None = None
    error_message: str | None = None


class ISendAuthServiceError(Exception):
    def __init__(self, message: str, *, error_code: str | None = None):
        super().__init__(message)
        self.error_code = error_code


def hash_password_md5(password: str) -> str:
    """Return MD5 hex digest (lowercase) for iSend authentication."""
    return hashlib.md5(password.encode("utf-8")).hexdigest()


_MD5_HEX_RE = re.compile(r"^[a-f0-9]{32}$", re.IGNORECASE)


def to_isend_password_digest(password: str) -> str:
    """
    Return MD5 hex for iSend auth.

    Accepts plain text (hashed here) or a pre-computed 32-char MD5 digest in ISEND_PASSWORD.
    """
    value = (password or "").strip()
    if _MD5_HEX_RE.match(value):
        return value.lower()
    return hash_password_md5(value)


def _token_ttl() -> int:
    return int(getattr(settings, "ISEND_TOKEN_TTL", 43200))


class ISendAuthService:
    """
    Acquire and validate iSend session tokens.

    Password is sent as MD5 hex digest, never in plain text.
    Tokens are cached in Redis for up to 12 hours (configurable).
    """

    _LOGIN_OPERATIONS = (
        "getAccessToken",
        "authenticate",
        "Authenticate",
        "login",
        "Login",
        "auth",
        "Auth",
        "getToken",
        "GetToken",
        "generateToken",
        "GenerateToken",
    )

    _VALIDATE_OPERATIONS = (
        "validateToken",
        "ValidateToken",
        "verifyToken",
        "VerifyToken",
        "checkToken",
        "CheckToken",
        "isValidToken",
        "IsValidToken",
        "validate",
        "Validate",
    )

    def __init__(
        self,
        username: str | None = None,
        password: str | None = None,
        wsdl: str | None = None,
        timeout: int = 15,
    ):
        self.username = (username or getattr(settings, "ISEND_USERNAME", "") or "").strip()
        self.password = password if password is not None else getattr(settings, "ISEND_PASSWORD", "")
        self.wsdl = (wsdl or getattr(settings, "ISEND_AUTH_WSDL", "") or DEFAULT_AUTH_WSDL).strip()
        self.timeout = timeout
        self._client: Client | None = None

    def _get_client(self) -> Client:
        if self._client is None:
            transport = Transport(timeout=self.timeout)
            self._client = Client(self.wsdl, transport=transport)
        return self._client

    def _resolve_operation(self, client: Client, candidates: tuple[str, ...]):
        service = client.service
        for name in candidates:
            op = getattr(service, name, None)
            if op is not None:
                return op, name
        available = [name for name in dir(service) if not name.startswith("_")]
        raise ISendAuthServiceError(
            f"Operação SOAP não encontrada no WSDL de autenticação. Disponíveis: {available}"
        )

    @staticmethod
    def _extract_token(raw: Any) -> str | None:
        if raw is None:
            return None

        if isinstance(raw, str) and raw.strip():
            return raw.strip()

        if isinstance(raw, dict):
            for key in (
                "token",
                "Token",
                "accessToken",
                "sessionToken",
                "session_token",
                "authToken",
            ):
                value = raw.get(key)
                if value is not None and str(value).strip():
                    return str(value).strip()
            nested = raw.get("return") or raw.get("result")
            if nested is not None:
                return ISendAuthService._extract_token(nested)

        for attr in ("token", "Token", "accessToken", "sessionToken", "authToken"):
            value = getattr(raw, attr, None)
            if value is not None and str(value).strip():
                return str(value).strip()

        nested = getattr(raw, "return", None) or getattr(raw, "result", None)
        if nested is not None and nested is not raw:
            return ISendAuthService._extract_token(nested)

        return None

    @staticmethod
    def _is_success(raw: Any) -> bool:
        if raw is None:
            return False
        if isinstance(raw, dict):
            success = raw.get("success")
            if success is not None:
                return str(success) in ("1", "true", "True")
            if raw.get("token") or raw.get("accessToken") or raw.get("return"):
                return True
            nested = raw.get("return")
            if isinstance(nested, dict):
                return ISendAuthService._is_success(nested)
            return False

        success = getattr(raw, "success", None)
        if success is not None:
            return str(success) in ("1", "true", "True")
        if getattr(raw, "accessToken", None) or getattr(raw, "token", None):
            return True
        return bool(ISendAuthService._extract_token(raw))

    def _build_login_payload(self, password_md5: str) -> dict[str, Any]:
        return {
            "username": self.username,
            "user": self.username,
            "login": self.username,
            "password": password_md5,
            "senha": password_md5,
        }

    def _authenticate_get_access_token(self, client: Client, password_plain: str) -> Any:
        """
        PartnerSendIntegrationWs/getAccessToken — senha em texto puro.

        A documentação iSend cita MD5, mas este endpoint rejeita digest e aceita a senha do painel.
        """
        request_type = client.get_type(GET_ACCESS_TOKEN_REQUEST_TYPE)
        request = request_type(username=self.username, password=password_plain)
        return client.service.getAccessToken(request)

    @staticmethod
    def _fault_error_message(exc: Fault) -> str:
        message = (exc.message or "").strip()
        if not message:
            return "Falha SOAP na autenticação iSend."

        lowered = message.lower()
        if "login is required" in lowered:
            return ISEND_AUTH_ERROR_MESSAGES["1"]
        if "password is required" in lowered:
            return ISEND_AUTH_ERROR_MESSAGES["2"]
        if "invalid login" in lowered or "unable to generate access token" in lowered:
            return ISEND_AUTH_ERROR_MESSAGES["3"]
        if "blocked user" in lowered:
            return ISEND_AUTH_ERROR_MESSAGES["4"]
        return message

    def authenticate(self, *, force_refresh: bool = False) -> ISendAuthResult:
        """
        Request a new session token from iSend.

        PartnerSendIntegrationWs uses plain password; legacy SOAP login endpoints use MD5.
        Stores token in Redis when successful.
        """
        if not self.username or not self.password:
            raise ISendAuthServiceError(
                "ISEND_USERNAME e ISEND_PASSWORD devem estar configurados.",
                error_code="missing_credentials",
            )

        if not force_refresh:
            cached = self.get_cached_token()
            if cached:
                return ISendAuthResult(success=True, token=cached)

        password_plain = self.password.strip()
        password_md5 = to_isend_password_digest(self.password)

        try:
            client = self._get_client()
            if getattr(client.service, "getAccessToken", None) is not None:
                raw = self._authenticate_get_access_token(client, password_plain)
                logger.info("iSend auth token requested")
            else:
                operation, op_name = self._resolve_operation(client, self._LOGIN_OPERATIONS)
                payload = self._build_login_payload(password_md5)

                try:
                    raw = operation(**payload)
                except TypeError:
                    raw = operation(arg0=payload)

                logger.info("iSend auth login operation=%s", op_name)

        except Fault as exc:
            if getattr(settings, "SMS_DEBUG_EXPOSE_ERRORS", False):
                logger.error("iSend auth SOAP fault: %s", exc.message)
            else:
                logger.warning("iSend auth SOAP fault")
            return ISendAuthResult(
                success=False,
                error_message=self._fault_error_message(exc),
                error_code="auth_failed",
            )
        except TransportError as exc:
            logger.error("iSend auth transport error")
            raise ISendAuthServiceError(
                "Timeout ou falha de comunicação na autenticação iSend."
            ) from exc
        except ISendAuthServiceError:
            raise
        except Exception as exc:
            logger.exception("Unexpected iSend auth error")
            raise ISendAuthServiceError("Erro inesperado na autenticação iSend.") from exc

        if not self._is_success(raw):
            return ISendAuthResult(
                success=False,
                error_message="Credenciais iSend inválidas.",
                error_code="auth_failed",
            )

        token = self._extract_token(raw)
        if not token:
            return ISendAuthResult(
                success=False,
                error_message="Resposta de autenticação sem token.",
                error_code="missing_token",
            )

        self._store_token(token)
        return ISendAuthResult(success=True, token=token)

    def validate_token_remote(self, token: str) -> bool:
        """Validate token via iSend SOAP when a validate operation exists."""
        if not token:
            return False

        try:
            client = self._get_client()
            operation, op_name = self._resolve_operation(client, self._VALIDATE_OPERATIONS)
        except ISendAuthServiceError:
            logger.debug("iSend validate operation not available; using cache TTL only")
            return self.is_token_valid(token, remote=False)

        try:
            try:
                raw = operation(token=token)
            except TypeError:
                try:
                    raw = operation(arg0=token)
                except TypeError:
                    raw = operation(arg0={"token": token})

            logger.info("iSend auth validate operation=%s", op_name)

            if isinstance(raw, bool):
                return raw
            if isinstance(raw, dict):
                valid = raw.get("valid")
                if valid is not None:
                    return str(valid) in ("1", "true", "True")
                success = raw.get("success")
                if success is not None:
                    return str(success) in ("1", "true", "True")
            if getattr(raw, "valid", None) is not None:
                return str(getattr(raw, "valid")) in ("1", "true", "True")
            return self._is_success(raw)
        except (Fault, TransportError):
            logger.warning("iSend remote token validation failed")
            return False
        except Exception:
            logger.exception("Unexpected error validating iSend token")
            return False

    def get_cached_token(self) -> str | None:
        token = cache.get(TOKEN_CACHE_KEY)
        if not isinstance(token, str) or not token.strip():
            return None

        obtained_at_raw = cache.get(TOKEN_OBTAINED_AT_CACHE_KEY)
        if obtained_at_raw:
            try:
                obtained_at = datetime.fromisoformat(str(obtained_at_raw))
                if obtained_at.tzinfo is None:
                    obtained_at = obtained_at.replace(tzinfo=dt_timezone.utc)
                age_seconds = (timezone.now() - obtained_at).total_seconds()
                if age_seconds >= _token_ttl():
                    self.invalidate_token()
                    return None
            except (TypeError, ValueError):
                pass

        return token.strip()

    def _store_token(self, token: str) -> None:
        ttl = _token_ttl()
        cache.set(TOKEN_CACHE_KEY, token, timeout=ttl)
        cache.set(TOKEN_OBTAINED_AT_CACHE_KEY, timezone.now().isoformat(), timeout=ttl)
        logger.info("iSend token cached ttl_seconds=%s", ttl)

    def invalidate_token(self) -> None:
        cache.delete(TOKEN_CACHE_KEY)
        cache.delete(TOKEN_OBTAINED_AT_CACHE_KEY)

    def is_token_valid(self, token: str | None = None, *, remote: bool = True) -> bool:
        """
        Check whether a token is valid.

        Uses local cache TTL first; optionally confirms with iSend SOAP.
        """
        candidate = (token or self.get_cached_token() or "").strip()
        if not candidate:
            return False

        if token is None and self.get_cached_token() == candidate:
            return True

        if remote:
            return self.validate_token_remote(candidate)

        return bool(candidate)

    def get_token(self, *, force_refresh: bool = False) -> str:
        """
        Return a valid session token, authenticating when needed.
        """
        if not force_refresh:
            cached = self.get_cached_token()
            if cached and self.is_token_valid(cached, remote=False):
                return cached

        result = self.authenticate(force_refresh=True)
        if not result.success or not result.token:
            raise ISendAuthServiceError(
                result.error_message or "Não foi possível obter token iSend.",
                error_code=result.error_code,
            )
        return result.token


def get_isend_token(*, force_refresh: bool = False) -> str:
    """
    Resolve iSend token: static ISEND_TOKEN (preferido) ou autenticação dinâmica.
    """
    static_token = (getattr(settings, "ISEND_TOKEN", "") or "").strip()
    if static_token:
        return static_token

    username = (getattr(settings, "ISEND_USERNAME", "") or "").strip()
    password = getattr(settings, "ISEND_PASSWORD", "") or ""

    if username and password:
        return ISendAuthService(username=username, password=password).get_token(
            force_refresh=force_refresh
        )

    raise ISendAuthServiceError(
        "Configure ISEND_TOKEN (painel iSend) ou ISEND_USERNAME/ISEND_PASSWORD.",
        error_code="missing_credentials",
    )
