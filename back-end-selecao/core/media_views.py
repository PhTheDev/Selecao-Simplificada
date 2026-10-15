"""
Servir arquivos de MEDIA com controle de acesso seletivo.

Público (sem autenticação):
  - notice_docs/**
  - process_banners/**

Privado (JWT / sessão; staff ou dono):
  - candidate_<id>/**          → documentos de inscrição
  - candidate_profiles/<id>_*  → foto de perfil
  - demais paths sob MEDIA
"""
from __future__ import annotations

import mimetypes
import os
import re
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponseForbidden
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication

from selection.candidate.models import Candidate

PUBLIC_MEDIA_PREFIXES = (
    "notice_docs/",
    "process_banners/",
)

# candidate_123/...
_CANDIDATE_DOC_RE = re.compile(r"^candidate_(\d+)/")
# candidate_profiles/123_foto.jpg
_CANDIDATE_PROFILE_RE = re.compile(r"^candidate_profiles/(\d+)_")


def _normalize_media_path(path: str) -> str:
    cleaned = (path or "").replace("\\", "/").lstrip("/")
    # Bloqueia path traversal
    parts = []
    for part in cleaned.split("/"):
        if part in ("", "."):
            continue
        if part == "..":
            raise Http404("Caminho inválido")
        parts.append(part)
    return "/".join(parts)


def _is_public_media(path: str) -> bool:
    return any(path.startswith(prefix) for prefix in PUBLIC_MEDIA_PREFIXES)


def _candidate_id_from_path(path: str) -> int | None:
    match = _CANDIDATE_DOC_RE.match(path)
    if match:
        return int(match.group(1))
    match = _CANDIDATE_PROFILE_RE.match(path)
    if match:
        return int(match.group(1))
    return None


def _user_may_access_private_media(user, path: str) -> bool:
    if not user or not user.is_authenticated:
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return True

    owner_id = _candidate_id_from_path(path)
    if owner_id is None:
        # Path privado sem mapeamento de dono → apenas staff
        return False

    try:
        candidate = Candidate.objects.get(user=user)
    except Candidate.DoesNotExist:
        return False
    return candidate.id == owner_id


@api_view(["GET", "HEAD"])
@authentication_classes([JWTAuthentication, SessionAuthentication])
@permission_classes([AllowAny])
def protected_media(request, path: str):
    """
    GET /media/<path>

    Autenticação opcional (AllowAny): paths públicos passam;
    paths privados exigem JWT/sessão com posse ou staff.
    """
    try:
        relative = _normalize_media_path(path)
    except Http404:
        raise

    if not relative:
        raise Http404("Arquivo não encontrado")

    if not _is_public_media(relative):
        if not _user_may_access_private_media(request.user, relative):
            return HttpResponseForbidden("Autenticação necessária para este arquivo.")

    media_root = Path(settings.MEDIA_ROOT).resolve()
    full_path = (media_root / relative).resolve()
    try:
        full_path.relative_to(media_root)
    except ValueError:
        raise Http404("Caminho inválido")

    if not full_path.is_file():
        raise Http404("Arquivo não encontrado")

    content_type, _ = mimetypes.guess_type(str(full_path))
    response = FileResponse(
        full_path.open("rb"),
        content_type=content_type or "application/octet-stream",
    )
    response["Content-Disposition"] = f'inline; filename="{os.path.basename(full_path)}"'
    return response
