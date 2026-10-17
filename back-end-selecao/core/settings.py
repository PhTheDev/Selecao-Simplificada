# Criado e Desenvolvido por Pedro Henrique Faria dos Santos Soares 2025

from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv  # type: ignore

# Carregar variáveis do .env
load_dotenv()

# Caminho base do projeto
BASE_DIR = Path(__file__).resolve().parent.parent

# ==========================
# ⚙️ Configurações básicas
# ==========================

from django.core.exceptions import ImproperlyConfigured

# Defaults inseguros conhecidos — rejeitados quando DEBUG=False
_INSECURE_SECRET_KEYS = frozenset(
    {
        "dev-secret-key",
        "selecao-local-secret-key",
        "django-insecure-i^obb0)s8b$l(fwo1zq0abporleq=*_fq5mrqfyi7ym%xig@ax",
    }
)

_INSECURE_DB_PASSWORDS = frozenset(
    {
        "selecao-local_pass",
        "CHANGE_ME",
    }
)


def _resolve_db_password(debug: bool, raw: str | None) -> str:
    """Valida DB_PASSWORD; defaults de lab só com DEBUG=True."""
    value = (raw or "").strip()
    if not value:
        if debug:
            return "selecao-local_pass"
        raise ImproperlyConfigured(
            "DB_PASSWORD é obrigatória quando DEBUG=False. Defina a variável de ambiente DB_PASSWORD."
        )
    if not debug and value in _INSECURE_DB_PASSWORDS:
        raise ImproperlyConfigured(
            "DB_PASSWORD não pode ser um valor padrão inseguro com DEBUG=False."
        )
    return value

# Produção: DEBUG deve ser False por omissão (definir DEBUG=True explicitamente no .env local)
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1")

_secret_key = (os.getenv("SECRET_KEY") or "").strip()
if not _secret_key:
    if DEBUG:
        _secret_key = "dev-secret-key"
    else:
        raise ImproperlyConfigured(
            "SECRET_KEY é obrigatória quando DEBUG=False. Defina a variável de ambiente SECRET_KEY."
        )
elif not DEBUG and _secret_key in _INSECURE_SECRET_KEYS:
    raise ImproperlyConfigured(
        "SECRET_KEY não pode ser um valor padrão inseguro com DEBUG=False. Gere uma chave forte."
    )
SECRET_KEY = _secret_key

def _split_hosts(value: str) -> list[str]:
    return [h.strip() for h in value.split(",") if h.strip()]


ALLOWED_HOSTS = [
    "localhost",
    "localhost",
    "127.0.0.1",
] + _split_hosts(os.getenv("ALLOWED_HOSTS", "127.0.0.1,127.0.0.1"))

# Next.js (rewrite /media → Django) ou outros clientes na rede Docker chamam pelo nome do serviço.
if os.path.exists("/.dockerenv"):
    _docker_app_host = f"app_{os.getenv('APP_CONTAINER_NAME', 'selecao_system')}"
    if _docker_app_host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(_docker_app_host)

# ==========================
# 🧩 Aplicações instaladas
# ==========================

INSTALLED_APPS = [
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Terceiros
    "rest_framework",
    "corsheaders",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "social_django",
    'drf_spectacular',
    'celery',
    'django_celery_beat',

    # Apps locais
    "selection",
    "administrator",
    "integration",
]

# ==========================
# 🧱 Middleware
# ==========================

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, 'templates')],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "social_django.context_processors.backends",
                "social_django.context_processors.login_redirect",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"

# ==========================
# 🗄️ Banco de dados
# ==========================

# Detecta automaticamente se está rodando dentro do Docker
IN_DOCKER = os.path.exists("/.dockerenv")

_db_password = _resolve_db_password(DEBUG, os.getenv("DB_PASSWORD"))

if DEBUG:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME", "selecao-local_db"),
            "USER": os.getenv("DB_USER", "selecao-local_user"),
            "PASSWORD": _db_password,
            "HOST": os.getenv("DB_HOST", "db_postgres" if IN_DOCKER else "localhost"),
            "PORT": os.getenv("DB_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME"),
            "USER": os.getenv("DB_USER"),
            "PASSWORD": _db_password,
            "HOST": os.getenv("DB_HOST", "db_postgres" if IN_DOCKER else None),
            "PORT": os.getenv("DB_PORT", "5432"),
        }
    }

# ==========================
# 🔐 Validação de senha
# ==========================

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ==========================
# 🌍 Internacionalização
# ==========================

LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

# ==========================
# 🖼️ Arquivos estáticos
# ==========================

STATIC_URL = "/static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
if DEBUG:
    STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"
else:
    STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ==========================
# 🔒 JWT e REST Framework
# ==========================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
        "rest_framework.parsers.FormParser",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "login": "10/min",
        "sms_reset": "3/hour",
    },
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# ==========================
# ⚡ Cache (Redis / LocMem)
# ==========================
USE_REDIS_CACHE = os.getenv("USE_REDIS_CACHE", "1").lower() in ("true", "1", "yes")
CACHE_URL = os.getenv("CACHE_URL", "redis://redis:6379/1")
SELECTION_PROCESS_CACHE_TTL = int(os.getenv("SELECTION_PROCESS_CACHE_TTL", "120"))

if USE_REDIS_CACHE:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": CACHE_URL,
            "KEY_PREFIX": "selecao",
            "TIMEOUT": 300,
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "selecao-local-cache",
        }
    }

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,               # Novo refresh token a cada renovação
    'BLACKLIST_AFTER_ROTATION': True,            # Invalida tokens antigos
    'UPDATE_LAST_LOGIN': True,                   # Atualiza último login
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    # Configurações adicionais para melhorar compatibilidade
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',
    # Adiciona leeway para evitar problemas de sincronização de clock
    'LEEWAY': 60,  # 60 segundos de tolerância para diferenças de clock
}


