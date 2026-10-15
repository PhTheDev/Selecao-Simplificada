// hooks/useCandidateDashboard.ts
'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchWithCandidateAuth } from '@/utils/candidateAuth';

type CandidateMe = {
    id: number;
    name: string;
    email: string;
    cpf?: string | null;
    phone?: string | null;
    college?: string | null;
    period?: string | null;
    semester?: string | null;
    cep?: string | null;
    address?: string | null;
    city?: string | null;
    uf?: string | null;
    profile_image_url?: string | null;
    profile_image?: string | null;
    is_active?: boolean;
};

export type DashboardKpis = {
    total: number;
    in_progress: number;
    approved: number;
    rejected: number;
};

export type RecentApplication = {
    id: number;
    selection_process_title: string;
    selection_process_slug?: string;
    application_date?: string;
    status: 'pending' | 'approved' | 'rejected' | string;
};

export type ProfileCompletionInfo = {
    percent: number;
    missing: Array<{ key: string; label: string }>;
};

function safeInitials(name?: string) {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || 'U';
    const second = parts.length > 1 ? parts[1]?.[0] : '';
    return (first + second).toUpperCase();
}

function calcProfileCompletion(c: CandidateMe): ProfileCompletionInfo {
    const fields = [
        { key: 'cpf', label: 'CPF' },
        { key: 'phone', label: 'Telefone' },
        { key: 'college', label: 'Faculdade' },
        { key: 'period', label: 'Período' },
        { key: 'semester', label: 'Semestre' },
        { key: 'cep', label: 'CEP' },
        { key: 'address', label: 'Endereço' },
        { key: 'city', label: 'Cidade' },
        { key: 'uf', label: 'UF' },
    ] as const;

    const missing = fields
        .filter((f) => {
            const v = (c as any)[f.key];
            return v === null || v === undefined || String(v).trim() === '';
        })
        .map((f) => ({ key: f.key, label: f.label }));

    const total = fields.length;
    const filled = total - missing.length;
    const percent = Math.round((filled / total) * 100);

    return { percent, missing };
}

export function useCandidateDashboard() {
    const [candidate, setCandidate] = useState<CandidateMe | null>(null);
    const [applications, setApplications] = useState<RecentApplication[]>([]);
    const [kpis, setKpis] = useState<DashboardKpis>({ total: 0, in_progress: 0, approved: 0, rejected: 0 });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const avatar = useMemo(() => {
        const url = candidate?.profile_image_url || candidate?.profile_image || null;
        return { url, initials: safeInitials(candidate?.name) };
    }, [candidate?.profile_image_url, candidate?.profile_image, candidate?.name]);

    const profileCompletion = useMemo(() => {
        if (!candidate) return { percent: 0, missing: [] };
        return calcProfileCompletion(candidate);
    }, [candidate]);

    useEffect(() => {
        const run = async () => {
            try {
                setLoading(true);
                setError(null);

                const meRes = await fetchWithCandidateAuth(
                    `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/candidates/me/`,
                    { method: 'GET' }
                );

                if (!meRes.ok) {
                    setError('Não foi possível carregar seu perfil.');
                    setLoading(false);
                    return;
                }

                const meData = (await meRes.json()) as CandidateMe;
                setCandidate(meData);

                // Applications (se tiver pronto)
                const appsRes = await fetchWithCandidateAuth(
                    `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/applications/`,
                    { method: 'GET' }
                );

                if (appsRes.ok) {
                    const data = await appsRes.json();
                    const results = Array.isArray(data) ? data : (data.results || []);
                    const normalized: RecentApplication[] = results.slice(0, 8).map((a: any) => ({
                        id: a.id,
                        selection_process_title: a.selection_process?.title || 'Processo seletivo',
                        selection_process_slug: a.selection_process?.slug,
                        application_date: a.application_date,
                        status: a.status,
                    }));

                    setApplications(normalized);

                    const counters = normalized.reduce(
                        (acc, item) => {
                            acc.total += 1;
                            if (item.status === 'approved') acc.approved += 1;
                            else if (item.status === 'rejected') acc.rejected += 1;
                            else acc.in_progress += 1;
                            return acc;
                        },
                        { total: 0, in_progress: 0, approved: 0, rejected: 0 } as DashboardKpis
                    );

                    setKpis(counters);
                } else {
                    setApplications([]);
                    setKpis({ total: 0, in_progress: 0, approved: 0, rejected: 0 });
                }

                setLoading(false);
            } catch {
                setError('Erro ao carregar o dashboard.');
                setLoading(false);
            }
        };

        run();
    }, []);

    return {
        candidate,
        avatar,
        applications,
        kpis,
        profileCompletion,
        loading,
        error,
    };
}
