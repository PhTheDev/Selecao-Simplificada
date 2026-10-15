import secrets

from django.contrib.auth.models import AnonymousUser
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from integration.models import IntegrationToken


def extract_integration_token(request) -> str:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:].strip()
    if auth_header.strip():
        # Compatível com Authorization: <token> (sem Bearer), conforme guia externo
        return auth_header.strip()
    return (request.headers.get("X-Integration-Token") or "").strip()


class IntegrationTokenAuthentication(BaseAuthentication):
    www_authenticate_header = "Bearer"

    def authenticate(self, request):
        expected = IntegrationToken.get_active_token_value()
        if not expected:
            raise AuthenticationFailed(
                "Integração externa não configurada. Cadastre um token ativo no Django Admin."
            )

        provided = extract_integration_token(request)
        if not provided:
            raise AuthenticationFailed("Token de integração ausente.")

        if not secrets.compare_digest(provided, expected):
            raise AuthenticationFailed("Token de integração inválido.")

        return (AnonymousUser(), None)