# ==========================
# 🌐 CRFS
# ==========================

# Acesso por IP ou URL extra (ex.: http://app.example.com:3002): defina EXTRA_ORIGINS no .env separado por vírgulas
_extra_origins = _split_hosts(os.getenv("EXTRA_ORIGINS", ""))

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
] + _extra_origins

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

# ==========================
# 🌐 CORS
# ==========================

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
] + _extra_origins

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# Permitir tudo em dev
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
    REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"].append(
        "rest_framework.renderers.BrowsableAPIRenderer"
    )

# ==========================
# 🧾 Logging básico
# ==========================

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
}

# ==========================
# 📚 Configuração do drf-spectacula
# ==========================

SPECTACULAR_SETTINGS = {
    'TITLE': 'API da Seleção Simplificada',
    'DESCRIPTION': (
        'API do sistema de seleção de estagiários da Seleção Simplificada.\n\n'
        '## Interfaces\n'
        '- **Swagger UI:** `/api/docs/`\n'
        '- **ReDoc:** `/api/redoc/`\n'
        '- **Schema OpenAPI:** `/api/schema/`\n\n'
        '## Autenticação\n'
        '- **JWT Bearer** (`Authorization: Bearer <access>`): candidatos e administradores.\n'
        '- **Token de integração** (`Authorization: Bearer <token>` ou `X-Integration-Token`): '
        'somente `/api/integration/`.\n\n'
        'Documentação em Markdown: pastas `docs/` na raiz do monorepo, '
        '`back-end-selecao/docs/` e `front-end-selecao/docs/`.'
    ),
    'VERSION': '1.0.0',
    # Docs OpenAPI apenas para staff (evita mapeamento anônimo da API)
    'SERVE_PERMISSIONS': ['rest_framework.permissions.IsAdminUser'],
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'TAGS': [
        {'name': 'Administração', 'description': 'Administradores: login, registro e CRUD.'},
        {'name': 'Candidatos', 'description': 'Candidatos: autenticação, perfil e reset de senha.'},
        {'name': 'Processos seletivos', 'description': 'Processos seletivos, status e vencedores.'},
        {'name': 'Inscrições', 'description': 'Inscrições, avaliações, ranking e decisões.'},
        {'name': 'Editais', 'description': 'Documentos de edital dos processos.'},
        {'name': 'Integração externa', 'description': 'Atividades exportadas para o sistema externo.'},
        {'name': 'Autenticação JWT', 'description': 'Renovação de access token (refresh).'},
    ],
    'SECURITY': [{'jwtAuth': []}],
    'APPEND_COMPONENTS': {
        'securitySchemes': {
            'jwtAuth': {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
                'description': 'JWT SimpleJWT. Header: `Authorization: Bearer <access_token>`.',
            },
            'integrationToken': {
                'type': 'apiKey',
                'in': 'header',
                'name': 'Authorization',
                'description': (
                    'Token estático de integração externa. '
                    'Use `Bearer <token>`, o token puro, ou o header `X-Integration-Token`.'
                ),
            },
        }
    },
}

# ==========================
# 📧 Configurações de Email
# ==========================

EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() in ('true', '1', 'yes')
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', 'False').lower() in ('true', '1', 'yes')
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)

# ==========================
# 📱 SMS (recuperação de senha)
# ==========================

SMS_PROVIDER = os.getenv("SMS_PROVIDER", "console").strip().lower()
ISEND_TOKEN = os.getenv("ISEND_TOKEN", "")
ISEND_USERNAME = os.getenv("ISEND_USERNAME", "")
ISEND_PASSWORD = os.getenv("ISEND_PASSWORD", "")
ISEND_WSDL = os.getenv(
    "ISEND_WSDL",
    "http://www2.isend.com.br/SendWSImplService/SendWSImpl?wsdl",
)
ISEND_AUTH_WSDL = os.getenv(
    "ISEND_AUTH_WSDL",
    "http://www2.isend.com.br/iSend/ws/PartnerSendIntegrationWs?wsdl",
)
ISEND_TOKEN_TTL = int(os.getenv("ISEND_TOKEN_TTL", "43200"))  # 12 horas
SMS_VERIFICATION_TTL = int(os.getenv("SMS_VERIFICATION_TTL", "300"))
SMS_VERIFICATION_LENGTH = int(os.getenv("SMS_VERIFICATION_LENGTH", "6"))
SMS_VERIFICATION_MAX_ATTEMPTS = int(os.getenv("SMS_VERIFICATION_MAX_ATTEMPTS", "5"))
SMS_VERIFICATION_RESEND_COOLDOWN = int(os.getenv("SMS_VERIFICATION_RESEND_COOLDOWN", "60"))
SMS_DEBUG_EXPOSE_ERRORS = os.getenv("SMS_DEBUG_EXPOSE_ERRORS", "").lower() in (
    "true",
    "1",
    "yes",
)

# ==========================
# 🐇 Configurações Celery
# ==========================

CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'amqp://guest:guest@localhost:5672//')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'America/Sao_Paulo'
CELERY_ENABLE_UTC = False
CELERY_TASK_DEFAULT_QUEUE = 'celery'
CELERY_TASK_ROUTES = {
    'selection.tasks.send_password_reset_sms': {'queue': 'sms'},
}

# Configurações do Celery Beat
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'

# =========================
# 🌐 Configurações do Frontend
# =========================

FRONTEND_URL = "http://localhost:3000"
SUPPORT_EMAIL = "contato@example.com"
DEFAULT_FROM_EMAIL = "Seleção Simplificada <contato@example.com>"