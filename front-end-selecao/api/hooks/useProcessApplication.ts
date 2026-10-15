// api/hooks/useProcessApplications.ts
import { Application } from '@/api/types/application';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ApplicationsStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}

interface UseProcessApplicationsOptions {
    enabled?: boolean;
    refetchOnMount?: boolean;
}

interface DrfApplicationsPage {
    results?: Application[];
    next?: string | null;
}

/** Agrega todas as páginas da API DRF (`results` + `next`). */
async function fetchAllPaginated(firstUrl: string, headers: Record<string, string>): Promise<Application[]> {
    const all: Application[] = [];
    let url: string | null = firstUrl;
    while (url) {
        const res: Response = await fetch(url, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = (await res.json()) as Application[] | DrfApplicationsPage;
        if (Array.isArray(data)) {
            all.push(...data);
            break;
        }
        if (Array.isArray(data.results)) {
            all.push(...data.results);
        }
        const next = data.next;
        url = typeof next === 'string' && next.length > 0 ? next : null;
    }
    return all;
}

const fetchProcessApplications = async (
    processId: number,
    processSlug?: string
): Promise<Application[]> => {
    const raw = document.cookie
        .split('; ')
        .find((row) => row.startsWith('admin-access-token='))
        ?.split('=')[1];
    const accessToken = raw ? decodeURIComponent(raw) : null;

    if (!accessToken) {
        throw new Error('Token de acesso não encontrado');
    }

    const base = (process.env.NEXT_PUBLIC_DJANGO_API_URL || '').replace(/\/$/, '');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
    };

    /**
     * Ranking (admin): retorna todas as inscrições do processo num único JSON — sem PAGE_SIZE=20.
     * Alinha com `enrollments_count` na listagem de processos.
     */
    if (processSlug) {
        try {
            const res = await fetch(
                `${base}/api/selection/applications/process/${encodeURIComponent(processSlug)}/ranking/`,
                { headers }
            );
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data?.results)) {
                    return data.results.filter(
                        (app: Application) =>
                            app.selection_process?.id === processId ||
                            app.selection_process?.slug === processSlug
                    );
                }
            }
        } catch {
            /* fallback abaixo */
        }
    }

    const endpoints = [`${base}/api/selection/applications/?selection_process=${processId}`];

    for (const endpoint of endpoints) {
        try {
            const applicationsData = await fetchAllPaginated(endpoint, headers);
            return applicationsData.filter(
                (app) =>
                    app.selection_process?.id === processId ||
                    (processSlug != null && app.selection_process?.slug === processSlug)
            );
        } catch {
            /* tenta fallback global */
        }
    }

    const allApplications = await fetchAllPaginated(`${base}/api/selection/applications/`, headers);
    return allApplications.filter(
        (app) =>
            app.selection_process?.id === processId ||
            (processSlug != null && app.selection_process?.slug === processSlug)
    );
};

const calculateStats = (applications: Application[]): ApplicationsStats => {
    return {
        total: applications.length,
        pending: applications.filter(app => app.status === 'pending').length,
        approved: applications.filter(app => app.status === 'approved').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
    };
};

export const useProcessApplications = (
    processId?: number,
    processSlug?: string,
    options: UseProcessApplicationsOptions = {}
) => {
    const queryClient = useQueryClient();
    const enabled = options.enabled ?? true;

    const queryKey = processId
        ? ['process-applications', processId]
        : processSlug
            ? ['process-applications', processSlug]
            : ['process-applications'];

    const {
        data: applications = [],
        isLoading,
        isError,
        error,
        refetch,
        isRefetching,
    } = useQuery<Application[], Error>({
        queryKey,
        queryFn: () => {
            if (!processId && !processSlug) {
                throw new Error('Process ID ou Slug é necessário');
            }
            return fetchProcessApplications(processId!, processSlug);
        },
        enabled: enabled && (!!processId || !!processSlug),
        staleTime: 2 * 60 * 1000, // 2 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos
        refetchOnWindowFocus: false,
        retry: 1,
        ...options,
    });

    // Função para invalidar o cache deste processo
    const invalidateCache = () => {
        queryClient.invalidateQueries({ queryKey });
    };

    // Função para atualizar manualmente
    const refresh = () => {
        return refetch();
    };

    // Função para buscar todas e filtrar (fallback)
    const fetchAllAndFilter = async () => {
        if (!processId) return;

        const raw = document.cookie
            .split('; ')
            .find((row) => row.startsWith('admin-access-token='))
            ?.split('=')[1];
        const accessToken = raw ? decodeURIComponent(raw) : null;

        if (!accessToken) {
            throw new Error('Token de acesso não encontrado');
        }

        const base = (process.env.NEXT_PUBLIC_DJANGO_API_URL || '').replace(/\/$/, '');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        };

        const allApplications = await fetchAllPaginated(`${base}/api/selection/applications/`, headers);

        const filtered = allApplications.filter(
            (app) =>
                app.selection_process?.id === processId ||
                (processSlug != null && app.selection_process?.slug === processSlug)
        );

        queryClient.setQueryData(queryKey, filtered);
        return filtered;
    };

    const stats = calculateStats(applications);

    return {
        // Dados
        applications,
        stats,

        // Status
        isLoading,
        isError,
        error: error?.message || null,
        isRefetching,

        // Ações
        refetch: refresh,
        invalidateCache,
        fetchAllAndFilter,

        // Utilitários
        isEmpty: applications.length === 0,
        hasPending: stats.pending > 0,
        hasApproved: stats.approved > 0,
        hasRejected: stats.rejected > 0,

        // Status específicos
        pendingApplications: applications.filter(app => app.status === 'pending'),
        approvedApplications: applications.filter(app => app.status === 'approved'),
        rejectedApplications: applications.filter(app => app.status === 'rejected'),
    };
};

// Hook otimizado para modais (com auto-refresh desabilitado)
export const useProcessApplicationsModal = (
    processId?: number,
    processSlug?: string,
    isModalOpen?: boolean
) => {
    return useProcessApplications(processId, processSlug, {
        enabled: isModalOpen && (!!processId || !!processSlug),
        refetchOnMount: false,
    });
};