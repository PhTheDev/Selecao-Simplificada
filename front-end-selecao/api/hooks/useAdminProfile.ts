// api/hooks/useAdminProfile.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminAccessToken } from '@/utils/adminAuth';

const API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL;

export interface AdminData {
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
    role: string;
    department: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface UpdateAdminData {
    full_name: string;
    email: string;
    department: string;
    user: {
        first_name: string;
        last_name: string;
    };
}

export function useAdminProfile() {
    return useQuery({
        queryKey: ['admin-profile'],
        queryFn: async () => {
            const token = getAdminAccessToken();
            if (!token) throw new Error('Token de administrador não encontrado');

            const response = await fetch(
                `${API_BASE}/api/administration/administrators/me/`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Erro ao buscar dados do administrador');
            }

            return response.json() as Promise<AdminData>;
        },
    });
}

export function useUpdateAdminProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ adminId, data }: { adminId: string; data: UpdateAdminData }) => {
            const token = getAdminAccessToken();
            if (!token) throw new Error('Token ou ID do administrador não encontrado');

            // Transform data to match backend serializer format
            // Backend expects: first_name, last_name, email, department at root level (not nested in user)
            const backendData = {
                first_name: data.user.first_name,
                last_name: data.user.last_name,
                email: data.email,
                department: data.department,
            };

            const response = await fetch(
                `${API_BASE}/api/administration/administrators/${adminId}/`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(backendData),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.error || 'Erro ao atualizar perfil');
            }

            const responseData = await response.json();
            return responseData as AdminData;
        },
        onSuccess: async (data) => {
            // Backend returns partial data, so we need to refetch to get complete AdminData
            // Invalidate and refetch to ensure we have the latest data from DB
            await queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
            
            // Refetch to get complete data and update cookie
            const updatedData = await queryClient.fetchQuery({
                queryKey: ['admin-profile'],
                queryFn: async () => {
                    const token = getAdminAccessToken();
                    if (!token) throw new Error('Token de administrador não encontrado');

                    const response = await fetch(
                        `${API_BASE}/api/administration/administrators/me/`,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                            },
                        }
                    );

                    if (!response.ok) {
                        throw new Error('Erro ao buscar dados do administrador');
                    }

                    return response.json() as Promise<AdminData>;
                },
            });

            // Update cookie with new data
            if (typeof document !== 'undefined' && updatedData) {
                const userData = {
                    id: updatedData.id,
                    full_name: updatedData.full_name,
                    email: updatedData.email,
                    role: updatedData.role,
                    department: updatedData.department
                };
                document.cookie = `auth_admin=${encodeURIComponent(JSON.stringify(userData))}; path=/; max-age=${24 * 60 * 60}; sameSite=lax${process.env.NODE_ENV === 'production' ? '; secure' : ''}`;
            }
        },
    });
}

