// api/endpoints/candidate.ts
import { apiClient } from '../client';
import { Candidate } from '../types/candidate';

export const candidateApi = {
    /**
     * Busca os dados do candidato pelo ID
     */
    getById: async (id: number): Promise<Candidate> => {
        return await apiClient.get<Candidate>(`/api/selection/candidates/${id}/`);
    },


    /**
     * Cria um novo candidato (para uso administrativo)
     */
    create: async (data: Partial<Candidate>): Promise<Candidate> => {
        return await apiClient.post<Candidate>('/api/selection/candidates/', data, {
            requireAuth: true,
        });
    },

    /**
     * Deleta um candidato (para uso administrativo)
     */
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/selection/candidates/${id}/`, {
            requireAuth: true,
        });
    },

    /**
     * Lista todos os candidatos (para uso administrativo)
     */
    list: async (): Promise<Candidate[]> => {
        return await apiClient.get<Candidate[]>('/api/selection/candidates/', {
            requireAuth: true,
        });
    },
};