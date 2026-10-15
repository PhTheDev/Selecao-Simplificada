"""Versionamento do cache de listagem/detalhe de processos seletivos."""

from django.core.cache import cache

SELECTION_PROCESS_CACHE_VERSION_KEY = "selection_process:version"


def bump_selection_process_cache_version() -> None:
    """Incrementa a versão global; chaves antigas deixam de ser usadas."""
    try:
        cache.incr(SELECTION_PROCESS_CACHE_VERSION_KEY)
    except ValueError:
        cache.set(SELECTION_PROCESS_CACHE_VERSION_KEY, 2, None)
