'use client';

import { Candidate } from '@/api/types/candidate';
import { SelectionProcess } from '@/api/types/selection';
import { parseLocalCalendarDate } from '@/utils/selectionProcessDates';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface BasicApplication {
  id: number;
  candidate: any;
  selection_process: any;
  status: 'pending' | 'approved' | 'rejected';
  application_date: string;
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length !== 2) return null;

  const raw = parts.pop()!.split(';').shift()!;
  return decodeURIComponent(raw);
}

export const useApplicationData = (slug: string) => {
  const router = useRouter();

  const [processData, setProcessData] = useState<SelectionProcess | null>(null);
  const [candidateData, setCandidateData] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] =
    useState<'idle' | 'checking' | 'can_apply'>('checking');

  useEffect(() => {
    setLoading(true);
    setError(null);
    setAlreadyApplied(false);
    setApplicationStatus('checking');
    setProcessData(null);
    setCandidateData(null);

    const token = getCookie('access-token');

    if (!token) {
      router.push('/auth/login-candidato');
      return;
    }

    setAccessToken(token);
    fetchData(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fetchData = async (token: string) => {
    try {
      const [processResponse, candidateResponse] = await Promise.allSettled([
        fetch(
          `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/selection-processes/slug/${slug}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          }
        ),
        fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/candidates/me/`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
      ]);

      // Processo
      if (processResponse.status === 'rejected') {
        setError('Erro ao buscar processo');
        setLoading(false);
        return;
      }

      const processResult = await processResponse.value.json();

      if (!processResponse.value.ok) {
        setError(processResult.error || 'Processo não encontrado');
        setLoading(false);
        return;
      }

      setProcessData(processResult);

      // Valida processo
      if (!validateProcess(processResult)) {
        setLoading(false);
        return;
      }

      // Candidato
      if (candidateResponse.status === 'rejected') {
        setError('Erro ao buscar dados do candidato');
        setLoading(false);
        return;
      }

      let candidate: Candidate | null = null;

      if (candidateResponse.value.ok) {
        candidate = await candidateResponse.value.json();
      } else {
        const altResponse = await fetch(
          `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/candidates/`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          }
        );

        if (altResponse.ok) {
          const data = await altResponse.json();
          candidate = data.results?.[0] || data?.[0];
        }
      }

      if (!candidate) {
        setError('Não foi possível carregar seus dados. Por favor, complete seu cadastro.');
        setLoading(false);
        return;
      }

      setCandidateData(candidate);

      // ✅ agora o backend filtra por processo
      await checkExistingApplication(token, processResult.id);
    } catch (err) {
      console.error('Erro no fetchData:', err);
      setError('Erro na requisição');
      setLoading(false);
    }
  };

  const validateProcess = (process: SelectionProcess): boolean => {
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const beginDate = parseLocalCalendarDate(process.beginning_date);
    const endDate = parseLocalCalendarDate(process.ending_date);

    if (!process.is_active) {
      setError('Este processo seletivo não está mais ativo');
      return false;
    }

    const isBeforeBegin = todayDate < beginDate;
    const isAfterEnd = todayDate > endDate;
    const isInPeriod = !isBeforeBegin && !isAfterEnd;

    if (process.status !== 'in_application' && !isInPeriod) {
      if (isBeforeBegin) setError('As inscrições para este processo seletivo ainda não foram abertas');
      else if (isAfterEnd) setError('As inscrições para este processo seletivo já foram encerradas');
      else setError('Este processo seletivo não está aceitando inscrições no momento');
      return false;
    }

    return true;
  };

  const parseApplications = (data: any): BasicApplication[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    if (data.id) return [data];
    return [];
  };

  const getProcessIdFromApp = (app: any) => {
    const sp = app.selection_process;
    if (typeof sp === 'number') return sp;
    if (sp && typeof sp === 'object' && typeof sp.id === 'number') return sp.id;
    return null;
  };

  const matchThisProcess = (app: any, processId: number) => {
    return getProcessIdFromApp(app) === processId;
  };

  const checkExistingApplication = async (token: string, processId: number): Promise<void> => {
    try {
      setApplicationStatus('checking');

      const endpoint = `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/applications/?selection_process=${processId}&_=${Date.now()}`;

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (!response.ok) {
        // se falhar, não bloqueia o usuário
        setAlreadyApplied(false);
        setApplicationStatus('can_apply');
        setError(null);
        return;
      }

      const data = await response.json();
      const applications = parseApplications(data);

      const has = applications.some((app) => matchThisProcess(app, processId));

      if (has) {
        setAlreadyApplied(true);
        setApplicationStatus('idle');
        setError('Você já possui uma candidatura para este processo');
      } else {
        setAlreadyApplied(false);
        setApplicationStatus('can_apply');
        setError(null);
      }
    } catch (err) {
      console.error('Erro ao verificar candidatura:', err);
      setAlreadyApplied(false);
      setApplicationStatus('can_apply');
    } finally {
      setLoading(false);
    }
  };

  return {
    processData,
    candidateData,
    loading,
    error,
    accessToken,
    alreadyApplied,
    applicationStatus,
    setError,
    refreshApplicationCheck: () =>
      processData && accessToken && checkExistingApplication(accessToken, processData.id),
  };
};
