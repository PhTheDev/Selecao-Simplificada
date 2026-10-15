import os

# Garante defaults seguros para import de settings em ambiente de teste
os.environ.setdefault("DEBUG", "True")
os.environ.setdefault("SECRET_KEY", "test-insecure-secret-key-not-for-production")

from .settings import *  # noqa: F401,F403,E402


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "test_db.sqlite3",  # noqa: F405
    }
}

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "test-cache",
    }
}

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

SMS_PROVIDER = "console"
