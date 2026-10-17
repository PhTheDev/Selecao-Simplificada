'use client';

import { ApiResponse, SelectionProcess } from '@/api/types/selection';
import { Title } from '@/components/ui/Title';
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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR');
}

function byNewest(a: SelectionProcess, b: SelectionProcess) {
  // fallback por created_at se existir, senão por id
  const da = (a as any).created_at ? new Date((a as any).created_at).getTime() : a.id;
  const db = (b as any).created_at ? new Date((b as any).created_at).getTime() : b.id;
  return db - da;
}

export default function PainelAdmin() {
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
      toast.info(state.primary.label);
      return;
    }
    window.location.href = `/painel-admin/processos/analise/${p.slug}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
          <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-primary/30" />
        </div>
        <p className="mt-6 text-muted-foreground font-medium text-lg">Carregando dashboard...</p>
        <p className="text-muted-foreground/70 text-sm mt-2">Isso pode levar alguns instantes</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <Title
        title="Painel do Administrador"
        icon={Users}
      />

      {/* Erro */}
      {error && (
        <div className="bg-destructive-soft border border-destructive/30 rounded-2xl p-8 text-center shadow-sm mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive-soft rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-destructive font-semibold text-lg mb-2">Erro ao carregar</h3>
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={fetchAllFirstPage}
            className="inline-flex items-center gap-2 px-6 py-3 bg-destructive text-white font-medium rounded-xl hover:bg-destructive transition-colors"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Tentar Novamente
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 mb-6">
        <KpiCard label="Total" value={stats.total} icon={Users} tone="blue" />
        <KpiCard label="Ativos" value={stats.active} icon={CheckCircle} tone="green" />
        <KpiCard label="Em Inscrição" value={stats.inApplication} icon={Clock} tone="emerald" />
        <KpiCard label="Expirando" value={stats.expiring} icon={AlertTriangle} tone="amber" />
        <KpiCard label="Em Análise" value={stats.inAnalysis} icon={ListChecks} tone="orange" />
        <KpiCard label="Finalizados" value={stats.finished} icon={Flag} tone="gray" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <QuickList
          title="⚠️ Expirando em breve"
          subtitle="Processos com inscrições encerrando em até 7 dias"
          emptyText="Nenhum processo expirando no momento."
          items={quickActions.expiringList}
          actionLabel="Abrir"
          onAction={() => (window.location.href = '/painel-admin/processos')}
        />

        <QuickList
          title="🧾 Prontos para analisar"
          subtitle="Inscrições encerradas — liberar análise"
          emptyText="Nenhum processo pronto para análise."
          items={quickActions.analyzeNow}
          actionLabel="Analisar"
          onAction={(p) => analyzeProcess(p)}
        />

        <QuickList
          title="🏁 Finalizados"
          subtitle="Acesso rápido à página de análise"
          emptyText="Nenhum processo finalizado."
          items={quickActions.openAnalysis}
          actionLabel="Abrir análise"
          onAction={(p) => openAnalysisPage(p.slug)}
        />
      </div>

      {/* Últimos processos (mini cards) */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Visão rápida</h2>
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredProcessos.length} de {processos.length} processos (na página atual).
            </p>
          </div>

          <button
            onClick={goToNewProcess}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:shadow-md hover:scale-[1.02] transition-all"
          >
            <Plus className="w-5 h-5" />
            Criar processo
          </button>
        </div>

        {filteredProcessos.length === 0 ? (
          <div className="bg-background border border-border rounded-xl p-10 text-center">
            <h3 className="text-foreground font-semibold text-lg mb-2">Nenhum processo encontrado</h3>
            <p className="text-muted-foreground mb-4">Tente ajustar a busca/filtros.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="px-6 py-3 rounded-xl bg-card border border-border text-foreground/80 hover:bg-background hover:shadow transition-all"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {quickActions.latest.map((p) => {
              const statusInfo = getStatusBadgeInfo(p);
              const StatusIcon = statusInfo.icon;
              const analyzeState = getAnalyzeButtonState(p);
              const PrimaryIcon = analyzeState.primary.icon;

              return (
                <div key={p.id} className="border border-border rounded-2xl p-5 hover:shadow-md transition-all bg-card">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-foreground line-clamp-2">{p.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{p.course}</p>
                    </div>

                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${statusInfo.color} ${statusInfo.textColor}`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground/70" />
                      <span>
                        {formatDate(p.beginning_date)} → {formatDate(p.ending_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground/70" />
                      <span>{p.number_vacancies} vaga(s)</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => window.location.href = `/painel-admin/processos`}
                      className="flex-1 px-4 py-2 rounded-xl bg-card border border-border text-foreground/80 hover:bg-background hover:shadow transition-all"
                    >
                      Ver lista
                    </button>

                    <button
                      onClick={() => {
                        if (analyzeState.secondary?.enabled) return openAnalysisPage(p.slug);
                        return analyzeProcess(p);
                      }}
                      disabled={!analyzeState.primary.enabled && !analyzeState.secondary?.enabled}
                      className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                        analyzeState.secondary?.enabled || analyzeState.primary.enabled
                          ? 'bg-primary text-primary-foreground hover:shadow hover:scale-[1.01]'
                          : 'bg-muted text-muted-foreground/70 cursor-not-allowed'
                      }`}
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        {analyzeState.secondary?.enabled ? <Eye className="w-4 h-4" /> : <PrimaryIcon className="w-4 h-4" />}
                        {analyzeState.secondary?.enabled ? 'Abrir' : 'Analisar'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={goToProcessList}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium bg-card border border-border text-foreground/80 hover:bg-background hover:shadow transition-all"
          >
            Ver todos os processos
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------ UI components ------------------ */

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: any;
  tone: 'blue' | 'green' | 'emerald' | 'amber' | 'orange' | 'gray';
}) {
  const toneMap: Record<string, { bg: string; iconBg: string; icon: string }> = {
    blue: { bg: 'from-primary-soft to-primary-soft', iconBg: 'bg-primary-soft', icon: 'text-primary' },
    green: { bg: 'from-success-soft to-success-soft', iconBg: 'bg-success-soft', icon: 'text-success' },
    emerald: { bg: 'from-success-soft to-primary-soft', iconBg: 'bg-success-soft', icon: 'text-success' },
    amber: { bg: 'from-warning-soft to-warning-soft', iconBg: 'bg-warning-soft', icon: 'text-warning' },
    orange: { bg: 'from-warning-soft to-warning-soft', iconBg: 'bg-warning-soft', icon: 'text-warning' },
    gray: { bg: 'from-background to-background', iconBg: 'bg-muted', icon: 'text-foreground/80' },
  };

  const t = toneMap[tone];

  return (
    <div className={`bg-gradient-to-br ${t.bg} rounded-2xl border border-border shadow-sm p-5`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground font-medium">{label}</div>
          <div className="text-3xl font-bold text-foreground mt-1">{value}</div>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${t.iconBg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${t.icon}`} />
        </div>
      </div>
    </div>
  );
}

function QuickList({
  title,
  subtitle,
  items,
  emptyText,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  items: SelectionProcess[];
  emptyText: string;
  actionLabel: string;
  onAction: (p: SelectionProcess) => void;
}) {
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-background border border-border rounded-xl p-6 text-sm text-muted-foreground text-center">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => {
            const statusInfo = getStatusBadgeInfo(p);
            const StatusIcon = statusInfo.icon;

            return (
              <div key={p.id} className="border border-border rounded-xl p-4 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-foreground line-clamp-1">{p.title}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1">{p.course}</div>
                    <div className="text-xs text-muted-foreground mt-1">Até {formatDate(p.ending_date)}</div>
                  </div>

                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${statusInfo.color} ${statusInfo.textColor}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusInfo.label}
                  </span>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => onAction(p)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-foreground/80 hover:bg-background hover:shadow transition-all"
                  >
                    {actionLabel}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
