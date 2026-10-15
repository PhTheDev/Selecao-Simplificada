// api/client.ts
import { isTokenExpired, refreshAccessToken } from '@/utils/tokenManager';

const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';

// Função auxiliar para ler cookies
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

interface RequestOptions extends RequestInit {
    requireAuth?: boolean;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async getAuthHeaders(): Promise<HeadersInit> {
        let accessToken = getCookie('django-access-token');

        // Verifica se o token está expirado ou não existe
        if (!accessToken || isTokenExpired(accessToken)) {
            const refreshToken = getCookie('django-refresh-token');
            if (refreshToken && !isTokenExpired(refreshToken)) {
                // Tenta renovar o access token
                const newAccessToken = await refreshAccessToken(
                    refreshToken,
                    '/api/selection/auth/token/refresh/',
                    'django-access-token',
                    'django-refresh-token'
                );
                if (newAccessToken) {
                    accessToken = newAccessToken;
                }
            } else {
                // Refresh token também está expirado ou não existe
                accessToken = null;
            }
        }

        const headers: HeadersInit = {};

        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        return headers;
    }

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { requireAuth = true, ...fetchOptions } = options;
        const url = `${this.baseUrl}${endpoint}`;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
        };

        // Adiciona headers de autenticação apenas se necessário
        if (requireAuth) {
            const authHeaders = await this.getAuthHeaders();
            Object.assign(headers, authHeaders);
        }

        const config: RequestInit = {
            ...fetchOptions,
            headers,
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                // Se for erro 401 (Unauthorized) e for requisição autenticada, tenta renovar
                if (response.status === 401 && requireAuth) {
                    const refreshToken = getCookie('django-refresh-token');
                    if (refreshToken && !isTokenExpired(refreshToken)) {
                        const newAccessToken = await refreshAccessToken(
                            refreshToken,
                            '/api/selection/auth/token/refresh/',
                            'django-access-token',
                            'django-refresh-token'
                        );

                        if (newAccessToken) {
                            // Tenta a requisição novamente com o novo token
                            const retryHeaders = await this.getAuthHeaders();
                            const retryConfig: RequestInit = {
                                ...config,
                                headers: {
                                    ...headers,
                                    ...retryHeaders,
                                },
                            };

                            const retryResponse = await fetch(url, retryConfig);
                            if (retryResponse.ok) {
                                return await retryResponse.json();
                            }
                        }
                    }
                }

                // Tenta parsear a mensagem de erro da API
                let errorMessage = `Erro HTTP: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorData.error || errorData.message;
                    
                    if (!errorMessage && typeof errorData === 'object' && Object.keys(errorData).length > 0) {
                        const firstKey = Object.keys(errorData)[0];
                        const firstError = errorData[firstKey];
                        const fieldName = firstKey === 'non_field_errors' ? 'Erro' : firstKey;
                        
                        if (Array.isArray(firstError)) {
                            errorMessage = `${fieldName}: ${firstError[0]}`;
                        } else if (typeof firstError === 'string') {
                            errorMessage = `${fieldName}: ${firstError}`;
                        }
                    }
                    
                    errorMessage = errorMessage || `Erro HTTP: ${response.status}`;
                } catch {
                    // Se não conseguir parsear o JSON, usa a mensagem padrão
                }

                throw new Error(errorMessage);
            }

            // Para respostas sem conteúdo (como 204 No Content)
            if (response.status === 204) {
                return {} as T;
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Métodos públicos com suporte a requireAuth
    async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    async post<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async patch<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }
}

export const apiClient = new ApiClient(API_BASE_URL);