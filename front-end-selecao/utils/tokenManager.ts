/**
 * Utilitário centralizado para gerenciamento de tokens JWT.
 * Garante que os cookies tenham o mesmo tempo de expiração dos tokens JWT.
 */

// Tempos de expiração (em segundos) - devem corresponder ao backend
export const TOKEN_EXPIRATION = {
    ACCESS: 86400,   // 1 dia (corresponde a ACCESS_TOKEN_LIFETIME)
    REFRESH: 604800,  // 7 dias (corresponde a REFRESH_TOKEN_LIFETIME)
} as const;

/**
 * Salva access token no cookie
 */
export function setAccessToken(token: string, cookieName: string = 'access-token'): void {
    if (typeof document === 'undefined') return;
    
    const secure = process.env.NODE_ENV === 'production' ? '; secure' : '';
    document.cookie = `${cookieName}=${token}; path=/; max-age=${TOKEN_EXPIRATION.ACCESS}; sameSite=lax${secure}`;
}

/**
 * Salva refresh token no cookie
 */
export function setRefreshToken(token: string, cookieName: string = 'refresh-token'): void {
    if (typeof document === 'undefined') return;
    
    const secure = process.env.NODE_ENV === 'production' ? '; secure' : '';
    document.cookie = `${cookieName}=${token}; path=/; max-age=${TOKEN_EXPIRATION.REFRESH}; sameSite=lax${secure}`;
}

/**
 * Salva ambos os tokens (access e refresh)
 */
export function setAuthTokens(
    accessToken: string, 
    refreshToken: string,
    accessCookieName: string = 'access-token',
    refreshCookieName: string = 'refresh-token'
): void {
    setAccessToken(accessToken, accessCookieName);
    setRefreshToken(refreshToken, refreshCookieName);
}

/**
 * Verifica se um token JWT está expirado (sem fazer requisição ao servidor)
 * Decodifica o payload do JWT e verifica o campo 'exp'
 */
export function isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    
    try {
        // JWT tem formato: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) return true;
        
        // Decodifica o payload (base64)
        const payload = JSON.parse(atob(parts[1]));
        
        // Verifica se tem campo 'exp' (expiration time em Unix timestamp)
        if (!payload.exp) return true;
        
        // Compara com o tempo atual (em segundos)
        const now = Math.floor(Date.now() / 1000);
        return payload.exp < now;
    } catch (error) {
        console.error('Erro ao verificar expiração do token:', error);
        return true; // Em caso de erro, considera expirado por segurança
    }
}

/**
 * Obtém o tempo restante até a expiração do token (em segundos)
 */
export function getTokenTimeRemaining(token: string | null): number {
    if (!token) return 0;
    
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return 0;
        
        const payload = JSON.parse(atob(parts[1]));
        if (!payload.exp) return 0;
        
        const now = Math.floor(Date.now() / 1000);
        const remaining = payload.exp - now;
        
        return remaining > 0 ? remaining : 0;
    } catch (error) {
        return 0;
    }
}

// Cache para evitar múltiplas renovações simultâneas
let refreshPromise: Promise<string | null> | null = null;

/**
 * Renova o access token usando o refresh token
 * Implementa cache para evitar múltiplas requisições simultâneas
 */
export async function refreshAccessToken(
    refreshToken: string,
    refreshEndpoint: string = '/api/selection/auth/token/refresh/',
    accessCookieName: string = 'access-token',
    refreshCookieName: string = 'refresh-token'
): Promise<string | null> {
    // Se já há uma renovação em andamento, aguarda ela
    if (refreshPromise) {
        return refreshPromise;
    }

    // Cria nova promessa de renovação
    refreshPromise = (async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_DJANGO_API_URL}${refreshEndpoint}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh: refreshToken }),
                }
            );

            if (!response.ok) {
                // Se o refresh token também expirou, limpa os cookies
                if (response.status === 401) {
                    if (typeof document !== 'undefined') {
                        document.cookie = `${accessCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                        document.cookie = `${refreshCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                    }
                }
                return null;
            }

            const tokenData = await response.json();
            
            // Atualiza os cookies com os novos tokens
            if (tokenData.access) {
                setAccessToken(tokenData.access, accessCookieName);
            }
            if (tokenData.refresh) {
                setRefreshToken(tokenData.refresh, refreshCookieName);
            }
            
            return tokenData.access || null;
        } catch (error) {
            console.error('Erro ao renovar token:', error);
            return null;
        } finally {
            // Limpa a promessa após 1 segundo para permitir novas renovações
            setTimeout(() => {
                refreshPromise = null;
            }, 1000);
        }
    })();

    return refreshPromise;
}

