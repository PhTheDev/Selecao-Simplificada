import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminAccessToken } from '@/utils/adminAuth';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL;

export function useDeleteNoticeDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (documentId: number) => {
            const token = getAdminAccessToken();
            if (!token) throw new Error('Token de acesso não encontrado');

            const response = await fetch(
                `${API_BASE}/api/selection/notice-documents/${documentId}/`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.detail || 'Erro ao remover documento');
            }

            return documentId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['selection-processes'] });
            toast.success('Documento removido com sucesso');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}