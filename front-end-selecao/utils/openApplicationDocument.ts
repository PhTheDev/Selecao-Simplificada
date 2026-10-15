import { toast } from 'sonner';
import { isSafeHttpUrl } from '@/utils/safeNavigation';

function getAdminBearerToken(): string | null {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie
    .split('; ')
    .find((row) => row.startsWith('admin-access-token='))
    ?.split('=')[1];
  return raw ? decodeURIComponent(raw) : null;
}

function getApiBase(): string {
  return (process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000').replace(/\/$/, '');
}

/**
 * Rewrites media URLs from the API (often Docker-internal hostnames) to the public API base.
 * Leaves non-media absolute URLs unchanged (e.g. portfolio links).
 */
export function resolveApplicationDocumentUrl(url: string | null | undefined): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('/media/')) {
    return `${getApiBase()}${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    const mediaIndex = parsed.pathname.indexOf('/media/');
    if (mediaIndex !== -1) {
      const mediaPath = parsed.pathname.slice(mediaIndex);
      return `${getApiBase()}${mediaPath}${parsed.search}`;
    }
    return trimmed;
  } catch {
    if (trimmed.includes('/media/')) {
      const mediaIndex = trimmed.indexOf('/media/');
      return `${getApiBase()}${trimmed.slice(mediaIndex)}`;
    }
    return trimmed;
  }
}

export type OpenApplicationDocumentMode = 'external' | 'authenticated-file';

/**
 * Opens a candidate document in a new tab.
 * Use `authenticated-file` for uploaded files (media) that require the admin Bearer token.
 * Use `external` for arbitrary URLs (e.g. portfolio link).
 */
export async function openApplicationDocumentUrl(
  url: string | null | undefined,
  mode: OpenApplicationDocumentMode = 'authenticated-file'
): Promise<void> {
  const trimmed = (url || '').trim();
  if (!trimmed) {
    toast.error('Documento não disponível');
    return;
  }

  if (mode === 'external') {
    if (!isSafeHttpUrl(trimmed)) {
      toast.error('URL de portfólio inválida ou não permitida');
      return;
    }
    window.open(trimmed, '_blank', 'noopener,noreferrer');
    return;
  }

  const fetchUrl = resolveApplicationDocumentUrl(trimmed);
  const token = getAdminBearerToken();
  if (!token) {
    toast.error('Token de acesso não encontrado');
    return;
  }

  try {
    const response = await fetch(fetchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      toast.error('Erro ao abrir documento');
      return;
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
  } catch {
    toast.error('Erro ao abrir documento');
  }
}
