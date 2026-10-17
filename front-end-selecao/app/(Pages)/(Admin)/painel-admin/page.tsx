'use client';

import { ApiResponse, SelectionProcess } from '@/api/types/selection';
import { useI18n } from '@/components/i18n/LanguageProvider';
import CountUp from '@/components/motion/CountUp';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import {
    AlertTriangle,
    ArrowRight,
    Calendar,
    CheckCircle,
    Clock,
    Eye,
    Flag,
    ListChecks,
    Loader2,
    Plus,
    Users,
    XCircle
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type StatusFilter = 'all' | 'active' | 'inactive';

type AnalyzeButtonState = {
  primary: {
    label: string;
    icon: any;
    enabled: boolean;
    variant: 'enabled' | 'disabled';
  };
  secondary?: {
    label: string;
    icon: any;
    enabled: boolean;
    variant: 'enabled' | 'disabled';
  };
};

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

/**
 * Parse seguro de data vindo do backend (YYYY-MM-DD).
 */
function parseProcessDates(processo: SelectionProcess) {
  const beginning = new Date(`${processo.beginning_date}T00:00:00`);
  const ending = new Date(`${processo.ending_date}T23:59:59`);
  const today = new Date();
  return { beginning, ending, today };
}

/**
 * Estado dos botões:
 * - primary: “analisar inscrições” (só quando acabou inscrição e não finalizou)
 * - secondary: “Abrir Análise” (somente quando status finished)
 */
function getAnalyzeButtonState(processo: SelectionProcess): AnalyzeButtonState {
  if (!processo.is_active) {
    return {
      primary: { label: 'Inativo', icon: XCircle, enabled: false, variant: 'disabled' },
    };
  }

  const { beginning, ending, today } = parseProcessDates(processo);

  const secondary =
    processo.status === 'finished'
      ? { label: 'Abrir Análise', icon: Eye, enabled: true, variant: 'enabled' as const }
      : undefined;

  if (processo.status === 'finished') {
    return {
      primary: { label: 'Finalizado', icon: Flag, enabled: false, variant: 'disabled' },
      secondary,
    };
  }

  if (today < beginning) {
    return {
      primary: { label: 'Aguardando início', icon: Calendar, enabled: false, variant: 'disabled' },
      secondary,
    };
  }

  if (today >= beginning && today <= ending) {
    return {
      primary: { label: 'Inscrições abertas', icon: Clock, enabled: false, variant: 'disabled' },
      secondary,
    };
  }

  return {
    primary: { label: 'Analisar inscrições', icon: ListChecks, enabled: true, variant: 'enabled' },
    secondary,
  };
}

/**
 * Status badge da UI (datas + finished + inactive)
 */
function getStatusBadgeInfo(processo: SelectionProcess) {
  if (!processo.is_active) {
    return {
      status: 'inactive',
      label: 'Inativo',
      color: 'bg-destructive',
      icon: XCircle,
      textColor: 'text-white',
    };
  }

  if (processo.status === 'finished') {
    return {
      status: 'finished',
      label: 'Finalizado',
      color: 'bg-muted-foreground',
      icon: Flag,
      textColor: 'text-white',
    };
  }

  const { beginning, ending, today } = parseProcessDates(processo);

  if (today < beginning) {
    return {
      status: 'created',
      label: 'Criado',
      color: 'bg-primary',
      icon: Calendar,
      textColor: 'text-white',
    };
  }

  if (today >= beginning && today <= ending) {
    const daysUntilEnd = Math.ceil((ending.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilEnd <= 7 && daysUntilEnd >= 0) {
      return {
        status: 'expiring',
        label: 'Expirando',
        color: 'bg-warning',
        icon: AlertTriangle,
        textColor: 'text-white',
      };
    }

    return {
      status: 'in_application',
      label: 'Em Inscrição',
      color: 'bg-success',
      icon: CheckCircle,
      textColor: 'text-white',
    };
  }

  return {
    status: 'in_analysis',
    label: 'Em Análise',
    color: 'bg-warning',
    icon: ListChecks,
    textColor: 'text-white',
  };
}

function formatDate(dateString: string, locale = 'pt-BR') {
  return new Date(dateString).toLocaleDateString(locale);
}

function byNewest(a: SelectionProcess, b: SelectionProcess) {
  // fallback por created_at se existir, senão por id
  const da = (a as any).created_at ? new Date((a as any).created_at).getTime() : a.id;
  const db = (b as any).created_at ? new Date((b as any).created_at).getTime() : b.id;
  return db - da;
}

export default function PainelAdmin() {
  const { t, lang } = useI18n();
  const loc = lang === 'en' ? 'en-US' : 'pt-BR';
  const [processos, setProcessos] = useState<SelectionProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filtros locais do dashboard
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const fetchAllFirstPage = async () => {
    try {
      setLoading(true);
      setError(null);

      const accessToken = getCookieValue('admin-access-token');
      if (!accessToken) {
        setError('Token de acesso não encontrado');
        return;
      }

      // Dashboard precisa só de “visão geral”: primeira página já ajuda.
      // Se quiser visão 100% global, você pode iterar páginas depois.
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/selection-processes/?page=1`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${decodeURIComponent(accessToken)}`,
          },
        }
      );

      if (!response.ok) {
        setError('Erro ao carregar dashboard');
        return;
      }

      const data: ApiResponse<SelectionProcess> = await response.json();
      setProcessos(Array.isArray(data?.results) ? data.results : []);
    } catch {
      setError('Erro na requisição');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProcessos = useMemo(() => {
    return processos.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.subtitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && p.is_active) ||
        (statusFilter === 'inactive' && !p.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [processos, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = processos.length;
    const inactive = processos.filter((p) => !p.is_active).length;
    const active = processos.filter((p) => p.is_active).length;

    const inApplication = processos.filter((p) => getStatusBadgeInfo(p).status === 'in_application').length;
    const expiring = processos.filter((p) => getStatusBadgeInfo(p).status === 'expiring').length;
    const inAnalysis = processos.filter((p) => getStatusBadgeInfo(p).status === 'in_analysis').length;
    const finished = processos.filter((p) => getStatusBadgeInfo(p).status === 'finished').length;
    const created = processos.filter((p) => getStatusBadgeInfo(p).status === 'created').length;

    return { total, active, inactive, inApplication, expiring, inAnalysis, finished, created };
  }, [processos]);

  // ações rápidas
  const quickActions = useMemo(() => {
    const expiringList = processos
      .filter((p) => getStatusBadgeInfo(p).status === 'expiring')
      .sort(byNewest)
      .slice(0, 4);

    const analyzeNow = processos
      .filter((p) => getAnalyzeButtonState(p).primary.enabled)
      .sort(byNewest)
      .slice(0, 4);

    const openAnalysis = processos
      .filter((p) => getAnalyzeButtonState(p).secondary?.enabled)
      .sort(byNewest)
      .slice(0, 4);

    const latest = processos.slice().sort(byNewest).slice(0, 6);

    return { expiringList, analyzeNow, openAnalysis, latest };
  }, [processos]);

  const goToNewProcess = () => {
    window.location.href = '/painel-admin/processos/novo';
  };

  const goToProcessList = () => {
    window.location.href = '/painel-admin/processos';
  };

  const openAnalysisPage = (slug: string) => {
    window.location.href = `/painel-admin/processos/analise/${slug}`;
  };

  const analyzeProcess = (p: SelectionProcess) => {
    const state = getAnalyzeButtonState(p);
    if (!state.primary.enabled) {
      toast.info(t(state.primary.label));
      return;
    }
    window.location.href = `/painel-admin/processos/analise/${p.slug}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-6 text-lg font-medium text-muted-foreground">{t('Carregando dashboard...')}</p>
      </div>
    );
  }

  const sections = [
    { title: 'Expirando em breve', subtitle: 'Inscrições encerrando em até 7 dias', empty: 'Nenhum processo expirando no momento.', items: quickActions.expiringList, action: 'Abrir', run: () => goToProcessList(), Icon: AlertTriangle, tone: 'text-warning bg-warning-soft' },
    { title: 'Prontos para analisar', subtitle: 'Inscrições encerradas, liberar análise', empty: 'Nenhum processo pronto para análise.', items: quickActions.analyzeNow, action: 'Analisar', run: (p: SelectionProcess) => analyzeProcess(p), Icon: ListChecks, tone: 'text-primary bg-primary-soft' },
    { title: 'Finalizados', subtitle: 'Acesso rápido à página de análise', empty: 'Nenhum processo finalizado.', items: quickActions.openAnalysis, action: 'Abrir análise', run: (p: SelectionProcess) => openAnalysisPage(p.slug), Icon: Flag, tone: 'text-muted-foreground bg-muted' },
  ];

  // distribuição por status para a barra empilhada
  const dist = [
    { key: 'in_application', label: 'Em Inscrição', n: stats.inApplication + stats.expiring, bar: 'bg-success' },
    { key: 'in_analysis', label: 'Em Análise', n: stats.inAnalysis, bar: 'bg-warning' },
    { key: 'created', label: 'Criado', n: stats.created, bar: 'bg-primary' },
    { key: 'finished', label: 'Finalizados', n: stats.finished, bar: 'bg-muted-foreground' },
    { key: 'inactive', label: 'Inativo', n: stats.inactive, bar: 'bg-destructive' },
  ];
  const distTotal = dist.reduce((a, d) => a + d.n, 0) || 1;

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-medium md:text-4xl">{t('Painel do Administrador')}</h1>
            <p className="mt-2 text-muted-foreground">{t('Visão geral dos processos seletivos e o que precisa da sua atenção.')}</p>
          </div>
          <button
            onClick={goToNewProcess}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            {t('Criar processo')}
          </button>
        </div>

        {error && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-destructive/30 bg-destructive-soft p-5">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-5 w-5" strokeWidth={1.5} />
              <span><strong>{t('Erro ao carregar')}</strong>: {error}</span>
            </div>
            <button onClick={fetchAllFirstPage} className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2 text-sm font-medium text-white">
              <Loader2 className="h-4 w-4" strokeWidth={1.5} />
              {t('Tentar Novamente')}
            </button>
          </div>
        )}

        {/* Alerta de expiração */}
        {stats.expiring > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning-soft px-5 py-4 text-warning">
            <AlertTriangle className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            <p className="text-sm font-medium">
              {t(stats.expiring === 1 ? '{n} processo com inscrições encerrando em até 7 dias.' : '{n} processos com inscrições encerrando em até 7 dias.', { n: stats.expiring })}
            </p>
          </div>
        )}

        {/* KPIs */}
        <Stagger>
          <dl className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[
              { label: 'Total', value: stats.total, Icon: Users, tone: 'bg-primary-soft text-accent-foreground' },
              { label: 'Em Inscrição', value: stats.inApplication + stats.expiring, Icon: Clock, tone: 'bg-success-soft text-success' },
              { label: 'Em Análise', value: stats.inAnalysis, Icon: ListChecks, tone: 'bg-warning-soft text-warning' },
              { label: 'Finalizados', value: stats.finished, Icon: Flag, tone: 'bg-muted text-muted-foreground' },
            ].map(({ label, value, Icon, tone }) => (
              <StaggerItem key={label} whileHover={{ y: -3 }} className="rounded-3xl border bg-card p-6 transition-shadow hover:shadow-md">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${tone}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <dd className="tabular mt-5 text-4xl font-medium leading-none tracking-tight"><CountUp value={value} /></dd>
                <dt className="mt-2 text-sm text-muted-foreground">{t(label)}</dt>
              </StaggerItem>
            ))}
          </dl>
        </Stagger>

        {/* Distribuição */}
        {stats.total > 0 && (
          <div className="rounded-3xl border bg-card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-medium">{t('Distribuição por status')}</h2>
              <p className="text-sm text-muted-foreground">{t('{n} processos na página atual', { n: processos.length })}</p>
            </div>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted">
              {dist.filter((d) => d.n > 0).map((d) => (
                <div key={d.key} className={`${d.bar} transition-all`} style={{ width: `${(d.n / distTotal) * 100}%` }} title={`${t(d.label)}: ${d.n}`} />
              ))}
            </div>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {dist.filter((d) => d.n > 0).map((d) => (
                <li key={d.key} className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${d.bar}`} />
                  {t(d.label)} <span className="tabular font-medium text-foreground">{d.n}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Atenção */}
        <div className="grid gap-6 xl:grid-cols-3">
          {sections.map((sec) => (
            <div key={sec.title} className="rounded-3xl border bg-card p-6">
              <div className="flex items-start gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${sec.tone}`}>
                  <sec.Icon className="h-4 w-4" strokeWidth={1.5} />
                </span>
                <div>
                  <h3 className="font-medium">{t(sec.title)}</h3>
                  <p className="text-sm text-muted-foreground">{t(sec.subtitle)}</p>
                </div>
              </div>

              {sec.items.length === 0 ? (
                <p className="mt-5 rounded-2xl bg-background p-5 text-center text-sm text-muted-foreground">{t(sec.empty)}</p>
              ) : (
                <ul className="mt-5 divide-y">
                  {sec.items.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-medium">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{t('Até {d}', { d: formatDate(p.ending_date, loc) })}</p>
                      </div>
                      <button
                        onClick={() => sec.run(p)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm transition-colors hover:bg-secondary"
                      >
                        {t(sec.action)} <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Processos recentes */}
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-medium">{t('Processos recentes')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('Mostrando {n} de {total} processos (na página atual).', { n: quickActions.latest.length, total: processos.length })}
              </p>
            </div>
            <button onClick={goToProcessList} className="inline-flex items-center gap-2 rounded-full border bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary">
              {t('Ver todos os processos')} <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>

          {quickActions.latest.length === 0 ? (
            <p className="mt-6 rounded-3xl border bg-card p-10 text-center text-muted-foreground">{t('Nenhum processo encontrado')}</p>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {quickActions.latest.map((p) => {
                const statusInfo = getStatusBadgeInfo(p);
                const StatusIcon = statusInfo.icon;
                const analyzeState = getAnalyzeButtonState(p);
                const PrimaryIcon = analyzeState.primary.icon;
                const canOpen = !!analyzeState.secondary?.enabled;
                const canAct = canOpen || analyzeState.primary.enabled;
                const { beginning, ending, today } = parseProcessDates(p);
                const pct = Math.min(100, Math.max(0, ((today.getTime() - beginning.getTime()) / (ending.getTime() - beginning.getTime())) * 100));

                return (
                  <div key={p.id} className="flex flex-col rounded-3xl border bg-card p-6 transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="line-clamp-2 font-medium leading-snug">{p.title}</h3>
                        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{p.course}</p>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusInfo.color} ${statusInfo.textColor}`}>
                        <StatusIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {t(statusInfo.label)}
                      </span>
                    </div>

                    <div className="mt-5">
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="tabular mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDate(p.beginning_date, loc)}</span>
                        <span>{formatDate(p.ending_date, loc)}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" strokeWidth={1.5} />
                      {t(p.number_vacancies === 1 ? '{n} vaga' : '{n} vagas', { n: p.number_vacancies })}
                    </div>

                    <div className="mt-5 flex gap-2">
                      <button onClick={goToProcessList} className="flex-1 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-secondary">
                        {t('Ver lista')}
                      </button>
                      <button
                        onClick={() => (canOpen ? openAnalysisPage(p.slug) : analyzeProcess(p))}
                        disabled={!canAct}
                        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          canAct ? 'bg-primary text-primary-foreground hover:bg-primary-hover' : 'cursor-not-allowed bg-muted text-muted-foreground/70'
                        }`}
                      >
                        {canOpen ? <Eye className="h-4 w-4" strokeWidth={1.5} /> : <PrimaryIcon className="h-4 w-4" strokeWidth={1.5} />}
                        {t(canOpen ? 'Abrir' : 'Analisar')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
