// utils/candidateAuth.ts
'use client';

type JwtPayload = {
    exp?: number;
    [key: string]: any;
};

type RefreshResponse = {
    access?: string;
    access_token?: string; // fallback se algum endpoint devolver outro nome
};

export type AuthUserCookie = {
    id: number;
    name: string;
    email: string;
    profile_image_url?: string | null;
    profile_image?: string | null;
    full_name?: string;
    first_name?: string;
    last_name?: string;
};

const ACCESS_COOKIE = 'access-token';
const REFRESH_COOKIE = 'refresh-token';
const ADMIN_ACCESS_COOKIE = 'admin-access-token';
const AUTH_USER_COOKIE = 'auth_user';

// -------------------------
// Cookies
// -------------------------
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

function setCookie(name: string, value: string, maxAgeSeconds?: number, path: string = '/') {
    if (typeof document === 'undefined') return;
    const maxAge = typeof maxAgeSeconds === 'number' ? `; Max-Age=${maxAgeSeconds}` : '';
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    // NOTE: value já deve vir pronto (se quiser encode, faça antes).
    document.cookie = `${name}=${value}; Path=${path}; SameSite=Lax${maxAge}${secure}`;
}

function deleteCookie(name: string, path: string = '/') {
    if (typeof document === 'undefined') return;
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    document.cookie = `${name}=; Path=${path}; Max-Age=0; SameSite=Lax${secure}`;
    document.cookie = `${name}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
}

// -------------------------
// Events (para header sincronizar)
// -------------------------
export function notifyAuthUserUpdated() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event('auth_user_updated'));
}

export function notifyAuthUserLoggedIn() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event('auth_user_logged_in'));
}

export function notifyAuthUserLoggedOut() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event('auth_user_logged_out'));
}

// -------------------------
// JWT helpers
// -------------------------
function decodeJwtPayload(token: string): JwtPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        // OBS: atob espera base64 "padrão". Se seu JWT vier com base64url, geralmente funciona,
        // mas se quiser robustez total pode normalizar (-/_). Mantive simples como estava.
        const payload = JSON.parse(atob(parts[1]));
        return payload;
    } catch {
        return null;
    }
}

export function isTokenExpired(token: string, skewSeconds = 60): boolean {
    const payload = decodeJwtPayload(token);
    if (!payload?.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now + skewSeconds;
}

// -------------------------
// Tokens
// -------------------------
export function getAccessToken(): string | null {
    return getCookie(ACCESS_COOKIE);
}

export function getRefreshToken(): string | null {
    return getCookie(REFRESH_COOKIE);
}

export function hasAdminToken(): boolean {
    return Boolean(getCookie(ADMIN_ACCESS_COOKIE));
}

// -------------------------
// Auth user cookie (NOME/FOTO)
// -------------------------
export function setAuthUserCookie(user: AuthUserCookie, maxAgeSeconds: number = 60 * 60 * 24) {
    // Sempre padronizar: JSON -> encodeURIComponent
    const encoded = encodeURIComponent(JSON.stringify(user));
    setCookie(AUTH_USER_COOKIE, encoded, maxAgeSeconds, '/');
}

/**
 * Lê o auth_user do cookie.
 * Aceita:
 * - valor já encodeURIComponent(JSON.stringify())
 * - ou alguns formatos antigos com aspas/escape
 */
export function getAuthUserFromCookie(): AuthUserCookie | null {
    const raw = getCookie(AUTH_USER_COOKIE);
    if (!raw) return null;

    try {
        // 1) tenta decode normal
        let decoded = '';
        try {
            decoded = decodeURIComponent(raw);
        } catch {
            decoded = raw;
        }

        // 2) normaliza casos antigos: aspas externas e \" internos
        const cleanJson = decoded.replace(/^"|"$/g, '').replace(/\\"/g, '"');

        const data = JSON.parse(cleanJson);
        if (!data?.id || !data?.email) return null;

        const name = data.name ?? '';
        const [firstFromName, ...restNameParts] = String(name).trim().split(' ');
        const lastFromName = restNameParts.join(' ');

        return {
            id: Number(data.id),
            name,
            email: data.email ?? '',
            profile_image_url: data.profile_image_url ?? null,
            profile_image: data.profile_image ?? null,
            full_name: data.full_name ?? name,
            first_name: data.first_name ?? firstFromName ?? '',
            last_name: data.last_name ?? lastFromName ?? '',
        };
    } catch {
        return null;
    }
}

// -------------------------
// Session helpers (use no LOGIN)
// -------------------------
/**
 * ✅ Use isso no LOGIN:
 * - salva access/refresh
 * - salva auth_user (nome/email/foto)
 * - dispara eventos pra header atualizar imediatamente
 */
export function setCandidateSession(params: {
    accessToken: string;
    refreshToken: string;
    user: AuthUserCookie;
    // Você pode ajustar os maxAge conforme sua política
    accessMaxAgeSeconds?: number;  // ex: 60*60 (1h) ou 15min
    refreshMaxAgeSeconds?: number; // ex: 7 dias
    userMaxAgeSeconds?: number;    // ex: 1 dia
}) {
    const {
        accessToken,
        refreshToken,
        user,
        accessMaxAgeSeconds = 60 * 60, // 1h — alinhado ao ACCESS_TOKEN_LIFETIME do backend
        refreshMaxAgeSeconds = 60 * 60 * 24 * 7, // 7 dias
        userMaxAgeSeconds = 60 * 60, // 1h
    } = params;

    // Tokens: encodeURIComponent (igual você já fazia)
    setCookie(ACCESS_COOKIE, encodeURIComponent(accessToken), accessMaxAgeSeconds, '/');
    setCookie(REFRESH_COOKIE, encodeURIComponent(refreshToken), refreshMaxAgeSeconds, '/');

    // auth_user: encodeURIComponent(JSON.stringify())
    setAuthUserCookie(user, userMaxAgeSeconds);

    // eventos
    notifyAuthUserLoggedIn();
    notifyAuthUserUpdated();
}

/**
 * Limpa sessão do candidato (cookies) + dispara evento
 */
export function clearCandidateSession() {
    deleteCookie(ACCESS_COOKIE, '/');
    deleteCookie(REFRESH_COOKIE, '/');
    deleteCookie('candidate-id', '/');
    deleteCookie(AUTH_USER_COOKIE, '/');

    notifyAuthUserLoggedOut();
    notifyAuthUserUpdated();
}

// -------------------------
// Refresh token
// -------------------------
/**
 * ✅ REFRESH TOKEN
 * 1) tenta /api/token/refresh/
 * 2) fallback: /api/selection/auth/token/
 */
export async function refreshAccessToken(): Promise<string | null> {
    const refresh = getRefreshToken();
    if (!refresh) return null;

    const base = process.env.NEXT_PUBLIC_DJANGO_API_URL;

    const candidates = [
        `${base}/api/token/refresh/`,
        `${base}/api/selection/auth/token/`,
    ];

    for (const url of candidates) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store',
                body: JSON.stringify({ refresh: decodeURIComponent(refresh) }), // ✅ refresh estava cookie-encoded
            });

            if (!res.ok) continue;

            const data = (await res.json()) as RefreshResponse;

            const newAccess = data?.access || data?.access_token || null;
            if (!newAccess) continue;

            // salva access novo (cookie guarda encoded)
            setCookie(ACCESS_COOKIE, encodeURIComponent(newAccess), 60 * 60, '/');

            return newAccess;
        } catch {
            continue;
        }
    }

    return null;
}

/**
 * ✅ Retorna access válido (refresh se necessário).
 */
export async function getValidAccessToken(): Promise<string | null> {
    const accessRaw = getAccessToken();

    if (!accessRaw) {
        return await refreshAccessToken();
    }

    const access = decodeURIComponent(accessRaw);

    if (isTokenExpired(access)) {
        return await refreshAccessToken();
    }

    return access;
}

/**
 * ✅ Fetch com Bearer + auto-refresh em 401 (repete 1x).
 */
export async function fetchWithCandidateAuth(
    input: RequestInfo | URL,
    init: RequestInit = {}
): Promise<Response> {
    let token = await getValidAccessToken();

    const headers = new Headers(init.headers || {});
    if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }
    if (token) headers.set('Authorization', `Bearer ${token}`);

    let res = await fetch(input, { ...init, headers, cache: 'no-store' });

    // Se a API respondeu 401, tenta refresh e repete 1x
    if (res.status === 401) {
        const newAccess = await refreshAccessToken();
        if (!newAccess) return res;

        const retryHeaders = new Headers(init.headers || {});
        if (!(init.body instanceof FormData) && !retryHeaders.has('Content-Type')) {
            retryHeaders.set('Content-Type', 'application/json');
        }
        retryHeaders.set('Authorization', `Bearer ${newAccess}`);

        res = await fetch(input, { ...init, headers: retryHeaders, cache: 'no-store' });
    }

    return res;
}

/**
 * ✅ Logout:
 * - chama endpoint: POST /api/selection/candidates/logout/ com refresh_token
 * - depois limpa cookies + eventos
 */
export async function candidateLogout(): Promise<void> {
    const refreshRaw = getRefreshToken();
    const base = process.env.NEXT_PUBLIC_DJANGO_API_URL;

    try {
        if (refreshRaw) {
            const refresh = decodeURIComponent(refreshRaw);

            await fetch(`${base}/api/selection/candidates/logout/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store',
                body: JSON.stringify({ refresh_token: refresh }),
            });
        }
    } catch {
        // ignora
    } finally {
        clearCandidateSession();
    }
}
