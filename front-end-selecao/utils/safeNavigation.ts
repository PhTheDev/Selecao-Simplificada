/**
 * Helpers de segurança para URLs e redirects controlados pelo cliente.
 */

/** Aceita apenas http: e https: (bloqueia javascript:, data:, etc.). */
export function isSafeHttpUrl(url: string): boolean {
  const trimmed = (url || '').trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Só paths relativos começando com `/` e sem `//` (bloqueia open redirect).
 * Retorna `fallback` se inválido.
 */
export function safeInternalRedirect(
  redirect: string | null | undefined,
  fallback: string
): string {
  const value = (redirect || '').trim();
  if (!value) return fallback;
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('//')) return fallback;
  if (value.includes('://')) return fallback;
  return value;
}
