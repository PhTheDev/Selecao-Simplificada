// api/endpoints/selectionProcess.ts
import { apiClient } from '@/api/client';
import { publicApiClient } from '@/api/publicClient';
import { SelectionProcess } from '../types/selection';

export const selectionProcessApi = {
    // Get all selection processes (público - não requer autenticação)
    getAll: async (): Promise<SelectionProcess[]> => {
        const response = await publicApiClient.get<{ results: SelectionProcess[] }>('/api/selection/selection-processes/');
        return response.results || response;
    },

    // Get active selection processes (público)
    getActive: async (): Promise<SelectionProcess[]> => {
        const processes = await selectionProcessApi.getAll();
        return processes.filter(process => process.is_active);
    },

    // Get single selection process by ID (público)
    getById: async (id: number): Promise<SelectionProcess> => {
        return await publicApiClient.get<SelectionProcess>(`/api/selection/selection-processes/${id}/`);
    },

    // Get by slug (público)
    getBySlug: async (slug: string): Promise<SelectionProcess> => {
        const processes = await selectionProcessApi.getAll();
        const process = processes.find(p => p.slug === slug);
        if (!process) {
            throw new Error(`Selection process with slug "${slug}" not found`);
        }
        return process;
    },

    // Create selection process (requer autenticação - admin apenas)
    create: async (data: Partial<SelectionProcess>): Promise<SelectionProcess> => {
        return await apiClient.post<SelectionProcess>('/api/selection/selection-processes/', data, {
            requireAuth: true,
        });
    },

    // Update selection process (requer autenticação - admin apenas)
    update: async (id: number, data: Partial<SelectionProcess>): Promise<SelectionProcess> => {
        return await apiClient.patch<SelectionProcess>(`/api/selection/selection-processes/${id}/`, data, {
            requireAuth: true,
        });
    },
};