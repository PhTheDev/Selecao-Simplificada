// api/hooks/useSelectionProcess.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { selectionProcessApi } from '../endpoints/selectionProcess';
import { SelectionProcess } from '../types/selection';

// Query Keys
export const selectionProcessKeys = {
    all: ['selection-processes'] as const,
    lists: () => [...selectionProcessKeys.all, 'list'] as const,
    list: (filters: string) => [...selectionProcessKeys.lists(), { filters }] as const,
    details: () => [...selectionProcessKeys.all, 'detail'] as const,
    detail: (id: number) => [...selectionProcessKeys.details(), id] as const,
    bySlug: (slug: string) => [...selectionProcessKeys.details(), 'slug', slug] as const,
    active: () => [...selectionProcessKeys.lists(), 'active'] as const,
};

// Hooks para dados públicos (não requerem autenticação)
export function useSelectionProcesses() {
    return useQuery({
        queryKey: selectionProcessKeys.lists(),
        queryFn: () => selectionProcessApi.getAll(),
        staleTime: 2 * 60 * 1000, // 2 minutos
    });
}

export function useActiveSelectionProcesses() {
    return useQuery({
        queryKey: selectionProcessKeys.active(),
        queryFn: () => selectionProcessApi.getActive(),
        staleTime: 2 * 60 * 1000, // 2 minutos
    });
}

export function useSelectionProcess(id: number) {
    return useQuery({
        queryKey: selectionProcessKeys.detail(id),
        queryFn: () => selectionProcessApi.getById(id),
        enabled: !!id,
    });
}

export function useSelectionProcessBySlug(slug: string) {
    return useQuery({
        queryKey: selectionProcessKeys.bySlug(slug),
        queryFn: () => selectionProcessApi.getBySlug(slug),
        enabled: !!slug,
    });
}

// Hooks para operações administrativas (requerem autenticação)
export function useCreateSelectionProcess() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: selectionProcessApi.create,
        onSuccess: () => {
            // Invalida a lista de processos seletivos
            queryClient.invalidateQueries({
                queryKey: selectionProcessKeys.lists()
            });
        },
    });
}

export function useUpdateSelectionProcess() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<SelectionProcess> }) =>
            selectionProcessApi.update(id, data),
        onSuccess: (updatedProcess) => {
            // Atualiza o cache do processo específico
            queryClient.setQueryData(
                selectionProcessKeys.detail(updatedProcess.id),
                updatedProcess
            );
            // Invalida a lista
            queryClient.invalidateQueries({
                queryKey: selectionProcessKeys.lists()
            });
        },
    });
}