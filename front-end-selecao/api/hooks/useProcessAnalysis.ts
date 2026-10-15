'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  Application,
  PaginatedResponse,
  SelectWinnersResponse,
  SelectionProcess,
  WinnerDecisionValue,
} from '@/components/admin/process-analysis/types';

function getAdminAccessToken(): string | null {
  const raw =
    document.cookie
      .split('; ')
      .find((row) => row.startsWith('admin-access-token='))
      ?.split('=')[1] || null;

  return raw ? decodeURIComponent(raw) : null;
}

function getApiBase(): string {
  return (process.env.NEXT_PUBLIC_DJANGO_API_URL || '').replace(/\/$/, '');
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getAdminAccessToken();
  if (!token) throw new Error('Token de acesso do admin não encontrado.');

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const msg =
      data?.detail ||
      data?.error ||
      (data && typeof data === 'object' ? JSON.stringify(data) : null) ||
      `Erro HTTP ${res.status}`;
    throw new Error(msg);
  }

  // alguns endpoints podem retornar 204/sem body (não é o caso dos seus principais)
  const text = await res.text().catch(() => '');
  return (text ? JSON.parse(text) : ({} as T)) as T;
}

/** Todas as páginas do ranking (DRF pode expor `next` no futuro). */
async function fetchAllRankingApplications(processSlug: string): Promise<Application[]> {
  const all: Application[] = [];
  let url: string | null = `${getApiBase()}/api/selection/applications/process/${encodeURIComponent(processSlug)}/ranking/`;
  while (url) {
    const page: PaginatedResponse<Application> = await apiFetch<PaginatedResponse<Application>>(url, {
      method: 'GET',
    });
    if (Array.isArray(page.results)) {
      all.push(...page.results);
    }
    url = typeof page.next === 'string' && page.next.length > 0 ? page.next : null;
  }
  return all;
}

/**
 * GET /api/selection/selection-processes/{slug}/
 */
export function useProcessAnalysis(slug: string) {
  return useQuery({
    queryKey: ['process-analysis', slug],
    enabled: !!slug,
    queryFn: () =>
      apiFetch<SelectionProcess>(`${getApiBase()}/api/selection/selection-processes/${slug}/`, {
        method: 'GET',
      }),
  });
}

/**
 * GET /api/selection/applications/process/{slug}/ranking/
 * Retorna sempre Application[]
 */
export function useProcessApplications(processSlug: string) {
  return useQuery({
    queryKey: ['process-applications', processSlug],
    enabled: !!processSlug,
    queryFn: () => fetchAllRankingApplications(processSlug),
  });
}

/**
 * GET /api/selection/selection-processes/{id}/winners/
 * YAML diz "Lista de vencedores" (sem schema detalhado),
 * então normalizamos para array sempre.
 */
export function useProcessWinners(processSlug: string) {
  return useQuery({
    queryKey: ['process-winners', processSlug],
    enabled: !!processSlug,
    queryFn: async () => {
      const all = await fetchAllRankingApplications(processSlug);
      return all.filter((app) => app.is_winner === true);
    },
  });
}

/**
 * PATCH /api/selection/selection-processes/{id}/advance_to_stage2/
 */
export function useAdvanceToStage2() {
  return useMutation({
    mutationFn: (processId: number) =>
      apiFetch<{ detail?: string }>(
        `${getApiBase()}/api/selection/selection-processes/${processId}/advance_to_stage2/`,
        { method: 'PATCH' }
      ),
  });
}

/**
 * PATCH /api/selection/selection-processes/{id}/complete_analysis/
 */
export function useCompleteAnalysis() {
  return useMutation({
    mutationFn: (processId: number) =>
      apiFetch<{ detail?: string }>(
        `${getApiBase()}/api/selection/selection-processes/${processId}/complete_analysis/`,
        { method: 'PATCH' }
      ),
  });
}

/**
 * PATCH /api/selection/selection-processes/{id}/finish_process/
 */
export function useFinishProcess() {
  return useMutation({
    mutationFn: (processId: number) =>
      apiFetch<{ detail?: string }>(
        `${getApiBase()}/api/selection/selection-processes/${processId}/finish_process/`,
        { method: 'PATCH' }
      ),
  });
}

/**
 * PATCH /api/selection/selection-processes/{id}/reopen_process/
 */
export function useReopenProcess() {
  return useMutation({
    mutationFn: (processId: number) =>
      apiFetch<{ detail?: string }>(
        `${getApiBase()}/api/selection/selection-processes/${processId}/reopen_process/`,
        { method: 'PATCH' }
      ),
  });
}

/**
 * POST /api/selection/selection-processes/{id}/select_winners/
 */
export function useSelectWinners() {
  return useMutation({
    mutationFn: (processSlug: string) =>
      apiFetch<SelectWinnersResponse>(
        `${getApiBase()}/api/selection/applications/process/${processSlug}/generate_winners/`,
        { method: 'POST' }
      ),
  });
}

/**
 * POST /api/selection/applications/{id}/winner_decision/
 * ✅ YAML: WinnerDecision required: application_id, decision
 * decision enum: accepted | declined
 */
export function useWinnerDecision() {
  return useMutation({
    mutationFn: (payload: { applicationId: number; decision: WinnerDecisionValue; notes?: string | null }) =>
      apiFetch(
        `${getApiBase()}/api/selection/applications/${payload.applicationId}/winner_decision/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            application_id: payload.applicationId, // ✅ REQUIRED pelo YAML
            decision: payload.decision,
            notes: payload.notes ?? null,
          }),
        }
      ),
  });
}

/**
 * POST /api/selection/applications/process/{slug}/replace_winner/
 * YAML: ReplaceWinner required: declined_application_id, new_winner_application_id
 */
export function useReplaceWinner() {
  return useMutation({
    mutationFn: (payload: {
      processSlug: string;
      declined_application_id: number;
      new_winner_application_id: number;
      notes?: string | null;
    }) =>
      apiFetch(`${getApiBase()}/api/selection/applications/process/${payload.processSlug}/replace_winner/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          declined_application_id: payload.declined_application_id,
          new_winner_application_id: payload.new_winner_application_id,
          notes: payload.notes ?? null,
        }),
      }),
  });
}
