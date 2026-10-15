// api/hooks/useAdministrators.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminAccessToken } from '@/utils/adminAuth';

const API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL;

export interface Administrator {
    id: number;
    user: {
        id: number;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        is_active: boolean;
    };
    full_name: string;
    email: string;
    matricula: string | null;
    role: 'super_admin';
    department: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateAdminData {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    role: string;
    is_staff: boolean;
    department: string;
    matricula: string;
}

export interface UpdateAdminData {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department?: string;
  matricula: string;
  is_active: boolean;
  password?: string;
  password_confirm?: string;
}

interface AdministratorsResponse {
    count: number;
    results: Administrator[];
    next: string | null;
    previous: string | null;
}

function extractApiErrorMessage(errorData: unknown, fallback: string): string {
    if (!errorData || typeof errorData !== 'object') return fallback;

    const data = errorData as Record<string, unknown>;
    if (typeof data.error === 'string' && data.error.trim()) return data.error;
    if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;

    for (const value of Object.values(data)) {
        if (typeof value === 'string' && value.trim()) return value;
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
            return value[0];
        }
    }

    return fallback;
}

export function useAdministrators(page: number = 1, pageSize: number = 10) {
    return useQuery({
        queryKey: ['administrators', page],
        queryFn: async () => {
            const token = getAdminAccessToken();
            if (!token) throw new Error('Token de acesso não encontrado');

            const response = await fetch(
                `${API_BASE}/api/administration/administrators/?page=${page}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Erro ao buscar administradores');
            }

            const data = await response.json() as AdministratorsResponse;
            
            // Filter valid administrators
            const validAdmins = (data.results || []).filter((admin: any) =>
                admin && admin.id && admin.user && typeof admin.user === 'object'
            );

            return {
                ...data,
                results: validAdmins,
            };
        },
    });
}

export function useCreateAdministrator() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateAdminData) => {
            const token = getAdminAccessToken();
            if (!token) throw new Error('Token de acesso não encontrado');

            if (data.password !== data.password_confirm) {
                throw new Error('As senhas não coincidem');
            }

            const response = await fetch(
                `${API_BASE}/api/administration/administrators/register/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(data),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(extractApiErrorMessage(errorData, 'Erro ao criar usuário'));
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalidate administrators list
            queryClient.invalidateQueries({ queryKey: ['administrators'] });
        },
    });
}

export function useUpdateAdministrator() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: UpdateAdminData }) => {
            const token = getAdminAccessToken();
            if (!token) throw new Error('Token de acesso não encontrado');

            const response = await fetch(
                `${API_BASE}/api/administration/administrators/${id}/`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(data),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(extractApiErrorMessage(errorData, 'Erro ao atualizar usuário'));
            }

            return response.json() as Promise<Administrator>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['administrators'] });
            queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
        },
    });
}

export function useDeleteAdministrator() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const token = getAdminAccessToken();
            if (!token) throw new Error('Token de acesso não encontrado');

            const response = await fetch(
                `${API_BASE}/api/administration/administrators/${id}/`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(extractApiErrorMessage(errorData, 'Erro ao desativar usuário'));
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['administrators'] });
        },
    });
}

