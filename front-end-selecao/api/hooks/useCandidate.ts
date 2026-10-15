'use client';

import { Candidate } from '@/api/types/candidate';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Função auxiliar para pegar cookies
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

// Função para decodificar o auth_user
function getAuthUser(): { id: number; name: string; email: string; profile_image_url: string | null } | null {
    const authUser = getCookie('auth_user');
    if (!authUser) return null;

    try {
        // Decodifica a URL encoded string
        const decoded = decodeURIComponent(authUser);
        // Remove possíveis aspas extras e parseia o JSON
        const cleanJson = decoded.replace(/^"|"$/g, '').replace(/\\"/g, '"');
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Erro ao parsear auth_user:', error);
        return null;
    }
}

// Query Keys
export const candidateKeys = {
    all: ['candidate'] as const,
    details: () => [...candidateKeys.all, 'detail'] as const,
    detail: (id: number) => [...candidateKeys.details(), id] as const,
    current: () => [...candidateKeys.details(), 'current'] as const,
};

// Hook para obter o candidate atual (baseado no usuário logado)
export function useCandidate() {
    return useQuery({
        queryKey: candidateKeys.current(),
        queryFn: async (): Promise<Candidate> => {
            // Pega o token e user dos cookies
            const accessToken = getCookie('auth_token');
            const authUser = getAuthUser();

            if (!accessToken || !authUser) {
                throw new Error('Não autenticado');
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/candidates/${authUser.id}/`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expirado, tenta renovar
                    const refreshToken = getCookie('auth_refresh');
                    if (refreshToken) {
                        const refreshResponse = await fetch(
                            `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/auth/token/refresh/`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ refresh: refreshToken }),
                            }
                        );

                        if (refreshResponse.ok) {
                            const tokenData = await refreshResponse.json();

                            // Atualiza cookie do access token (1h = 3600 segundos)
                            document.cookie = `auth_token=${tokenData.access}; path=/; max-age=3600; sameSite=lax${process.env.NODE_ENV === 'production' ? '; secure' : ''}`;
                            // Atualiza refresh token se fornecido (7 dias = 604800 segundos)
                            if (tokenData.refresh) {
                                document.cookie = `auth_refresh=${tokenData.refresh}; path=/; max-age=604800; sameSite=lax${process.env.NODE_ENV === 'production' ? '; secure' : ''}`;
                            }

                            // Tenta a requisição novamente com o novo token
                            const retryResponse = await fetch(
                                `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/candidates/${authUser.id}/`,
                                {
                                    method: 'GET',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${tokenData.access}`,
                                    },
                                }
                            );

                            if (retryResponse.ok) {
                                return retryResponse.json();
                            }
                        }
                    }
                    throw new Error('Token de autenticação inválido ou expirado');
                }
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("✅ Dados do candidato recebidos:", data);
            return data;
        },
        enabled: !!getAuthUser(), // Só busca se tiver auth_user no cookie
    });
}

// Tipo para atualização do candidato
export interface UpdateCandidateData {
    name?: string;
    cpf?: string;
    gender?: string;
    phone?: string;
    college?: string;
    period?: string;
    semester?: string;
    cep?: string;
    address?: string;
    city?: string;
    uf?: string;
    password?: string;
}

// Hook para atualizar candidate
export function useUpdateCandidate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateCandidateData | FormData) => {
            const authUser = getAuthUser();
            const accessToken = getCookie('auth_token');

            if (!authUser || !accessToken) {
                throw new Error('Não autenticado');
            }

            const isFormData = data instanceof FormData;

            // ✅ USANDO O ENDPOINT ESPECÍFICO PELO ID
            const url = `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/candidates/${authUser.id}/`;

            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: isFormData ? data : JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || errorData?.message || 'Erro ao atualizar perfil');
            }

            const updatedCandidate = await response.json();

            // Atualiza o auth_user com os novos dados
            if (updatedCandidate && !(data instanceof FormData)) {
                const currentAuthUser = getAuthUser();
                if (currentAuthUser) {
                    const updatedAuthUser = {
                        ...currentAuthUser,
                        name: data.name || currentAuthUser.name,
                        email: updatedCandidate.email || currentAuthUser.email,
                        profile_image_url: updatedCandidate.profile_image_url || currentAuthUser.profile_image_url
                    };

                    // Atualiza o cookie auth_user
                    document.cookie = `auth_user=${encodeURIComponent(JSON.stringify(updatedAuthUser))}; path=/; max-age=3600; sameSite=lax${process.env.NODE_ENV === 'production' ? '; secure' : ''}`;
                }
            }

            return updatedCandidate;
        },
        onMutate: async (newData) => {
            await queryClient.cancelQueries({ queryKey: candidateKeys.current() });
            const previousCandidate = queryClient.getQueryData(candidateKeys.current());

            // Atualiza o cache de forma otimista
            queryClient.setQueryData(candidateKeys.current(), (old: Candidate | undefined) => {
                if (!old) return old;

                if (newData instanceof FormData) {
                    return old;
                }

                return { ...old, ...newData };
            });

            return { previousCandidate };
        },
        onError: (err, newData, context) => {
            if (context?.previousCandidate) {
                queryClient.setQueryData(candidateKeys.current(), context.previousCandidate);
            }
        },
        onSuccess: (updatedCandidate) => {
            queryClient.setQueryData(candidateKeys.current(), updatedCandidate);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: candidateKeys.current() });
        },
    });
}

// Hook para buscar candidate por ID (para admin)
export function useCandidateById(id: number) {
    return useQuery({
        queryKey: candidateKeys.detail(id),
        queryFn: async (): Promise<Candidate> => {
            const accessToken = getCookie('auth_token');

            if (!accessToken) {
                throw new Error('Não autenticado');
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/candidates/${id}/`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            return response.json();
        },
        enabled: !!id,
    });
}

// Hook para criar candidate (para admin)
export function useCreateCandidate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<Candidate>) => {
            const accessToken = getCookie('auth_token');

            if (!accessToken) {
                throw new Error('Não autenticado');
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/candidates/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify(data),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || errorData?.message || 'Erro ao criar candidato');
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalida a lista de candidatos
            queryClient.invalidateQueries({ queryKey: candidateKeys.all });
        },
    });
}

// Hook para deletar candidate (para admin)
export function useDeleteCandidate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const accessToken = getCookie('auth_token');

            if (!accessToken) {
                throw new Error('Não autenticado');
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/candidates/${id}/`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || errorData?.message || 'Erro ao deletar candidato');
            }

            return id;
        },
        onSuccess: (_, id) => {
            // Remove o candidato do cache
            queryClient.removeQueries({ queryKey: candidateKeys.detail(id) });
            // Invalida a lista
            queryClient.invalidateQueries({ queryKey: candidateKeys.all });
        },
    });
}