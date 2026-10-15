// api/hooks/useCreateProcess.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminAccessToken } from '@/utils/adminAuth';
import { selectionProcessKeys } from './useSelectionProcess';

const API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL;

interface CreateProcessData {
    formData: Record<string, any>;
    bannerFile?: File | null;
    noticeDocFiles?: File[];   // ✅ array de arquivos
}

export function useCreateProcess() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ formData, bannerFile, noticeDocFiles = [] }: CreateProcessData) => {
            const token = getAdminAccessToken();
            if (!token) throw new Error('Token de acesso não encontrado. Faça login novamente.');

            const submitData = new FormData();

            // 📝 Campos comuns
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    submitData.append(key, value.toString());
                }
            });

            // 🖼️ Banner
            if (bannerFile) {
                submitData.append('process_banner', bannerFile);
            }

            // 📂 Múltiplos documentos do edital – mesmo nome para todos
            noticeDocFiles.forEach((file) => {
                submitData.append('notice_doc_files', file);
            });

            const response = await fetch(
                `${API_BASE}/api/selection/selection-processes/`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: submitData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                let errorMessage = errorData.detail || errorData.message || errorData.error;
                
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
                
                throw new Error(errorMessage || 'Erro ao criar processo seletivo');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: selectionProcessKeys.lists() });
        },
    });
}