from rest_framework.permissions import AllowAny


class HasIntegrationToken(AllowAny):
    """Mantido por compatibilidade; autenticação ocorre em IntegrationTokenAuthentication."""

    pass
